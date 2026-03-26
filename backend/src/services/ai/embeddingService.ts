import OpenAI from 'openai';
import crypto from 'crypto';
import { queryDb } from '../../db/index.js';
import type { EmbeddingRow } from '../../types/entities.js';
import { logger } from '../../shared/logger.js';
import { config } from '../../config/environment.js';

// Initialize OpenAI client lazily to avoid startup crash if key is missing or invalid in some envs
let openai: OpenAI | null = null;
function getOpenAIClient() {
  if (!openai) {
    // Only initialize if we have the key, though openai package might default to process.env.OPENAI_API_KEY
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      openai = new OpenAI({ apiKey });
    } else {
      logger.warn('OPENAI_API_KEY not found. Operations requiring AI service will fail continuously.');
      // return a dummy or let it fail gracefully
    }
  }
  return openai;
}

export const aiMetrics = {
  embeddingSuccessCount: 0,
  embeddingFailureCount: 0,
  searchSuccessCount: 0,
  searchFailureCount: 0,
  totalTokensUsed: 0,
};

export const embeddingService = {
  /**
   * Verifies that the pgvector extension is installed and available.
   */
  async validatePgvector(): Promise<void> {
    try {
      const result = await queryDb<{ extname: string }>('SELECT extname FROM pg_extension WHERE extname = \'vector\'');
      if (result.length === 0) {
        logger.error('CRITICAL: pgvector extension is NOT installed in the database.');
        throw new Error('pgvector extension is missing');
      }
      logger.info('pgvector extension successfully validated.');
    } catch (error) {
      logger.error('Failed to validate pgvector extension', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  /**
   * Runs ANALYZE on embeddings table to update query planner statistics.
   */
  async analyzeEmbeddings(): Promise<void> {
    try {
      await queryDb('ANALYZE embeddings');
      logger.info('Successfully analyzed embeddings table.');
    } catch (error) {
      logger.warn('Failed to analyze embeddings table', { error: error instanceof Error ? error.message : String(error) });
    }
  },

  async logUsageToDb(orgId: string, model: string, tokens: number) {
    try {
      if (!orgId) return;
      const costEstimate = tokens * 0.0001;
      await queryDb(`
        INSERT INTO ai_usage_logs (organization_id, action_type, tokens, cost)
        VALUES ($1, $2, $3, $4)
      `, [orgId, `embedding_${model}`, tokens, costEstimate]);
    } catch (e) {
      logger.warn('Failed to commit usage telemetry', { error: String(e) });
    }
  },

  /**
   * Generates a vector embedding using OpenAI with retries and timeouts.
   */
  async generateEmbedding(text: string, orgIdForTelemetry?: string, retries = 3, timeoutMs = 10000): Promise<number[]> {
    let lastError: Error | null = null;
    let delayMs = 1000;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!text || text.trim() === '') {
          throw new Error('Text for embedding cannot be empty');
        }

        const client = getOpenAIClient();
        if (!client) {
          throw new Error('OpenAI client not configured');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const startTime = Date.now();
        const response = await client.embeddings.create(
          { model: 'text-embedding-3-small', input: text },
          { signal: controller.signal }
        );
        const duration = Date.now() - startTime;
        clearTimeout(timeoutId);

        aiMetrics.embeddingSuccessCount++;
        const tokens = response.usage?.total_tokens ?? 0;
        aiMetrics.totalTokensUsed += tokens;

        logger.info('OpenAI embedding generated', { durationMs: duration, tokens, attempt });
        
        if (orgIdForTelemetry) {
           await this.logUsageToDb(orgIdForTelemetry, 'text-embedding-3-small', tokens);
        }

        return response.data[0].embedding;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Embedding generation failed on attempt ${attempt}`, { error: lastError.message });
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
        }
      }
    }

    aiMetrics.embeddingFailureCount++;
    logger.error('Exhausted all retries for generating embedding', { error: lastError?.message });
    throw lastError;
  },

  /**
   * Generates an embedding and stores it in the database.
   * This is designed to be fire-and-forget safe for the core flow.
   */
  async generateAndStoreEmbedding(
    entityType: 'staff' | 'service' | 'booking',
    entityId: string,
    text: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      if (!text.trim()) {
        logger.debug('Skipping embedding storage for empty text', { entityType, entityId });
        return;
      }

      // 1. Text Hashing & Cost Control
      const textHash = crypto.createHash('sha256').update(text).digest('hex');
      
      const existing = await queryDb<{ metadata: any }>('SELECT metadata FROM embeddings WHERE entity_type = $1 AND entity_id = $2 LIMIT 1', [entityType, entityId]);
      if (existing.length > 0 && typeof existing[0].metadata === 'object' && existing[0].metadata !== null) {
        if (existing[0].metadata.text_hash === textHash) {
          logger.debug('Skipping embedding generation; text hash unchanged.', { entityType, entityId });
          return;
        }
      }

      // Generate embedding with the hardened retry/timeout wrapper
      const orgId = typeof metadata.organizationId === 'string' ? metadata.organizationId : undefined;
      const embeddingArray = await this.generateEmbedding(text, orgId);
      
      // format for pgvector inserting: '[1.1, 2.2, ...]'
      const embeddingStr = `[${embeddingArray.join(',')}]`;
      
      // Update metadata with the hash
      const finalMetadata = { ...metadata, text_hash: textHash };

      // Upsert into embeddings table
      // If an embedding for this entity already exists, we should probably update it. Let's do ON CONFLICT based on entity_type and entity_id.
      // But the schema doesn't have a UNIQUE constraint on (entity_type, entity_id). 
      // Let's first delete the old one, then insert the new one, to keep it simple, or just insert (assuming background cleanup or we just use the latest).
      // Given the schema lacks a unique constraint, a simple delete-then-insert is safest to keep only 1 active.
      
      await queryDb('DELETE FROM embeddings WHERE entity_type = $1 AND entity_id = $2', [entityType, entityId]);

      const insertSql = `
        INSERT INTO embeddings (entity_type, entity_id, embedding, metadata)
        VALUES ($1, $2, $3, $4)
      `;

      await queryDb(insertSql, [
        entityType,
        entityId,
        embeddingStr,
        JSON.stringify(finalMetadata)
      ]);

      logger.debug('Stored AI embedding successfully', { entityType, entityId });

    } catch (error) {
      // Do not re-throw, to avoid breaking the calling request flow.
      logger.error('Error during embed generation and storage (non-blocking)', {
        entityType,
        entityId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  /**
   * Search for similar entities based on a query text.
   */
  async searchSimilar(
    entityType: 'staff' | 'service' | 'booking',
    queryText: string,
    limit: number = 5,
    orgIdForTelemetry?: string
  ): Promise<(EmbeddingRow & { similarity: number })[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(queryText, orgIdForTelemetry);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      // using pgvector `<->` cosine distance operator. 
      // PostgreSQL similarity = 1 - cosine distance (for embeddings normalized to 1)
      const searchSql = `
        SELECT 
          id,
          entity_type,
          entity_id,
          metadata,
          created_at,
          1 - (embedding <-> $1) AS similarity
        FROM embeddings
        WHERE entity_type = $2
        ORDER BY embedding <-> $1
        LIMIT $3
      `;

      // Set ivfflat.probes dynamically before search to widen tree navigation recall
      await queryDb('SET LOCAL ivfflat.probes = 10;');

      const results = await queryDb<EmbeddingRow & { similarity: number }>(searchSql, [
        embeddingStr,
        entityType,
        limit
      ]);

      aiMetrics.searchSuccessCount++;
      return results;
    } catch (error) {
      aiMetrics.searchFailureCount++;
      logger.error('Similarity search failed', {
        entityType,
        limit,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
};

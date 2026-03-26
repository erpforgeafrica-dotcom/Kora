import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embeddingService } from '../services/ai/embeddingService.js';
import { queryDb } from '../db/index.js';

// Mock the dependencies
vi.mock('../db/index.js', () => ({
  queryDb: vi.fn(),
}));

const mockCreateEmbedding = vi.fn();
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      embeddings: {
        create: mockCreateEmbedding
      }
    }))
  }
});

describe('embeddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Default valid mock for openai
    mockCreateEmbedding.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }]
    });
  });

  describe('generateEmbedding', () => {
    it('throws error for empty text', async () => {
      await expect(embeddingService.generateEmbedding('')).rejects.toThrow('Text for embedding cannot be empty');
    });

    it('returns an embedding array array from openai', async () => {
      const result = await embeddingService.generateEmbedding('hello world');
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockCreateEmbedding).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'hello world'
      }, expect.any(Object));
    });

    it('retries up to 3 times on failure before succeeding', async () => {
      mockCreateEmbedding
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ data: [{ embedding: [0.9] }] });

      // Override delay for fast test
      const originalSetTimeout = global.setTimeout;
      vi.stubGlobal('setTimeout', (fn: any) => fn());

      const result = await embeddingService.generateEmbedding('retry test');
      expect(result).toEqual([0.9]);
      expect(mockCreateEmbedding).toHaveBeenCalledTimes(3);

      vi.stubGlobal('setTimeout', originalSetTimeout);
    });
  });

  describe('generateAndStoreEmbedding', () => {
    it('skips database insert if text is empty', async () => {
      await embeddingService.generateAndStoreEmbedding('staff', '123', '   ');
      expect(queryDb).not.toHaveBeenCalled();
    });

    it('generates embedding and stores it safely without throwing on error', async () => {
      vi.mocked(queryDb).mockResolvedValueOnce([]); // Mock existing hash length 0
      vi.mocked(queryDb).mockResolvedValueOnce([]); // Mock delete result
      vi.mocked(queryDb).mockResolvedValueOnce([]); // Mock insert result

      await embeddingService.generateAndStoreEmbedding('service', 'abc-123', 'A test service', { org: 'org-1' });

      // 1st query: Hash check
      expect(queryDb).toHaveBeenNthCalledWith(1, expect.stringContaining('LIMIT 1'), ['service', 'abc-123']);
      // 2nd query: DELETE
      expect(queryDb).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM embeddings'), ['service', 'abc-123']);
      // 3rd query: INSERT
      expect(queryDb).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO embeddings'), [
        'service',
        'abc-123',
        '[0.1,0.2,0.3]',
        expect.stringContaining('"text_hash":')
      ]);
    });

    it('skips generating if text hash matches existing record', async () => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('same text').digest('hex');

      vi.mocked(queryDb).mockResolvedValueOnce([{ metadata: { text_hash: hash } }] as any);

      await embeddingService.generateAndStoreEmbedding('staff', '1', 'same text');
      expect(mockCreateEmbedding).not.toHaveBeenCalled();
    });

    it('swallows errors without bubbling up', async () => {
      mockCreateEmbedding.mockRejectedValue(new Error('OpenAI Down'));
      
      // Should not throw
      await expect(embeddingService.generateAndStoreEmbedding('staff', '1', 'test')).resolves.not.toThrow();
    });
  });

  describe('searchSimilar', () => {
    it('queries database with cosine distance ordering', async () => {
      vi.mocked(queryDb).mockResolvedValueOnce([]); // Mock SET LOCAL ivfflat.probes
      vi.mocked(queryDb).mockResolvedValueOnce([{
        id: '1',
        entity_type: 'staff',
        entity_id: 'abc',
        similarity: 0.95
      } as any]);

      const results = await embeddingService.searchSimilar('staff', 'query text', 3);
      
      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBe(0.95);
      expect(queryDb).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY embedding <-> $1'),
        ['[0.1,0.2,0.3]', 'staff', 3]
      );
    });
  });
});

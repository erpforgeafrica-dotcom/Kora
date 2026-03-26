import { queryDb, dbPool } from '../src/db/client.js';
import { embeddingService } from '../src/services/ai/embeddingService.js';
import { logger } from '../src/shared/logger.js';

async function backfillStaff() {
  logger.info('Starting staff backfill...');
  
  const staffMembers = await queryDb<any>('SELECT id, organization_id, full_name, role, specializations, bio FROM staff');
  let processed = 0;

  for (const staff of staffMembers) {
    try {
      const textChunk = `${staff.full_name || ''} ${staff.role || ''} ${(staff.specializations || []).join(' ')} ${staff.bio || ''}`;
      
      await embeddingService.generateAndStoreEmbedding('staff', staff.id, textChunk, {
        organizationId: staff.organization_id,
        role: staff.role
      });
      processed++;
      
      if (processed % 10 === 0) {
        logger.info(`Processed ${processed}/${staffMembers.length} staff embeddings...`);
      }
    } catch (err) {
      logger.error(`Failed to process staff ${staff.id}`, { error: String(err) });
    }
  }
}

async function backfillServices() {
  logger.info('Starting services backfill...');
  
  const services = await queryDb<any>('SELECT id, organization_id, category_id, name, description FROM services');
  let processed = 0;

  for (const service of services) {
    try {
      const textChunk = `${service.name || ''} ${service.description || ''} ${service.category_id || ''}`;
      
      await embeddingService.generateAndStoreEmbedding('service', service.id, textChunk, {
        organizationId: service.organization_id,
        categoryId: service.category_id
      });
      processed++;
      
      if (processed % 10 === 0) {
        logger.info(`Processed ${processed}/${services.length} services embeddings...`);
      }
    } catch (err) {
      logger.error(`Failed to process service ${service.id}`, { error: String(err) });
    }
  }
}

async function run() {
  try {
    logger.info('Validating pgvector extension...');
    await embeddingService.validatePgvector();

    await backfillStaff();
    await backfillServices();

    logger.info('Analyzing embeddings table to optimize indexes...');
    await embeddingService.analyzeEmbeddings();

    logger.info('Backfill completed successfully!');
  } catch (error) {
    logger.error('Backfill script failed', { error: String(error) });
    process.exit(1);
  } finally {
    // End the pool so the script can exit
    dbPool.end();
  }
}

// Execute backfill
run();

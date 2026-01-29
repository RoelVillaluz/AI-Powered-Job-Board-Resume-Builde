import { Worker } from "bullmq";
import { redisConnection, queueConfig, workerConcurrency } from "../config/queue.config.js";
import { generateResumeEmbeddingsProcessor } from "../jobs/processes/generateEmbeddings.js";
import logger from "../utils/logger.js";

/**
 * Resume Embedding Worker
 * Processes embedding generation jobs from the queue
 */
export const resumeEmbeddingWorker = new Worker(
    queueConfig.resumeEmbedding.name,
    generateResumeEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.resumeEmbedding
    }
)

// Event listeners for debugging
resumeEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Resume embedding worker is ready and listening for jobs');
})

resumeEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for resume ${job.data.resumeId}`);
});

resumeEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        resumeId: result.resumeId,
        cached: result.cached
    });
});

resumeEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        resumeId: job?.data?.resumeId,
        error: err.message,
        stack: err.stack
    });
});

resumeEmbeddingWorker.on('error', (err) => {
    logger.error('💥 Worker error:', err);
});

/**
 * Graceful shutdown
 */
export const closeWorkers = async () => {
    logger.info('Closing workers...');
    await resumeEmbeddingWorker.close();
    logger.info('All workers closed');
};

// Handle process termination
process.on('SIGTERM', closeWorkers);
process.on('SIGINT', closeWorkers);

logger.info('✅ BullMQ workers initialized');
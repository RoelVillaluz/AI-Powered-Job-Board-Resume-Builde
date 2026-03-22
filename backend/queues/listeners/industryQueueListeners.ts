import { industryEmbeddingWorker } from "../workers/industryQueueWorker";
import logger from "../../utils/logger";

const loggedWorkerErrors = new Set();

industryEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Resume embedding worker is ready and listening for jobs');
});

industryEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for resume ${job.data.industryId}`);
});

industryEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        industryId: result.industryId,
        cached: result.cached,
    });
});

industryEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        industryId: job?.data?.industryId,
        error: err.message,
        attemptsMade: job?.attemptsMade,
        stack: err.stack,
    });
    // industry has its own pipeline — no DLQ needed here yet
});

industryEmbeddingWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('industryEmbedding')) {
        logger.error('💥 industry embedding worker error (will retry silently):', err);
        loggedWorkerErrors.add('industryEmbedding');
    }
});
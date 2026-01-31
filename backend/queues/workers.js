import { Worker } from "bullmq";
import { redisConnection, queueConfig, workerConcurrency } from "../config/queue.config.js";
import { generateJobPostingEmbeddingsProcessor, generateResumeEmbeddingsProcessor } from "../jobs/processes/generateEmbeddings.js";
import logger from "../utils/logger.js";
import { resumeScoreProcessor } from "../jobs/processes/calculateScore.js";

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

/**
 * Resume Scoring Worker
 * Processses score calculation jobs from the queue
 */
export const resumeScoringWorker = new Worker(
    queueConfig.resumeScoring.name,
    resumeScoreProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.resumeScoring || 5
    }
)

/**
 * Job Embedding Worker
 * 
 */
export const jobPostingEmbeddingWorker = new Worker(
    queueConfig.jobEmbedding.name,
    generateJobPostingEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.jobEmbedding
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

//  Event listeners for scoring worker
resumeScoringWorker.on('ready', () => {
    logger.info('🟢 Resume scoring worker is ready and listening for jobs');
});

resumeScoringWorker.on('active', (job) => {
    logger.info(`🔵 Processing score job ${job.id} for resume ${job.data.resumeId}`);
});

resumeScoringWorker.on('completed', (job, result) => {
    logger.info(`✅ Score job ${job.id} completed`, {
        resumeId: result?.data?.resume,
        totalScore: result?.data?.totalScore,
        grade: result?.data?.grade
    });
});

resumeScoringWorker.on('failed', (job, err) => {
    logger.error(`❌ Score job ${job?.id} failed`, {
        resumeId: job?.data?.resumeId,
        error: err.message,
        stack: err.stack
    });
});

resumeScoringWorker.on('error', (err) => {
    logger.error('💥 Scoring worker error:', err);
});

jobPostingEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Job posting embedding worker is ready and listening for jobs');
})

jobPostingEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for job posting ${job.data.jobPostingId}`);
});

jobPostingEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        resumeId: result.resumeId,
        cached: result.cached
    });
});

jobPostingEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        resumeId: job?.data?.resumeId,
        error: err.message,
        stack: err.stack
    });
});

jobPostingEmbeddingWorker.on('error', (err) => {
    logger.error('💥 Worker error:', err);
});


/**
 * Graceful shutdown
 */
export const closeWorkers = async () => {
    logger.info('Closing workers...');
    await resumeEmbeddingWorker.close();
    await resumeScoringWorker.close();
    await jobPostingEmbeddingWorker.close();
    logger.info('All workers closed');
};

// Handle process termination
process.on('SIGTERM', closeWorkers);
process.on('SIGINT', closeWorkers);

logger.info('✅ BullMQ workers initialized');
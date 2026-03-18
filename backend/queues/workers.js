import { Worker } from "bullmq";
import { redisConnection, queueConfig, workerConcurrency } from "../config/queue.config.js";
import { generateJobPostingEmbeddingsProcessor, generateJobTitleEmbeddingsProcessor, generateResumeEmbeddingsProcessor, generateSkillEmbeddingsProcessor, generateLocationEmbeddingsProcessor } from "../jobs/processes/generateEmbeddings.js";
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

/**
 * Skill Embedding Worker
 */
export const skillEmbeddingWorker = new Worker(
    queueConfig.skillEmbedding.name,
    generateSkillEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.skillEmbedding
    }
)

// Job Title Embedding Worker
export const jobTitleEmbeddingWorker = new Worker(
    queueConfig.jobTitleEmbedding.name,
    generateJobTitleEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.jobTitleEmbedding
    }
)

// Job Title Embedding Worker
export const locationEmbeddingWorker = new Worker(
    queueConfig.locationEmbedding.name,
    generateLocationEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.locationEmbedding
    }
)

// Event listeners for debugging
resumeEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Resume embedding worker is ready and listening for jobs');
})

resumeEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for resume ${job.data.uy}`);
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

// Event listeners for job embedding worker
jobPostingEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Job posting embedding worker is ready and listening for jobs');
})

jobPostingEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for job posting ${job.data.jobPostingId}`);
});

jobPostingEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        jobPosting: result.jobPostingId,
        cached: result.cached
    });
});

jobPostingEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        jobPosting: job?.data?.jobPostingId,
        error: err.message,
        stack: err.stack
    });
});

jobPostingEmbeddingWorker.on('error', (err) => {
    logger.error('💥 Worker error:', err);
});

// Event listeners for skill embedding worker
skillEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Skill embedding worker is ready and listening for jobs')
});

skillEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for skill ${job.data.skillId}`);
});

skillEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        skill: job?.data?.skillId,
        cached: result.cached
    });
});

skillEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        skill: job?.data?.skillId,
        error: err.message,
        stack: err.stack
    });
})

skillEmbeddingWorker.on('error', (err) => {
    logger.error('💥 Worker error:', err);
});

// Event listeners for job embedding worker
jobTitleEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Job title embedding worker is ready and listening for jobs');
})

jobTitleEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for job title ${job.data.jobTitleId}`);
});

jobTitleEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        jobTitle: result.jobTitleId,
        cached: result.cached
    });
});

jobTitleEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        jobTitle: job?.data?.jobTitleId,
        error: err.message,
        stack: err.stack
    });
});

jobTitleEmbeddingWorker.on('error', (err) => {
    logger.error('💥 Worker error:', err);
});

// Event listeners for location embedding worker
locationEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Location embedding worker is ready and listening for jobs');
})

locationEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for location ${job.data.locationId}`);
});

locationEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        location: result.locationId,
        cached: result.cached
    });
});

locationEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        location: job?.data?.locationId,
        error: err.message,
        stack: err.stack
    });
});

locationEmbeddingWorker.on('error', (err) => {
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
    await skillEmbeddingWorker.close();
    await jobTitleEmbeddingWorker.close();
    await locationEmbeddingWorker.close(),
    logger.info('All workers closed');
};

// Handle process termination
process.on('SIGTERM', closeWorkers);
process.on('SIGINT', closeWorkers);

logger.info('✅ BullMQ workers initialized');
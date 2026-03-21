import { Worker } from "bullmq";
import { redisConnection, queueConfig, workerConcurrency } from "../config/queue.config.js";
import {
    generateJobPostingEmbeddingsProcessor,
    generateJobTitleEmbeddingsProcessor,
    generateResumeEmbeddingsProcessor,
    generateSkillEmbeddingsProcessor,
    generateLocationEmbeddingsProcessor,
} from "../jobs/processes/generateEmbeddings.js";
import logger from "../utils/logger.js";
import { resumeScoreProcessor } from "../jobs/processes/calculateScore.js";
import {
    locationEmbeddingDLQ,
    skillEmbeddingDLQ,
    jobTitleEmbeddingDLQ,
    jobEmbeddingDLQ,
} from "../queues/index.js";

// Tracks which workers have already emitted their first error log,
// preventing log spam on repeated Redis connection errors.
const loggedWorkerErrors = new Set();

// ─── Workers ──────────────────────────────────────────────────────────────────

export const resumeEmbeddingWorker = new Worker(
    queueConfig.resumeEmbedding.name,
    generateResumeEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.resumeEmbedding,
    }
);

export const resumeScoringWorker = new Worker(
    queueConfig.resumeScoring.name,
    resumeScoreProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.resumeScoring || 5,
    }
);

export const jobPostingEmbeddingWorker = new Worker(
    queueConfig.jobEmbedding.name,
    generateJobPostingEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.jobEmbedding,
    }
);

export const skillEmbeddingWorker = new Worker(
    queueConfig.skillEmbedding.name,
    generateSkillEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.skillEmbedding,
    }
);

export const jobTitleEmbeddingWorker = new Worker(
    queueConfig.jobTitleEmbedding.name,
    generateJobTitleEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.jobTitleEmbedding,
    }
);

export const locationEmbeddingWorker = new Worker(
    queueConfig.locationEmbedding.name,
    generateLocationEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.locationEmbedding,
    }
);

// ─── Dead Letter Helpers ──────────────────────────────────────────────────────

/**
 * Moves a fully-exhausted job into its dead letter queue.
 *
 * Called from each worker's 'failed' listener only when attemptsMade
 * equals the job's configured max attempts — i.e. no retries remain.
 * Earlier failures are left in the main queue so BullMQ can retry them.
 *
 * The DLQ job carries the original payload plus failure metadata so
 * it can be replayed or debugged without re-triggering the source event.
 */
const moveToDLQ = async (dlq, job, err) => {
    try {
        await dlq.add(
            'dead-letter',
            {
                originalJobId: job.id,
                originalQueue: job.queueName,
                payload: job.data,
                failedReason: err.message,
                failedAt: new Date().toISOString(),
                attemptsMade: job.attemptsMade,
            },
            {
                // Keep DLQ jobs for 30 days then auto-remove
                removeOnComplete: { age: 30 * 24 * 3600 },
                removeOnFail: true,
            }
        );
    } catch (dlqError) {
        // DLQ write failing must never throw — log and move on
        logger.error('💀 Failed to write job to DLQ', {
            originalJobId: job.id,
            queue: job.queueName,
            dlqError: dlqError.message,
        });
    }
};

// ─── Resume Embedding Events ──────────────────────────────────────────────────

resumeEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Resume embedding worker is ready and listening for jobs');
});

resumeEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for resume ${job.data.resumeId}`);
});

resumeEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        resumeId: result.resumeId,
        cached: result.cached,
    });
});

resumeEmbeddingWorker.on('failed', (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        resumeId: job?.data?.resumeId,
        error: err.message,
        attemptsMade: job?.attemptsMade,
        stack: err.stack,
    });
    // Resume has its own pipeline — no DLQ needed here yet
});

resumeEmbeddingWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('resumeEmbedding')) {
        logger.error('💥 Resume embedding worker error (will retry silently):', err);
        loggedWorkerErrors.add('resumeEmbedding');
    }
});

// ─── Resume Scoring Events ────────────────────────────────────────────────────

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
        grade: result?.data?.grade,
    });
});

resumeScoringWorker.on('failed', (job, err) => {
    logger.error(`❌ Score job ${job?.id} failed`, {
        resumeId: job?.data?.resumeId,
        error: err.message,
        stack: err.stack,
    });
});

resumeScoringWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('resumeScoring')) {
        logger.error('💥 Resume scoring worker error (will retry silently):', err);
        loggedWorkerErrors.add('resumeScoring');
    }
});

// ─── Job Posting Embedding Events ─────────────────────────────────────────────

jobPostingEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Job posting embedding worker is ready and listening for jobs');
});

jobPostingEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for job posting ${job.data.jobPostingId}`);
});

jobPostingEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        jobPosting: result.jobPostingId,
        cached: result.cached,
    });
});

jobPostingEmbeddingWorker.on('failed', async (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        jobPosting: job?.data?.jobPostingId,
        error: err.message,
        attemptsMade: job?.attemptsMade,
        stack: err.stack,
    });

    // Move to DLQ only when all retries are exhausted
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
        logger.warn(`💀 Job posting embedding exhausted retries — moving to DLQ`, {
            jobId: job.id,
            jobPostingId: job.data.jobPostingId,
        });
        await moveToDLQ(jobEmbeddingDLQ, job, err);
    }
});

jobPostingEmbeddingWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('jobPostingEmbedding')) {
        logger.error('💥 Job posting embedding worker error (will retry silently):', err);
        loggedWorkerErrors.add('jobPostingEmbedding');
    }
});

// ─── Skill Embedding Events ───────────────────────────────────────────────────

skillEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Skill embedding worker is ready and listening for jobs');
});

skillEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for skill ${job.data.skillId}`);
});

skillEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        skill: job?.data?.skillId,
        cached: result.cached,
    });
});

skillEmbeddingWorker.on('failed', async (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        skill: job?.data?.skillId,
        error: err.message,
        attemptsMade: job?.attemptsMade,
        stack: err.stack,
    });

    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
        logger.warn(`💀 Skill embedding exhausted retries — moving to DLQ`, {
            jobId: job.id,
            skillId: job.data.skillId,
        });
        await moveToDLQ(skillEmbeddingDLQ, job, err);
    }
});

skillEmbeddingWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('skillEmbedding')) {
        logger.error('💥 Skill embedding worker error (will retry silently):', err);
        loggedWorkerErrors.add('skillEmbedding');
    }
});

// ─── Job Title Embedding Events ───────────────────────────────────────────────

jobTitleEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Job title embedding worker is ready and listening for jobs');
});

jobTitleEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for job title ${job.data.titleId}`);
});

jobTitleEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        jobTitle: result.titleId,
        cached: result.cached,
    });
});

jobTitleEmbeddingWorker.on('failed', async (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        jobTitle: job?.data?.titleId,
        error: err.message,
        attemptsMade: job?.attemptsMade,
        stack: err.stack,
    });

    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
        logger.warn(`💀 Job title embedding exhausted retries — moving to DLQ`, {
            jobId: job.id,
            titleId: job.data.titleId,
        });
        await moveToDLQ(jobTitleEmbeddingDLQ, job, err);
    }
});

jobTitleEmbeddingWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('jobTitleEmbedding')) {
        logger.error('💥 Job title embedding worker error (will retry silently):', err);
        loggedWorkerErrors.add('jobTitleEmbedding');
    }
});

// ─── Location Embedding Events ────────────────────────────────────────────────

locationEmbeddingWorker.on('ready', () => {
    logger.info('🟢 Location embedding worker is ready and listening for jobs');
});

locationEmbeddingWorker.on('active', (job) => {
    logger.info(`🔵 Processing embedding job ${job.id} for location ${job.data.locationId}`);
});

locationEmbeddingWorker.on('completed', (job, result) => {
    logger.info(`✅ Embedding job ${job.id} completed`, {
        location: result.locationId,
        embeddingLength: result.embeddingLength,
    });
});

locationEmbeddingWorker.on('failed', async (job, err) => {
    logger.error(`❌ Embedding job ${job?.id} failed`, {
        location: job?.data?.locationId,
        error: err.message,
        attemptsMade: job?.attemptsMade,
        stack: err.stack,
    });

    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
        logger.warn(`💀 Location embedding exhausted retries — moving to DLQ`, {
            jobId: job.id,
            locationId: job.data.locationId,
        });
        await moveToDLQ(locationEmbeddingDLQ, job, err);
    }
});

locationEmbeddingWorker.on('error', (err) => {
    if (!loggedWorkerErrors.has('locationEmbedding')) {
        logger.error('💥 Location embedding worker error (will retry silently):', err);
        loggedWorkerErrors.add('locationEmbedding');
    }
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

export const closeWorkers = async () => {
    logger.info('Closing workers...');
    await Promise.all([
        resumeEmbeddingWorker.close(),
        resumeScoringWorker.close(),
        jobPostingEmbeddingWorker.close(),
        skillEmbeddingWorker.close(),
        jobTitleEmbeddingWorker.close(),
        locationEmbeddingWorker.close(),
    ]);
    logger.info('All workers closed');
};

process.on('SIGTERM', closeWorkers);
process.on('SIGINT', closeWorkers);

logger.info('✅ BullMQ workers initialized');
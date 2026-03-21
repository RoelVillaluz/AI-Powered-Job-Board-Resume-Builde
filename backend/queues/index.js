/**
 * Queue Manager
 *
 * Creates and exports all job queues.
 * Queues are lightweight - they just add jobs to Redis.
 * Workers (separate process) actually process the jobs.
 */
import { Queue } from "bullmq";
import { redisConnection, queueConfig } from "../config/queue.config.js";

/**
 * Resume Embedding Queue
 */
export const resumeEmbeddingQueue = new Queue(
    queueConfig.resumeEmbedding.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.resumeEmbedding.options,
    }
);

/**
 * Resume Scoring Queue
 */
export const resumeScoringQueue = new Queue(
    queueConfig.resumeScoring.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.resumeScoring.options,
    }
);

/**
 * Resume Comparison Queue
 */
export const resumeComparisonQueue = new Queue(
    queueConfig.resumeComparison.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.resumeComparison.options,
    }
);

/**
 * Job Embedding Queue
 */
export const jobEmbeddingQueue = new Queue(
    queueConfig.jobEmbedding.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.jobEmbedding.options,
    }
);

/**
 * Skill Embedding Queue
 */
export const skillEmbeddingQueue = new Queue(
    queueConfig.skillEmbedding.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.skillEmbedding.options,
    }
);

/**
 * Job Title Embedding Queue
 */
export const jobTitleEmbeddingQueue = new Queue(
    queueConfig.jobTitleEmbedding.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.jobTitleEmbedding.options,
    }
);

/**
 * Location Embedding Queue
 */
export const locationEmbeddingQueue = new Queue(
    queueConfig.locationEmbedding.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.locationEmbedding.options,
    }
);

// ─── Dead Letter Queues ───────────────────────────────────────────────────────
//
// These queues receive jobs that have exhausted all retries on the main queue.
// They are never consumed by a worker — they exist for inspection and replay.
// The 'failed' event listener on each worker is responsible for moving jobs here.

export const locationEmbeddingDLQ = new Queue(
    queueConfig.locationEmbeddingDLQ.name,
    { connection: redisConnection }
);

export const skillEmbeddingDLQ = new Queue(
    queueConfig.skillEmbeddingDLQ.name,
    { connection: redisConnection }
);

export const jobTitleEmbeddingDLQ = new Queue(
    queueConfig.jobTitleEmbeddingDLQ.name,
    { connection: redisConnection }
);

export const jobEmbeddingDLQ = new Queue(
    queueConfig.jobEmbeddingDLQ.name,
    { connection: redisConnection }
);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

export const closeQueues = async () => {
    await Promise.all([
        resumeEmbeddingQueue.close(),
        resumeScoringQueue.close(),
        resumeComparisonQueue.close(),
        jobEmbeddingQueue.close(),
        skillEmbeddingQueue.close(),
        jobTitleEmbeddingQueue.close(),
        locationEmbeddingQueue.close(),
        locationEmbeddingDLQ.close(),
        skillEmbeddingDLQ.close(),
        jobTitleEmbeddingDLQ.close(),
        jobEmbeddingDLQ.close(),
    ]);
    console.log('All queues closed');
};

process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);
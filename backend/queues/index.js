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
 * Handles background generation of vector embeddings for resumes
 */
export const resumeEmbeddingQueue = new Queue(
    queueConfig.resumeEmbedding.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.resumeEmbedding.options
    }
)


/**
 * Resume Scoring Queue
 * Handles background calculation of resume scores
 */
export const resumeScoringQueue = new Queue(
    queueConfig.resumeScoring.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.resumeScoring.options
    }
)


/**
 * Resume Comparison Queue
 * Handles background comparison of resumes to job postings
 */
export const resumeComparisonQueue = new Queue(
    queueConfig.resumeComparison.name,
    {
        connection: redisConnection,
        defaultJobOptions: queueConfig.resumeComparison.options
    }
)


/**
 * Graceful shutdown handler
 * Closes all queue connections when app shuts down
 */
export const closeQueues = async () => {
    await Promise.all([
        resumeEmbeddingQueue.close(),
        resumeScoringQueue.close(),
        resumeComparisonQueue.close(),
    ]);
    console.log('All queues closed');
}

// Handle process termination
process.on('SIGTERM', closeQueues);
process.on('SIGINT', closeQueues);
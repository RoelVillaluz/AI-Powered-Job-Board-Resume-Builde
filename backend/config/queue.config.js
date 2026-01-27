/**
 * Queue Configuration
 * 
 * Centralizes all Redis connection settings and queue options.
 * 
 * Environment Variables Required:
 * - REDIS_HOST: Redis server hostname (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - NODE_ENV: Environment (development/production)
 */
import { config } from "dotenv";
config();


/**
 * Redis connection configuration
 * Used by both queues and workers
 */
export const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // BullMQ requirement
    enableReadyCheck: false,     // BullMQ requirement
};

/**
 * Default job options applied to all jobs
 */
export const defaultOptions = {
    attempts: 3,                 // Retry failed jobs 3 times
    backoff: {
        type: 'exponential',     // Wait longer between each retry
        delay: 2000,             // Start with 2 second delay
    },
    removeOnComplete: {
        age: 24 * 3600,          // Keep completed jobs for 24 hours
        count: 100,              // Keep max 100 completed jobs
    },
    removeOnFail: {
        age: 7 * 24 * 3600,      // Keep failed jobs for 7 days
    },
};


/**
 * Queue-specific settings
 */
export const queueConfig = {
    resumeEmbedding: {
        name: 'resume-embedding',
        options: {
            ...defaultOptions,
            priority: 2 // Higher priority
        },
    },
    resumeScoring: {
        name: 'resume-scoring',
        options: {
            ...defaultOptions,
            priority: 3, // Lower priority (runs after embeddings)
        },
    },
    resumeComparison: {
        name: 'resume-comparison',
        options: {
            ...defaultOptions,
            priority: 2,
        },
    },
}

/**
 * Worker concurrency settings
 * Controls how many jobs each worker processes simultaneously
 */
export const workerConcurrency = {
    resumeEmbedding: process.env.NODE_ENV === 'production' ? 5 : 2,
    resumeScoring: process.env.NODE_ENV === 'production' ? 3 : 1,
    resumeComparison: process.env.NODE_ENV === 'production' ? 4 : 2,
};
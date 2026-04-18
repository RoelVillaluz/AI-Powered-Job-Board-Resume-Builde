import { config } from "dotenv";
config();

/**
 * Shared Redis connection config.
 * Used by queues, workers, and BullMQ board.
 */
export const redisConnection = {
    ...(process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
        }),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times: number) => {
        if (times >= 3) return null;
        return Math.min(times * 500, 2000);
    },
};

/**
 * Default job options applied to all queued jobs.
 * Override per-entity in embeddingRegistry if needed.
 */
export const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000,
    },
    removeOnComplete: {
        age: 24 * 3600,
        count: 100,
    },
    removeOnFail: {
        age: 7 * 24 * 3600,
    },
};

// queueConfig and workerConcurrency removed —
// all per-entity config now lives in embeddingRegistry.
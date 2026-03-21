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
  ...(process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  }),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times >= 3) return null;
    return Math.min(times * 500, 2000);
  },
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
    jobEmbedding: {
        name: 'job-embedding',
        options: {
            ...defaultOptions,
            priority: 4
        }
    },
    skillEmbedding: {
        name: 'skill-embedding',
        options: {
            ...defaultOptions,
            priority: 5
        }
    },
    jobTitleEmbedding: {
        name: 'job-title-embedding',
        options: {
            ...defaultOptions,
            priority: 6
        }
    },
    locationEmbedding: {
        name: 'location-embedding',
        options: {
            ...defaultOptions,
            priority: 7
        }
    },
    industryEmbedding: {
        name: 'industry-embedding',
        options: {
            ...defaultOptions,
            priority: 8
        }
    },


    locationEmbeddingDLQ: {
        name: 'location-embedding-failed',
    },
    skillEmbeddingDLQ: {
        name: 'skill-embedding-failed',
    },
    jobTitleEmbeddingDLQ: {
        name: 'job-title-embedding-failed',
    },
    jobEmbeddingDLQ: {
        name: 'job-embedding-failed',
    },
    industryEmbeddingDLQ: {
        name: 'industry-embedding-failed'
    }
}

/**
 * Worker concurrency settings
 * Controls how many jobs each worker processes simultaneously
 */
export const workerConcurrency = {
    resumeEmbedding: process.env.NODE_ENV === 'production' ? 5 : 2,
    resumeScoring: process.env.NODE_ENV === 'production' ? 3 : 1,
    resumeComparison: process.env.NODE_ENV === 'production' ? 4 : 2,
    jobEmbedding: process.env.NODE_ENV === 'production' ? 2 : 1,
    skillEmbedding: process.env.NODE_ENV === 'production' ? 5 : 3,
    jobTitleEmbedding: process.env.NODE_ENV === 'production' ? 5 : 3,
    locationEmbedding: process.env.NODE_ENV === 'production' ? 4 : 2,
    industryEmbedding: process.env.NODE_ENV === 'production' ? 2 : 1,
};
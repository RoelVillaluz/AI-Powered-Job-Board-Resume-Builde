import { Queue } from "bullmq";
import { redisConnection } from "../config/queue.config.js";

/**
 * Embedding Queues
 */
export const resumeEmbeddingQueue = new Queue("resume-embedding", {
    connection: redisConnection,
});

export const jobEmbeddingQueue = new Queue("job-embedding", {
    connection: redisConnection
})

export const skillEmbeddingQueue = new Queue("skill-embedding", {
    connection: redisConnection,
});

export const jobTitleEmbeddingQueue = new Queue("job-title-embedding", {
    connection: redisConnection,
});

export const locationEmbeddingQueue = new Queue("location-embedding", {
    connection: redisConnection,
});

export const industryEmbeddingQueue = new Queue("industry-embedding", {
    connection: redisConnection,
});

/**
 * Scoring Queues
 */
export const resumeScoringQueue = new Queue("resume-scoring", {
    connection: redisConnection,
});

/**
 * DLQs
 */
export const skillEmbeddingDLQ = new Queue("skill-dlq", {
    connection: redisConnection,
});

export const jobTitleEmbeddingDLQ = new Queue("job-title-dlq", {
    connection: redisConnection,
});

export const locationEmbeddingDLQ = new Queue("location-dlq", {
    connection: redisConnection,
});

export const jobEmbeddingDLQ = new Queue("job-dlq", {
    connection: redisConnection,
});

export const industryEmbeddingDLQ = new Queue("industry-dlq", {
    connection: redisConnection,
});
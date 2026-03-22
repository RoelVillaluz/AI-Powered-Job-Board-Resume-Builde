import { Worker } from "bullmq";
import { redisConnection, queueConfig, workerConcurrency } from "../../config/queue.config";
import { generateIndustryEmbeddingsProcessor } from "../../jobs/processes/generateEmbeddings";

export const industryEmbeddingWorker = new Worker(
    queueConfig.industryEmbedding.name,
    generateIndustryEmbeddingsProcessor,
    {
        connection: redisConnection,
        concurrency: workerConcurrency.industryEmbedding
    }
)
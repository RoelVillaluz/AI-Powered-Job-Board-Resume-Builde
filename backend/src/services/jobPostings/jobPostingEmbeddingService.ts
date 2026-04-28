import { createJobEmbeddingRepo, getJobEmbeddingRepo } from "../../repositories/jobPostings/jobEmbeddingRepositories.js"
import logger from "../../utils/logger.js";
import { runPython } from "../../infrastructure/python/pythonRunner.js";
import { Types } from "mongoose";
import { orchestrateEmbeddings } from "../../infrastructure/domains/embedding/core/orchestrateEmbedding.js";
import { JobPostingEmbeddingsDocument } from "../../types/embeddings.types.js";
import { embeddingRegistry } from "../../infrastructure/domains/embedding/registry/embeddingRegistry.js";
import { executeEmbeddingPipeline } from "../../infrastructure/domains/embedding/core/executeEmbeddingPipeline.js";
import { QueueJob } from "../../types/queues.types.js";
import { PythonEmit } from "../../types/python.types.js";

type JobPostingEmbeddingCacheResult =
    | { cached: true;  data: JobPostingEmbeddingsDocument }
    | { cached: false; data: null }

type JobPostingEmbeddingOrchestrationResult =
    | { cached: true;  data: JobPostingEmbeddingsDocument; jobId?: never }
    | { cached: false; jobId: string;                      data?: never }
    | { cached: false; data: JobPostingEmbeddingsDocument; jobId?: never }

export const getOrGenerateJobPostingEmbeddingService = async (
    jobPostingId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<JobPostingEmbeddingOrchestrationResult> => {
    return orchestrateEmbeddings<JobPostingEmbeddingsDocument>({
        invalidateCache,
        logContext: `jobPosting:${jobPostingId}`,

        getCached: async () => {
            const result = await getJobPostingEmbeddingService(jobPostingId);
            return result.cached
                ? { cached: true,  data: result.data }
                : { cached: false };
        },

        // Job posting embeddings are multi-field objects (embeddings + meanEmbeddings),
        // not a single flat vector — validate that at least one key exists
        validateShape: (data) =>
            !!data.embeddings && Object.keys(data.embeddings).length > 0,

        queueGeneration: () =>
            embeddingRegistry.jobPosting.queue({
                id:           jobPostingId.toString(),
                jobPostingId: jobPostingId.toString(),
            }),

        fallbackGeneration: async () => {
            const res = await upsertJobPostingEmbeddingService(jobPostingId, true);
            if (!res.data) throw new Error('JobPosting embedding fallback returned no data');
            return res.data;
        },
    });
};

/**
 * Check if cached embeddings exist and are fresh
 * 
 * @param {string} jobPostingId - Job posting ID
 * @returns {Promise<{cached: boolean, data: Object|null}>}
 */
export const getJobPostingEmbeddingService = async (
    jobPostingId: string | Types.ObjectId
): Promise<{ cached: true; data: JobPostingEmbeddingsDocument } | { cached: false; data: null }> => {
    const cachedEmbeddings = await getJobEmbeddingRepo(jobPostingId);

    if (cachedEmbeddings) {
        const daysSinceGeneration = 
        (Date.now() - new Date(cachedEmbeddings.generatedAt).getTime()) /
        (1000 * 60 * 60 * 24);

        // Return cached if less than 90 days old
        if (daysSinceGeneration < 90) {
            logger.info(`Cache hit for job embedding: ${jobPostingId}`);
            return { cached: true, data: cachedEmbeddings as unknown as JobPostingEmbeddingsDocument }
        }
    }

    logger.info(`Cache miss for job embeddings: ${jobPostingId}`);
    return { cached: false, data: null };
}

/**
 * Generate embeddings using Python and save to database
 * 
 * This is the BUSINESS LOGIC that can be called from:
 * - Queue processor (async background job)
 * - Direct API call (if needed)
 * - Webhook (when job posting is updated)
 * 
 * @param {string} jobPostingId - Job posting ID
 * @param {boolean} invalidateCache - Force regeneration
 * @param {Object} job - Optional BullMQ job for progress updates
 * @returns {Promise<{cached: boolean, data: Object}>}
 */
export const upsertJobPostingEmbeddingService = async (
    jobPostingId: Types.ObjectId | string,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {},
) => {
    if (isFallback) logger.warn(`JobPosting embedding generated inline (Redis fallback)`);
    return executeEmbeddingPipeline({
        entityKey: 'resume',
        id:        new Types.ObjectId(jobPostingId),
        job,
        emit,
    });
};

import { createJobEmbeddingRepo, getJobEmbeddingRepo } from "../../repositories/jobPostings/jobEmbeddingRepositories.js"
import logger from "../../utils/logger.js";
import { runPython } from "../../utils/pythonRunner.js";

/**
 * Main service function - handles cache check and queue decision
 */
export const getOrGenerateJobPostingEmbeddingService = async (jobPostingId) => {
    // Check cache first
    const cachedResult = await getJobPostingEmbeddingService(jobPostingId);

    if (cachedResult.cached) {
        return { data: cachedResult.data, cached: true }
    } 

    // Cache miss or invalidate - queue generation
    logger.info(`Queueing embedding generation for job posting: ${jobPostingId}`);

    const job = await jobEmbeddingQueue.add('generate-embeddings', {
        jobPostingId,
        invalidateCache
    }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 30000
    })

    return {
        cached: false,
        jobId: job.id
    };
}

/**
 * Check if cached embeddings exist and are fresh
 * 
 * @param {string} jobPostingId - Job posting ID
 * @returns {Promise<{cached: boolean, data: Object|null}>}
 */
export const getJobPostingEmbeddingService = async (jobPostingId) => {
    const cachedEmbeddings = await getJobEmbeddingRepo(jobPostingId);

    if (cachedEmbeddings) {
         const daysSinceGeneration = 
        (Date.now() - new Date(cachedEmbeddings.generatedAt).getTime()) /
        (1000 * 60 * 60 * 24);

        // Return cached if less than 90 days old
        if (daysSinceGeneration < 90) {
            logger.info(`Cache hit for job embedding: ${jobPostingId}`);
            return { cached: true, data: cachedEmbeddings }
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
export const generateJobPostingEmbeddingService = async (jobPostingId, job = null) => {
    try {
        await job?.updateProgress(10);

        logger.info(`Generating embeddings for job: ${jobPostingId}`, { invalidateCache });

        // Call Python to generate embeddings
        await job?.updateProgress(30);
        const pythonResponse = runPython('generate_job_embeddings');

        await job?.updateProgress(70);

        if (pythonResponse.error) {
            throw new Error(pythonResponse.error);
        }

        // Structure the data for database
        const embeddingData = {
            jobPosting: jobPostingId,
            embeddings: pythonResponse.embeddings || {},
            meanEmbeddings: pythonResponse.meanEmbeddings || {},
            generatedAt: new Date(),
        }

        // Check if already exists
        const existing = getJobEmbeddingRepo(jobPostingId);

        let savedEmbeddings;

        if (existing) {
            // Update existing
            Object.assign(existing, embeddingData);
            savedEmbeddings = await existing.save();
        } else {
            // Create new
            savedEmbeddings = createJobEmbeddingRepo(embeddingData);
        }
    } catch (error) {
        logger.error(`Error generating embeddings for job: ${jobPostingId}`);
        throw error
    }
}
import { getResumeEmbeddingsRepo, createResumeEmbeddingRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js"
import logger from "../../utils/logger.js";
import { runPython } from "../../utils/pythonRunner.js";

/**
 * Check if cached embeddings exist and are fresh
 * 
 * @param {string} resumeId - Resume ID
 * @returns {Promise<{cached: boolean, data: Object|null}>}
 */
export const getResumeEmbeddingService = async (resumeId) => {
    const cachedEmbeddings = await getResumeEmbeddingsRepo(resumeId);

    if (cachedEmbeddings) {
        const daysSinceGeneration = 
        (Date.now() - new Date(cachedEmbeddings.generatedAt).getTime()) /
        (1000 * 60 * 60 * 24)

        // Return cached if less than 30 days old
        if (daysSinceGeneration < 30) {
            logger.info(`Cache hit for resume embeddings: ${resumeId}`)
            return { cached: true, data: cachedEmbeddings };
        }
    }

    logger.info(`Cache miss for resume embeddings: ${resumeId}`);
    return { cached: false, data: null };
}

/**
 * Generate embeddings using Python and save to database
 * 
 * This is the BUSINESS LOGIC that can be called from:
 * - Queue processor (async background job)
 * - Direct API call (if needed)
 * - Webhook (when resume is updated)
 * 
 * @param {string} resumeId - Resume ID
 * @param {boolean} invalidateCache - Force regeneration
 * @param {Object} job - Optional BullMQ job for progress updates
 * @returns {Promise<{cached: boolean, data: Object}>}
 */
export const createResumeEmbeddingService = async (resumeId, invalidateCache = false, job = null) => {
    try {
        // Update progress if called from queue
        await job?.updateProgress(10);

        logger.info(`Generating embeddings for resume: ${resumeId}`, { invalidateCache });

        // Call Python to generate embeddings
        await job?.updateProgress(30);
        const pythonResponse = await runPython('generate_resume_embeddings', [resumeId]);

        await job?.updateProgress(70);
        
        if (pythonResponse.error) {
            throw new Error(pythonResponse.error);
        }

        // Structure the data for database
        const embeddingData = {
            resume: resumeId,
            embeddings: pythonResponse.embeddings || {},
            meanEmbeddings: pythonResponse.meanEmbeddings || {},
            metrics: pythonResponse.metrics || { totalExperienceYears: 0 },
            generatedAt: new Date()
        };

        // Check if already exists
        const existing = await getResumeEmbeddingsRepo(resumeId);

        let savedEmbeddings;
        if (existing) {
            // Update existing
            Object.assign(existing, embeddingData);
            savedEmbeddings = await existing.save();
        } else {
            // Create new
            savedEmbeddings = await createResumeEmbeddingRepo(embeddingData);
        }

        await job?.updateProgress(100);

        logger.info(`Embeddings generated successfully for resume: ${resumeId}`, {
            embeddingId: savedEmbeddings._id,
            hasSkills: !!savedEmbeddings.meanEmbeddings.skills,
            totalExperienceYears: savedEmbeddings.metrics.totalExperienceYears
        });
        
        return {
            cached: false,
            data: savedEmbeddings
        };
    } catch (error) {
        logger.error(`Error generating embeddings for resume ${resumeId}:`, error);
        throw error;
    }
}
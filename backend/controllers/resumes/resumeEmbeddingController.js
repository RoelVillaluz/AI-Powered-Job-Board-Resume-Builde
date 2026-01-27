import { resumeEmbeddingQueue } from "../../queues/index.js";
import { getResumeEmbeddingService } from "../../services/resumes/resumeEmbeddingService.js";
import logger from "../../utils/logger.js";

/**
 * POST /api/resume/:resumeId/embeddings
 * 
 * Generate or retrieve embeddings for a resume
 */
export const generateResumeEmbeddings = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const { invalidateCache = false } = req.body;

        // Check cache first
        if (!invalidateCache) {
            const cacheResult = await getResumeEmbeddingService(resumeId);

            if (cacheResult.cached) {
                return res.status(200).json({
                    success: true,
                    cached: true,
                    data: cacheResult.data
                });
            }
        }

        // Cache miss - queue the job
        logger.info(`Cache miss for embeddings ${resumeId}, queuing generation job`);

        const job = await resumeEmbeddingQueue.add('generate-embeddings', {
            resumeId,
            invalidateCache
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 30000
        });

        return res.status(202).json({
            success: true,
            cached: false,
            message: 'Embedding generation queued',
            jobId: job.id,
            statusUrl: `/api/jobs/${job.id}/status`
        });
    } catch (error) {
        logger.error('Error in generateResumeEmbeddings controller:', error);
        return sendResponse(res, {
            ...STATUS_MESSAGES.ERROR.SERVER_ERROR,
            success: false,
            details: error.message
        });
    }
}
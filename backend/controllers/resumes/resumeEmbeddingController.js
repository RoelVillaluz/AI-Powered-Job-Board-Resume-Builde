import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import { resumeEmbeddingQueue } from "../../queues/index.js";
import { getAllResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { getOrGenerateResumeEmbeddingService } from "../../services/resumes/resumeEmbeddingService.js";
import { catchAsync } from "../../utils/errorUtils.js";

/**
 * GET /api/resumes/embeddings
 * 
 * Get all resume embeddings
 * 
 * 
 */
export const getAllResumeEmbeddings = catchAsync(async (req, res) => {
    const embeddings = await getAllResumeEmbeddingsRepo();
    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: embeddings }, 'Resume embeddings');
})

/**
 * POST /api/resumes/:resumeId/embeddings
 * 
 * Generate or retrieve embeddings for a resume
 */
export const getOrGenerateResumeEmbeddings = catchAsync(async (req, res) => {
    const { resumeId } = req.params;
    const { invalidateCache = false } = req.body;
    
    // Service handles all logic
    const result = await getOrGenerateResumeEmbeddingService(resumeId, invalidateCache);
    
    // Controller only handles HTTP response
    if (result.cached) {
        return sendResponse(res, {
            ...STATUS_MESSAGES.SUCCESS.FETCH,
            cached: true,
            data: result.data
        }, 'Resume Embeddings');
    } else {
        return res.status(202).json({
            success: true,
            cached: false,
            message: 'Embedding generation queued',
            jobId: result.jobId,
            statusUrl: `/api/jobs/${result.jobId}/status`
        });
    }
});
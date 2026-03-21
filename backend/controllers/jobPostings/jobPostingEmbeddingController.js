import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import { getOrGenerateJobPostingEmbeddingService } from "../../services/jobPostings/jobPostingEmbeddingService.js";
import { catchAsync } from "../../utils/errorUtils.js";

/**
 * POST /api/job-postings/:jobId/embeddings
 * 
 * Generate or retrieve embeddings for a job posting
 */
export const getOrGenerateJobEmbeddings = catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const { invalidateCache = false } = req.body;

    // Service handles all logic
    const result = await getOrGenerateJobPostingEmbeddingService(jobId, invalidateCache);

    if (result.cached) {
        return sendResponse(
            res, { 
                ...STATUS_MESSAGES.SUCCESS.FETCH, 
                cached: true,
                data: result.data
            }, 'Job embddings')
    } else {
        return res.status(202).json({
            success: true,
            cached: false,
            message: 'Embedding generation queued',
            jobId: result.jobId,
            statusUrl: `/api/jobs/${result.jobId}/status`
        });
    }
})
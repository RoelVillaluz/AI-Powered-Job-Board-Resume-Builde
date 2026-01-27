import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import { getResumeScoreRepo } from "../../repositories/resumes/resumeScoreRepository.js";
import logger from "../../utils/logger.js";

/**
 * Get or calculate resume score
 * 
 * Flow:
 * 1. Check ResumeScore collection (cache)
 * 2. If exists and recent (< 7 days), return cached
 * 3. If not, call Python to calculate
 * 4. Save result to ResumeScore collection
 * 5. Also check/create ResumeEmbedding if needed
 */
export const getResumeScore = catchAsync(async (req, res) => {
    const { resumeId } = req.params;

    

    
})

/**
 * Compare resume to job posting
 * 
 * Flow:
 * 1. Check ResumeJobComparison collection (cache)
 * 2. If exists and recent, return cached
 * 3. Check ResumeEmbedding and JobEmbedding caches
 * 4. Call Python with cache status
 * 5. Save comparison result
 */

export const getResumeJobComparison = catchAsync(async (rq, res) => {
    const { resumeId, jobId } = req.params;
})
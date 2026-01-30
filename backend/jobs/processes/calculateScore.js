import Resume from "../../models/resumes/resumeModel.js";
import { getResumeScoreService, generateResumeScoreService } from "../../services/resumes/resumeScoreService.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js"

/**
 * BullMQ Processor for resume scoring jobs
 */
/**
 * BullMQ Processor for resume scoring jobs
 */
export const resumeScoreProcessor = async (job) => {
    const { resumeId, invalidateCache = false } = job.data;
    
    logger.info('📊 [Queue] Starting score calculation job', {
        jobId: job.id,
        resumeId,
        invalidateCache
    });
    
    await job.updateProgress(5);
    
    try {
        // Validate resume exists
        const resume = await Resume.findById(resumeId);
        if (!resume) {
            throw new AppError(`Resume not found: ${resumeId}`, 404);
        }
        
        await job.updateProgress(10);
        
        // Check cache (unless invalidate is true)
        if (!invalidateCache) {
            const cacheResult = await getResumeScoreService(resumeId);
            
            if (cacheResult.cached) {
                logger.info('✅ [Queue] Using cached score', { resumeId });
                await job.updateProgress(100);
                return {
                    resumeId,
                    cached: true,
                    score: cacheResult.data.totalScore,
                    message: 'Used existing score'
                };
            }
        }
        
        // Calculate new score via SERVICE
        const result = await generateResumeScoreService(resumeId, job);
        
        logger.info('✅ [Queue] Score calculation job completed', {
            jobId: job.id,
            resumeId,
            score: result.data.totalScore
        });
        
        return {
            resumeId,
            score: result.data.totalScore,
            grade: result.data.grade,
            cached: false
        };
        
    } catch (error) {
        logger.error('💥 [Queue] Score calculation job failed', {
            jobId: job.id,
            resumeId,
            error: error.message
        });
        throw error;
    }
};
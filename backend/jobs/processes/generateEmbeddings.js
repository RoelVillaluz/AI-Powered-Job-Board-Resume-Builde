/**
 * Generate Resume Embeddings Job Processor
 * 
 * Uses cached embeddings when available, generates new ones when needed.
 * Integrates with Winston logger for better error tracking.
 */
import Resume from '../../models/resumes/resumeModel.js';
import JobPosting from '../../models/jobPostings/jobPostingModel.js'
import logger from '../../utils/logger.js';
import { AppError, NotFoundError } from '../../middleware/errorHandler.js';
import { getResumeEmbeddingService, createResumeEmbeddingService } from '../../services/resumes/resumeEmbeddingService.js';
import { getJobPostingEmbeddingService, generateJobPostingEmbeddingService } from '../../services/jobPostings/jobPostingEmbeddingService.js';

/**
 * BullMQ Processor for embedding generation jobs
 * 
 * This is the QUEUE WORKER that:
 * - Validates input
 * - Calls the SERVICE to do the work
 * - Handles job-specific logic (progress, retries, etc.)
 * 
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} Result to be stored in job
 */
export const generateResumeEmbeddingsProcessor = async (job) => {
    const { resumeId, invalidateCache = false } = job.data;
    
    logger.info('📊 [Queue] Starting embedding generation job', {
        jobId: job.id,
        resumeId,
        invalidateCache
    });
    
    await job.updateProgress(5);
    
    try {
        // Step 1: Validate resume exists
        const resume = await Resume.findById(resumeId);
        if (!resume) {
            logger.error('❌ Resume not found for embedding generation', { resumeId });
            throw new AppError(`Resume not found: ${resumeId}`, 404);
        }
        
        await job.updateProgress(10);
        
        // Step 2: Check if we should use cache
        if (!invalidateCache) {
            const cacheResult = await getResumeEmbeddingService(resumeId);
            
            if (cacheResult.cached) {
                logger.info('✅ [Queue] Using cached embeddings', { resumeId });
                await job.updateProgress(100);
                return {
                    resumeId,
                    cached: true,
                    embeddingId: cacheResult.data._id,
                    message: 'Used existing embeddings'
                };
            }
        }
        
        // Step 3: Generate new embeddings via SERVICE
        logger.info('🐍 [Queue] Calling embedding service', { resumeId });
        const result = await createResumeEmbeddingService(resumeId, invalidateCache, job);
        
        logger.info('✅ [Queue] Embedding generation job completed', {
            jobId: job.id,
            resumeId,
            embeddingId: result.data._id
        });
        
        return {
            resumeId,
            embeddingId: result.data._id,
            generatedAt: result.data.generatedAt,
            cached: false
        };
        
    } catch (error) {
        logger.error('💥 [Queue] Embedding generation job failed', {
            jobId: job.id,
            resumeId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

/**
 * BullMQ Processor for job posting embedding generation jobs
 *
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} Result to be stored in job
 */
export const generateJobPostingEmbeddingsProcessor = async (job) => {
    const { jobPostingId, invalidateCache = false } = job.data;

    logger.info('📊 [Queue] Starting job posting embedding generation job', {
        jobId: job.id,
        jobPostingId,
        invalidateCache
    });

    await job.updateProgress(5);

    try {
        // Step 1: Validate job posting exists
        const jobPosting = await JobPosting.findById(jobPostingId);
        if (!jobPosting) {
            logger.error('❌ Job posting not found for embedding generation', { jobPostingId });
            throw new NotFoundError(`Job posting: ${jobPostingId}`)
        }

        await job.updateProgress(10);

        // Step 2: Check cache
        if (!invalidateCache) {
            const cacheResult = await getJobPostingEmbeddingService(jobPostingId);

            if (cacheResult.cached) {
                logger.info('✅ [Queue] Using cached job posting embeddings', { jobPostingId });
                await job.updateProgress(100);

                return {
                    jobPostingId,
                    cached: true,
                    embeddingId: cacheResult.data._id,
                    message: 'Used existing job posting embeddings'
                };
            }
        }

        // Step 3: Generate new embeddings
        logger.info('🐍 [Queue] Calling job embedding service', { jobPostingId });
        const result = await generateJobPostingEmbeddingService(jobPostingId, invalidateCache, job);

        logger.info('✅ [Queue] Job posting embedding generation completed', {
            jobId: job.id,
            jobPostingId,
            embeddingId: result.data._id
        });

        return {
            jobPostingId,
            embeddingId: result.data._id,
            generatedAt: result.data.generatedAt,
            cached: false
        };

    } catch (error) {
        logger.error('💥 [Queue] Job posting embedding generation failed', {
            jobId: job.id,
            jobPostingId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
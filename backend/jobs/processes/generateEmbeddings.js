/**
 * Generate Resume Embeddings Job Processor
 * 
 * Uses cached embeddings when available, generates new ones when needed.
 * Integrates with Winston logger for better error tracking.
 */

import Resume from '../../models/resumes/resumeModel.js';
import logger from '../../utils/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import { getResumeEmbeddingService, createResumeEmbeddingService } from '../../services/resumes/resumeEmbeddingService.js';

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
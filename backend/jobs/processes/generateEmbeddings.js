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
import { getSocketId } from '../../sockets/presence.js';
import { getIO } from '../../sockets/index.js';

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
    const { resumeId, userId, invalidateCache = false } = job.data; // ← destructure userId
    const startTime = Date.now();

    const emit = (event, data) => {
        if (!userId) return;
        const socketId = getSocketId(userId);
        const io = getIO();
        if (socketId && io) io.to(socketId).emit(event, data);
    };

    logger.info('📊 [Queue] Starting embedding generation job', {
        jobId: job.id,
        resumeId,
        invalidateCache
    });

    try {
        emit('embedding:progress', { status: 'starting', progress: 5, message: 'Starting embedding generation...' });
        await job.updateProgress(5);

        const resume = await Resume.findById(resumeId);
        if (!resume) {
            logger.error('❌ Resume not found for embedding generation', { resumeId });
            throw new AppError(`Resume not found: ${resumeId}`, 404);
        }

        await job.updateProgress(10);

        if (!invalidateCache) {
            const cacheResult = await getResumeEmbeddingService(resumeId);
            if (cacheResult.cached) {
                emit('embedding:complete', { cached: true, data: cacheResult.data });
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

        emit('embedding:progress', { status: 'generating', progress: 20, message: 'Analyzing your resume sections...' });
        logger.info('🐍 [Queue] Calling embedding service', { resumeId });

        // ✅ pass userId as 4th argument
        const result = await createResumeEmbeddingService(resumeId, invalidateCache, job, userId);
        const duration = Date.now() - startTime;

        emit('embedding:complete', { cached: false, data: result.data });

        logger.info('✅ [Queue] Embedding generation job completed', {
            jobId: job.id,
            resumeId,
            embeddingId: result.data._id,
            durationMs: duration,
            durationReadable: `${(duration / 1000).toFixed(1)}s`
        });

        return {
            resumeId,
            embeddingId: result.data._id,
            generatedAt: result.data.generatedAt,
            cached: false,
            durationMs: duration
        };

    } catch (error) {
        emit('embedding:error', { message: 'Embedding generation failed. Please try again.' });
        logger.error('💥 [Queue] Embedding generation job failed', {
            jobId: job.id,
            resumeId,
            error: error.message,
            stack: error.stack,
            durationMs: Date.now() - startTime
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
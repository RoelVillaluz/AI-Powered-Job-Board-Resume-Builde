/**
 * Generate Resume Embeddings Job Processor
 *
 * Handles the full embedding + scoring pipeline as a single BullMQ job.
 * Score generation is triggered directly inside createResumeEmbeddingService
 * (not via a separate queue job) to guarantee sequential execution.
 */
import Resume from '../../models/resumes/resumeModel.js';
import JobPosting from '../../models/jobPostings/jobPostingModel.js';
import logger from '../../utils/logger.js';
import { AppError, NotFoundError } from '../../middleware/errorHandler.js';
import { getResumeEmbeddingService, createResumeEmbeddingService } from '../../services/resumes/resumeEmbeddingService.js';
import { getResumeScoreService } from '../../services/resumes/resumeScoreService.js';
import { getJobPostingEmbeddingService, generateJobPostingEmbeddingService } from '../../services/jobPostings/jobPostingEmbeddingService.js';
import { getSocketId } from '../../sockets/presence.js';
import { getIO } from '../../sockets/index.js';

/**
 * BullMQ processor for resume embedding generation jobs.
 *
 * Orchestrates the full pipeline:
 *   1. Validate resume exists
 *   2. Check embedding cache (return early if valid)
 *   3. Call createResumeEmbeddingService — which runs Python embedding,
 *      saves to DB, then runs Python scoring and saves that too
 *   4. Fetch the saved score and emit score:complete to the client
 *
 * Socket events emitted (absolute 0–100% scale across full pipeline):
 *   embedding:progress → 2%, 8% (pre-service setup)
 *   embedding:progress → 10%, 20%, 60%, 70% (inside createResumeEmbeddingService)
 *   score:progress     → 75%, 88%, 95% (inside generateResumeScoreService)
 *   score:complete     → emitted here after everything resolves
 *   embedding:error / score:error → on failure
 *
 * @param {import('bullmq').Job} job - BullMQ job object with { resumeId, userId, invalidateCache }
 * @returns {Promise<{ resumeId, embeddingId, generatedAt, cached, durationMs }>}
 */
export const generateResumeEmbeddingsProcessor = async (job) => {
    const { resumeId, userId, invalidateCache = false } = job.data;
    const startTime = Date.now();

    const emit = (event, data) => {
        if (!userId) return;
        const socketId = getSocketId(userId);
        const io = getIO();
        if (socketId && io) io.to(socketId).emit(event, data);
    };

    logger.info('📊 [Queue] Starting embedding generation job', { jobId: job.id, resumeId, invalidateCache });

    try {
        emit('embedding:progress', { progress: 2, message: 'Starting analysis...' });
        await job.updateProgress(2);

        const resume = await Resume.findById(resumeId);
        if (!resume) throw new AppError(`Resume not found: ${resumeId}`, 404);

        await job.updateProgress(5);

        if (!invalidateCache) {
            const cacheResult = await getResumeEmbeddingService(resumeId);
            if (cacheResult.cached) {
                // Embeddings cached — check if score is also cached
                const cachedScore = await getResumeScoreService(resumeId);
                emit('embedding:complete', { cached: true, data: cacheResult.data });
                if (cachedScore.cached) {
                    emit('score:complete', { cached: true, data: cachedScore.data });
                }
                await job.updateProgress(100);
                return { resumeId, cached: true, embeddingId: cacheResult.data._id };
            }
        }

        emit('embedding:progress', { progress: 8, message: 'Reading your resume...' });
        await job.updateProgress(8);

        logger.info('🐍 [Queue] Calling embedding + score pipeline', { resumeId });

        // createResumeEmbeddingService runs Python embedding → saves → runs Python
        // scoring → saves. emit is passed through so progress fires continuously.
        const result = await createResumeEmbeddingService(resumeId, invalidateCache, job, userId, emit);

        // Both embedding and score are saved at this point — fetch score to emit complete
        const finalScore = await getResumeScoreService(resumeId);

        const duration = Date.now() - startTime;

        emit('embedding:complete', { cached: false, data: result.data });

        if (finalScore.cached) {
            emit('score:complete', { cached: false, data: finalScore.data });
        }

        logger.info('✅ [Queue] Embedding + score pipeline completed', {
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
        emit('embedding:error', { message: 'Resume analysis failed. Please try again.' });
        emit('score:error', { message: 'Resume analysis failed. Please try again.' });
        logger.error('💥 [Queue] Embedding + score pipeline failed', {
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
 * BullMQ processor for job posting embedding generation jobs.
 *
 * Validates the job posting exists, checks the embedding cache,
 * and generates new embeddings via Python if needed.
 *
 * @param {import('bullmq').Job} job - BullMQ job with { jobPostingId, invalidateCache }
 * @returns {Promise<{ jobPostingId, embeddingId, generatedAt, cached }>}
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
        const jobPosting = await JobPosting.findById(jobPostingId);
        if (!jobPosting) throw new NotFoundError(`Job posting: ${jobPostingId}`);

        await job.updateProgress(10);

        if (!invalidateCache) {
            const cacheResult = await getJobPostingEmbeddingService(jobPostingId);
            if (cacheResult.cached) {
                logger.info('✅ [Queue] Using cached job posting embeddings', { jobPostingId });
                await job.updateProgress(100);
                return { jobPostingId, cached: true, embeddingId: cacheResult.data._id };
            }
        }

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
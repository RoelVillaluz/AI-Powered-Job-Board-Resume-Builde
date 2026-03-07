/**
 * BullMQ processors for resume and job posting embedding generation.
 *
 * Embedding + scoring for resumes is handled as a single sequential pipeline
 * within one job — score generation is triggered directly inside
 * `createResumeEmbeddingService`, not via a separate queue job, to guarantee
 * embeddings are fully saved before scoring begins.
 */

import Resume from "../../models/resumes/resumeModel.js";
import JobPosting from "../../models/jobPostings/jobPostingModel.js";
import logger from "../../utils/logger.js";
import { AppError, NotFoundError } from "../../middleware/errorHandler.js";
import {
    getResumeEmbeddingService,
    createResumeEmbeddingService
} from "../../services/resumes/resumeEmbeddingService.js";
import { getResumeScoreService } from "../../services/resumes/resumeScoreService.js";
import {
    getJobPostingEmbeddingService,
    generateJobPostingEmbeddingService
} from "../../services/jobPostings/jobPostingEmbeddingService.js";
import { getSocketId } from "../../sockets/presence.js";
import { getIO } from "../../sockets/index.js";

/**
 * BullMQ processor for resume embedding generation jobs.
 *
 * Orchestrates the full embedding + scoring pipeline as a single job:
 *
 *   1. Validate resume exists in the database.
 *   2. Return early with cached data if embeddings (and score) are still fresh.
 *   3. Call `createResumeEmbeddingService`, which runs the full sequential pipeline:
 *        a. Python generates embedding vectors (progress streamed via `emit`)
 *        b. Embeddings saved to DB
 *        c. Python calculates score (progress streamed via `emit`)
 *        d. Score saved to DB
 *   4. Fetch the freshly saved score and emit `score:complete` to the client.
 *
 * ## Socket events emitted (absolute 0–100% scale across the full pipeline)
 *
 * | Event               | Progress | Source                                    |
 * |---------------------|----------|-------------------------------------------|
 * | embedding:progress  | 2%, 5%   | This processor (setup phase)              |
 * | embedding:progress  | 8%       | This processor (pre-service)              |
 * | embedding:progress  | 15%–58%  | Python via `runPython` stream             |
 * | score:progress      | 68%–94%  | Python via `runPython` stream             |
 * | embedding:complete  | —        | This processor (after pipeline resolves)  |
 * | score:complete      | —        | This processor (after pipeline resolves)  |
 * | embedding:error     | —        | This processor (on any failure)           |
 * | score:error         | —        | This processor (on any failure)           |
 *
 * All user-facing message strings originate from Python's `emit_progress()` calls.
 * This processor does not emit any hardcoded progress messages.
 *
 * @param {import('bullmq').Job} job
 *   BullMQ job with payload: `{ resumeId: string, userId: string, invalidateCache: boolean }`
 *
 * @returns {Promise<{
 *   resumeId: string,
 *   embeddingId: string,
 *   generatedAt: Date,
 *   cached: boolean,
 *   durationMs: number
 * }>}
 *
 * @throws {AppError} If the resume document is not found.
 * @throws {Error} If the Python pipeline or DB operations fail.
 */
export const generateResumeEmbeddingsProcessor = async (job) => {
    const { resumeId, userId, invalidateCache = false } = job.data;
    const startTime = Date.now();

    /**
     * Emit a socket event to the authenticated user if they are currently connected.
     *
     * @param {string} event - Socket event name (e.g. "embedding:progress").
     * @param {object} data - Payload forwarded to the client.
     */
    const emit = (event, data) => {
        if (!userId) return;
        const socketId = getSocketId(userId);
        const io = getIO();
        if (socketId && io) io.to(socketId).emit(event, data);
    };

    logger.info("📊 [Queue] Starting embedding generation job", {
        jobId: job.id,
        resumeId,
        invalidateCache
    });

    try {
        emit("embedding:progress", { progress: 2 });
        await job.updateProgress(2);

        const resume = await Resume.findById(resumeId);
        if (!resume) throw new AppError(`Resume not found: ${resumeId}`, 404);

        await job.updateProgress(5);

        // Return early if both embeddings and score are already cached and fresh
        if (!invalidateCache) {
            const cacheResult = await getResumeEmbeddingService(resumeId);

            if (cacheResult.cached) {
                const cachedScore = await getResumeScoreService(resumeId);

                emit("embedding:complete", { cached: true, data: cacheResult.data });
                if (cachedScore.cached) {
                    emit("score:complete", { cached: true, data: cachedScore.data });
                }

                await job.updateProgress(100);

                logger.info("✅ [Queue] Returning cached embeddings + score", { resumeId });
                return { resumeId, cached: true, embeddingId: cacheResult.data._id };
            }
        }

        await job.updateProgress(8);

        logger.info("🐍 [Queue] Starting embedding + score pipeline", { resumeId });

        // createResumeEmbeddingService runs:
        //   Python embedding → save → Python scoring → save
        // emit is passed through so Python progress fires on this socket connection.
        const result = await createResumeEmbeddingService(resumeId, invalidateCache, job, userId, emit);

        // Both embedding and score are persisted at this point
        const finalScore = await getResumeScoreService(resumeId);
        const duration = Date.now() - startTime;

        emit("embedding:complete", { cached: false, data: result.data });

        if (finalScore.cached) {
            emit("score:complete", { cached: false, data: finalScore.data });
        }

        logger.info("✅ [Queue] Embedding + score pipeline completed", {
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
        emit("embedding:error", { message: "Resume analysis failed. Please try again." });
        emit("score:error", { message: "Resume analysis failed. Please try again." });

        logger.error("💥 [Queue] Embedding + score pipeline failed", {
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
 * Validates the job posting exists, checks the embedding cache, and generates
 * new embeddings via Python if the cache is missing or invalidated.
 *
 * Progress events from Python are streamed via `runPython` inside
 * `generateJobPostingEmbeddingService` — this processor does not emit
 * socket events (job postings are a server-side background operation).
 *
 * @param {import('bullmq').Job} job
 *   BullMQ job with payload: `{ jobPostingId: string, invalidateCache: boolean }`
 *
 * @returns {Promise<{
 *   jobPostingId: string,
 *   embeddingId: string,
 *   generatedAt: Date,
 *   cached: boolean
 * }>}
 *
 * @throws {NotFoundError} If the job posting document is not found.
 * @throws {Error} If the Python pipeline or DB operations fail.
 */
export const generateJobPostingEmbeddingsProcessor = async (job) => {
    const { jobPostingId, invalidateCache = false } = job.data;

    logger.info("📊 [Queue] Starting job posting embedding generation job", {
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
                logger.info("✅ [Queue] Using cached job posting embeddings", { jobPostingId });
                await job.updateProgress(100);
                return { jobPostingId, cached: true, embeddingId: cacheResult.data._id };
            }
        }

        logger.info("🐍 [Queue] Calling job embedding service", { jobPostingId });

        const result = await generateJobPostingEmbeddingService(jobPostingId, invalidateCache, job);

        logger.info("✅ [Queue] Job posting embedding generation completed", {
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
        logger.error("💥 [Queue] Job posting embedding generation failed", {
            jobId: job.id,
            jobPostingId,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
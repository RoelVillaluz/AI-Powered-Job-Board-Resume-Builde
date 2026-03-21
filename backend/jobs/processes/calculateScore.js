import Resume from "../../models/resumes/resumeModel.js";
import { getResumeScoreService, generateResumeScoreService } from "../../services/resumes/resumeScoreService.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getSocketId } from "../../sockets/presence.js";
import { getIO } from "../../sockets/index.js";

/**
 * BullMQ processor for standalone resume score calculation jobs.
 *
 * This processor handles score regeneration requested independently of the
 * embedding pipeline — for example, when a user manually refreshes their score
 * after editing their resume. It is NOT used during onboarding; in that flow
 * the score is triggered directly by `createResumeEmbeddingService` after
 * embeddings are saved.
 *
 * ## Flow
 *
 *   1. Validate resume exists in the database.
 *   2. Return early with cached score if still fresh and `invalidateCache` is false.
 *   3. Call `generateResumeScoreService`, which runs Python and saves the result.
 *   4. Emit `score:complete` to the client.
 *
 * ## Socket events emitted
 *
 * | Event          | Progress | Source                              |
 * |----------------|----------|-------------------------------------|
 * | score:progress | 5%       | This processor (startup)            |
 * | score:progress | 68%–94%  | Python via `runPython` stream       |
 * | score:complete | —        | This processor (after save)         |
 * | score:error    | —        | This processor (on any failure)     |
 *
 * The 5% event is the only message emitted by this processor — all subsequent
 * user-facing strings originate from Python's `emit_progress()` calls in `main.py`.
 * This keeps responsibility for progress messaging in Python, where the actual
 * work is happening.
 *
 * @param {import('bullmq').Job} job
 *   BullMQ job with payload: `{ resumeId: string, userId: string, invalidateCache: boolean }`
 *
 * @returns {Promise<{
 *   resumeId: string,
 *   score: number,
 *   grade: string,
 *   cached: boolean,
 *   durationMs: number
 * }>}
 *
 * @throws {AppError} If the resume document is not found.
 * @throws {Error} If the Python scoring pipeline or DB operations fail.
 */
export const resumeScoreProcessor = async (job) => {
    const { resumeId, userId, invalidateCache = false } = job.data;
    const startTime = Date.now();

    /**
     * Emit a socket event to the authenticated user if they are currently connected.
     *
     * @param {string} event - Socket event name (e.g. "score:progress").
     * @param {object} data - Payload forwarded to the client.
     */
    const emit = (event, data) => {
        if (!userId) return;
        const socketId = getSocketId(userId);
        const io = getIO();
        if (socketId && io) io.to(socketId).emit(event, data);
    };

    logger.info("📊 [Queue] Starting score calculation job", {
        jobId: job.id,
        resumeId,
        invalidateCache
    });

    try {
        // Emit an initial event so the client knows the job has started.
        // Python will take over progress messaging from here.
        emit("score:progress", { progress: 5 });
        await job.updateProgress(5);

        const resume = await Resume.findById(resumeId);
        if (!resume) throw new AppError(`Resume not found: ${resumeId}`, 404);

        await job.updateProgress(10);

        // Return early if a fresh valid score exists
        if (!invalidateCache) {
            const cacheResult = await getResumeScoreService(resumeId);

            if (cacheResult.cached) {
                emit("score:complete", { cached: true, data: cacheResult.data });
                await job.updateProgress(100);

                logger.info("✅ [Queue] Returning cached score", { resumeId });
                return { resumeId, cached: true };
            }
        }

        // generateResumeScoreService calls Python and streams progress via emit.
        // Python emits score:progress at 68%, 76%, 83%, 89%, and 94%.
        const result = await generateResumeScoreService(resumeId, job, emit);

        const duration = Date.now() - startTime;

        emit("score:complete", { cached: false, data: result.data });

        logger.info("✅ [Queue] Score calculation job completed", {
            jobId: job.id,
            resumeId,
            score: result.data.totalScore,
            durationMs: duration,
            durationReadable: `${(duration / 1000).toFixed(1)}s`
        });

        return {
            resumeId,
            score: result.data.totalScore,
            grade: result.data.grade,
            cached: false,
            durationMs: duration
        };

    } catch (error) {
        emit("score:error", { message: "Score calculation failed. Please try again." });

        logger.error("💥 [Queue] Score calculation job failed", {
            jobId: job.id,
            resumeId,
            error: error.message,
            durationMs: Date.now() - startTime
        });

        throw error;
    }
};
import Resume from "../../models/resumes/resumeModel.js";
import { getResumeScoreService, generateResumeScoreService } from "../../services/resumes/resumeScoreService.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middleware/errorHandler.js"
import { getSocketId } from "../../sockets/presence.js";
import { getIO } from "../../sockets/index.js";

/**
 * BullMQ Processor for resume scoring jobs
 */
/**
 * BullMQ Processor for resume scoring jobs
 */
export const resumeScoreProcessor = async (job) => {
    const { resumeId, userId, invalidateCache = false } = job.data;
    const startTime = Date.now();

    const emit = (event, data) => {
        if (!userId) return;
        const socketId = getSocketId(userId);
        const io = getIO();
        if (socketId && io) io.to(socketId).emit(event, data); // ← guard for null io
    };

    logger.info('📊 [Queue] Starting score calculation job', {
        jobId: job.id,
        resumeId,
        invalidateCache
    });

    try {
        emit('score:progress', { status: 'starting', progress: 5, message: 'Starting score calculation...' });
        await job.updateProgress(5);

        const resume = await Resume.findById(resumeId);
        if (!resume) throw new AppError(`Resume not found: ${resumeId}`, 404);

        await job.updateProgress(10);

        if (!invalidateCache) {
            const cacheResult = await getResumeScoreService(resumeId);
            if (cacheResult.cached) {
                emit('score:complete', { cached: true, data: cacheResult.data });
                logger.info('✅ [Queue] Using cached score', { resumeId });
                await job.updateProgress(100);
                return { resumeId, cached: true };
            }
        }

        emit('score:progress', { status: 'calculating', progress: 20, message: 'Analyzing your resume...' });

        const result = await generateResumeScoreService(resumeId, job);

        const duration = Date.now() - startTime;

        emit('score:complete', { cached: false, data: result.data });

        logger.info('✅ [Queue] Score calculation job completed', {
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
        emit('score:error', { message: 'Score calculation failed. Please try again.' });
        logger.error('💥 [Queue] Score calculation job failed', {
            jobId: job.id,
            resumeId,
            error: error.message,
            durationMs: Date.now() - startTime
        });
        throw error;
    }
};
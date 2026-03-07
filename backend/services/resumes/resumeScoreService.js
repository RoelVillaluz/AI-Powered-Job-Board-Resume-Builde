import { resumeScoringQueue } from "../../queues/index.js";
import { getResumeScoreRepo, upsertResumeScoreRepo } from "../../repositories/resumes/resumeScoreRepository.js";
import { getResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { validateResumeScore } from "../../utils/scoreValidationUtils.ts";
import logger from "../../utils/logger.js";
import { runPython } from "../../utils/pythonRunner.js";

/**
 * Main service function called by the score controller.
 *
 * Handles cache checking and queue decision. If a valid cached score
 * exists it is returned immediately. Otherwise a BullMQ job is queued
 * and the jobId is returned so the client can track via socket events.
 *
 * NOTE: This function queues an independent score job. During onboarding
 * the score is NOT triggered through here — it is called directly via
 * generateResumeScoreService from within createResumeEmbeddingService
 * to guarantee embeddings are fully saved before scoring begins.
 *
 * @param {string} resumeId - The resume ID to score
 * @param {boolean} invalidateCache - Force regeneration even if cache is valid
 * @param {string|null} userId - Authenticated user ID (for socket progress events)
 * @returns {Promise<{ cached: true, data: object } | { cached: false, jobId: string }>}
 */
export const getOrGenerateResumeScoreService = async (resumeId, invalidateCache = false, userId = null) => {
    logger.info(`getOrGenerateResumeScoreService called`, {
        resumeId,
        invalidateCache,
        userId,
        stack: new Error().stack
    });

    // ✅ Guard: don't queue score if embeddings don't exist yet.
    // During onboarding the embedding job calls generateResumeScoreService
    // directly after saving embeddings — queueing here would race against that.
    const embeddings = await getResumeEmbeddingsRepo(resumeId);
    if (!embeddings) {
        logger.info(`Score requested but embeddings not ready for resume: ${resumeId} — returning pending`);
        return { cached: false, status: 'pending' };
    }

    if (!invalidateCache) {
        const cachedResult = await getResumeScoreService(resumeId);

        if (cachedResult.cached) {
            const validation = validateResumeScore(cachedResult.data);

            if (validation.valid) {
                logger.info(`Valid cached score for ${resumeId}`, { warnings: validation.warnings });
                return { cached: true, data: cachedResult.data };
            }

            logger.warn(`Invalid cached score for resume: ${resumeId}. Regenerating...`, {
                errors: validation.errors,
                resumeId
            });
            invalidateCache = true;
        }
    }

    logger.info(`Queueing score generation for resume: ${resumeId}`, {
        reason: invalidateCache ? 'forced_regeneration' : 'cache_miss'
    });

    const job = await resumeScoringQueue.add('calculate-score', {
        resumeId,
        userId,
        invalidateCache
    }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 60000
    });

    return { cached: false, jobId: job.id };
};

/**
 * Checks if a cached resume score exists and is still fresh (< 7 days old).
 * Does not validate score content — use validateResumeScore for that.
 *
 * @param {string} resumeId - Resume ID
 * @returns {Promise<{ cached: boolean, data: object|null }>}
 */
export const getResumeScoreService = async (resumeId) => {
    const cachedScore = await getResumeScoreRepo(resumeId);

    if (cachedScore) {
        const daysSinceCalculation =
            (Date.now() - new Date(cachedScore.calculatedAt).getTime()) /
            (1000 * 60 * 60 * 24);

        if (daysSinceCalculation < 7) {
            logger.info(`Cache hit for resume score: ${resumeId}`);
            return { cached: true, data: cachedScore };
        }
    }

    logger.info(`Cache miss for resume score: ${resumeId}`);
    return { cached: false, data: null };
};

/**
 * Calculates a resume score using the Python scoring service and persists it.
 *
 * This function is designed to be called in two contexts:
 *
 *   1. From createResumeEmbeddingService (primary/onboarding path):
 *      Called directly with `job = null` after embeddings are saved.
 *      Emits socket progress at absolute pipeline percentages (75–95%)
 *      so the frontend sees a smooth 0–100% across both embedding + scoring.
 *      The caller (generateResumeEmbeddingsProcessor) emits score:complete.
 *
 *   2. From resumeScoreProcessor (standalone re-score path):
 *      Called when a user requests a score refresh independently of embeddings.
 *      Receives the BullMQ job object for updateProgress and its own emit function.
 *      The processor emits score:complete after this resolves.
 *
 * Progress values emitted (absolute pipeline scale):
 *   - 75% → Python scoring started
 *   - 88% → Python response received, processing
 *   - 95% → Saving to database
 *
 * @param {string} resumeId - The resume ID to score
 * @param {object|null} job - Optional BullMQ job for updateProgress calls
 * @param {Function} emit - Socket emit function; defaults to no-op
 * @returns {Promise<{ cached: false, data: object }>} The persisted resume score
 * @throws {Error} If Python scoring fails or database persistence fails
 */
export const generateResumeScoreService = async (resumeId, job = null, emit = () => {}) => {
    try {
        emit('score:progress', { progress: 75, message: 'Running AI scoring analysis...' });
        await job?.updateProgress(75);

        logger.info(`Calculating score for resume: ${resumeId}`);

        // Python runs here — second long wait (~15-30s)
        const pythonResponse = await runPython('score_resume', [resumeId]);

        emit('score:progress', { progress: 88, message: 'Scoring your qualifications...' });
        await job?.updateProgress(88);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        const scoreData = {
            resume: resumeId,
            completenessScore: pythonResponse.breakdown?.completeness || 0,
            experienceScore: pythonResponse.breakdown?.experience || 0,
            skillsScore: pythonResponse.breakdown?.skills || 0,
            certificationScore: pythonResponse.breakdown?.certifications || 0,
            totalScore: pythonResponse.overall_score || 0,
            estimatedExperienceYears: pythonResponse.total_experience_years || 0,
            strengths: pythonResponse.strengths || [],
            improvements: pythonResponse.improvements || [],
            recommendations: pythonResponse.recommendations || [],
            overallMessage: pythonResponse.overall_message || '',
            calculatedAt: new Date()
        };

        emit('score:progress', { progress: 95, message: 'Saving your results...' });
        await job?.updateProgress(95);

        const savedScore = await upsertResumeScoreRepo(resumeId, scoreData);

        await job?.updateProgress(100);
        logger.info(`Score calculated successfully for resume: ${resumeId}`);

        return { cached: false, data: savedScore };
    } catch (error) {
        logger.error(`Error calculating score for resume ${resumeId}:`, error);
        throw error;
    }
};
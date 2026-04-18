import { resumeScoringQueue } from "../../queues/index.js";
import { getResumeScoreRepo, upsertResumeScoreRepo } from "../../repositories/resumes/resumeScoreRepository.js";
import { getResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { validateResumeScore } from "../../utils/scoreValidationUtils.ts";
import logger from "../../utils/logger.js";
import { runPython } from "../../infrastructure/python/pythonRunner.js";

/**
 * Main service entry point for resume score generation.
 *
 * Handles cache validation and queue dispatch. If a valid cached score exists
 * and `invalidateCache` is false, returns it immediately without queuing.
 * Otherwise queues a BullMQ job and returns the jobId for socket tracking.
 *
 * ## Embedding guard
 *
 * If no embeddings exist for the resume yet, returns `{ cached: false, status: "pending" }`
 * without queuing. This prevents a race condition during onboarding where the score
 * job could start before the embedding job has finished saving — the embedding pipeline
 * calls `generateResumeScoreService` directly after saving embeddings.
 *
 * ## When NOT to use this function
 *
 * During onboarding, score generation is triggered directly by `createResumeEmbeddingService`
 * via `generateResumeScoreService` — NOT by queueing through here. This guarantees
 * embeddings are persisted before scoring begins.
 *
 * @param {string} resumeId - MongoDB ObjectId string for the resume.
 * @param {boolean} [invalidateCache=false] - Force regeneration even if a valid cache exists.
 * @param {string|null} [userId=null] - Authenticated user ID for socket progress events.
 *
 * @returns {Promise<
 *   { cached: true, data: object } |
 *   { cached: false, jobId: string } |
 *   { cached: false, status: "pending" }
 * >}
 *   - `cached: true`        — Valid score found; `data` is the cached score document.
 *   - `cached: false, jobId` — Job queued; track progress via socket events.
 *   - `cached: false, status: "pending"` — Embeddings not ready; score cannot be queued yet.
 */
export const getOrGenerateResumeScoreService = async (resumeId, invalidateCache = false, userId = null) => {
    logger.info(`getOrGenerateResumeScoreService called`, { resumeId, invalidateCache, userId });

    // Guard: embeddings must exist before scoring can run
    const embeddings = await getResumeEmbeddingsRepo(resumeId);
    if (!embeddings) {
        logger.info(`Score requested but embeddings not ready for resume: ${resumeId} — returning pending`);
        return { cached: false, status: "pending" };
    }

    if (!invalidateCache) {
        const cachedResult = await getResumeScoreService(resumeId);

        if (cachedResult.cached) {
            const validation = validateResumeScore(cachedResult.data);

            if (validation.valid) {
                logger.info(`Valid cached score for resume: ${resumeId}`, { warnings: validation.warnings });
                return { cached: true, data: cachedResult.data };
            }

            logger.warn(`Invalid cached score for resume: ${resumeId} — regenerating`, {
                errors: validation.errors
            });
            invalidateCache = true;
        }
    }

    logger.info(`Queueing score generation for resume: ${resumeId}`, {
        reason: invalidateCache ? "forced_regeneration" : "cache_miss"
    });

    const job = await resumeScoringQueue.add("calculate-score", {
        resumeId,
        userId,
        invalidateCache
    }, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        timeout: 60000
    });

    return { cached: false, jobId: job.id };
};

/**
 * Checks whether a cached score document exists and is still fresh.
 *
 * Freshness threshold: 7 days from `calculatedAt`.
 * Does not validate score content — use `validateResumeScore` for that.
 *
 * @param {string} resumeId - MongoDB ObjectId string for the resume.
 *
 * @returns {Promise<{ cached: true, data: object } | { cached: false, data: null }>}
 *   - `cached: true`  — Fresh score document found; `data` is the document.
 *   - `cached: false` — No document found or document is stale; `data` is null.
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
 * Runs Python scoring for a resume and persists the result to the database.
 * 
 * @param {string} resumeId - MongoDB ObjectId string for the resume.
 * @param {import('bullmq').Job|null} [job=null] - BullMQ job for `updateProgress`, or null.
 * @param {Function} [emit=()=>{}]
 *   Socket emit callback forwarded to `runPython` for streaming progress.
 *   Signature: `emit(event: string, payload: object) => void`
 *
 * @returns {Promise<{ cached: false, data: object }>}
 *   Always returns `cached: false`; `data` is the saved score document.
 *
 * @throws {Error} If the Python scoring process fails or the DB upsert fails.
 */
export const generateResumeScoreService = async (resumeId, job = null, emit = () => {}) => {
    try {
        await job?.updateProgress(65);

        logger.info(`Calculating score for resume: ${resumeId}`);

        // Python runs here (~15–30s). Progress events are streamed in real-time
        // via the emit callback — no hardcoded messages in this layer.
        const pythonResponse = await runPython("score_resume", [resumeId], emit);

        await job?.updateProgress(95);

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
            overallMessage: pythonResponse.overall_message || "",
            calculatedAt: new Date()
        };

        const savedScore = await upsertResumeScoreRepo(resumeId, scoreData);

        await job?.updateProgress(100);

        logger.info(`Score calculated successfully for resume: ${resumeId}`, {
            totalScore: savedScore.totalScore
        });

        return { cached: false, data: savedScore };

    } catch (error) {
        logger.error(`Error calculating score for resume ${resumeId}:`, error);
        throw error;
    }
};
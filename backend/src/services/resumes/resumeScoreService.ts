import { resumeScoringQueue } from "../../queues/index.js";
import { getResumeScoreRepo, upsertResumeScoreRepo } from "../../repositories/resumes/resumeScoreRepository.js";
import { getResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { validateResumeScore } from "../../utils/scoreValidationUtils.js";
import logger from "../../utils/logger.js";
import { PythonEmit } from "../../types/python.types.js";
import { QueueJob } from "../../types/queues.types.js";
import { orchestrateComputeJob } from "../../infrastructure/jobs/core/orchestrateComputeJob.js";
import { executeComputePipeline } from "../../infrastructure/jobs/core/executeComputePipeline.js";
import { scoringRegistry } from "../../infrastructure/jobs/domains/scoring/scoringRegistry.js";
import { executeWithFallback } from "../../infrastructure/jobs/core/executeWithFallback.js";
import { Types } from "mongoose";
import { createResumeEmbeddingService } from "./resumeEmbeddingService.js";

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
export const getOrGenerateResumeScoreService = async (
    resumeId: string,
    invalidateCache = false,
    userId: string | null = null
) => {
    logger.info(`getOrGenerateResumeScoreService called`, {
        resumeId,
        invalidateCache,
        userId
    });

    const embeddings = await getResumeEmbeddingsRepo(resumeId);
    if (!embeddings) {
        logger.info(
            `Embeddings not ready for resume: ${resumeId} — triggering embedding pipeline instead`
        );

        return createResumeEmbeddingService(
            resumeId,
            false,
            null,
            userId,
            () => {}, // no-op emit — progress goes via worker socket
        );
    }

    const entity = scoringRegistry.resumeScore;

    return orchestrateComputeJob({
        invalidateCache,
        logContext: `ResumeScore ${resumeId}`,
        getCached: () => getResumeScoreService(resumeId),
        validateShape: (data) => validateResumeScore(data).valid,
        queueGeneration: () =>
            entity.queue({
                id: resumeId,
                resumeId,
                userId,
                invalidateCache
            }),
        fallbackGeneration: async () => {
            const result = await entity.fallback(
                resumeId,
                invalidateCache,
                null,
                {
                    userId: userId ?? undefined,
                    emit: () => {}
                }
            );
            return result.data;
        }
    });
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
export const getResumeScoreService = async (resumeId: string) => {
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

export const generateResumeScoreService = async (
    resumeId: string,
    invalidateCache = false,
    job: QueueJob | null = null,
    userId: string | null = null,
    emit: PythonEmit = () => {},   
) => {
    const entity = scoringRegistry.resumeScore;

    return executeWithFallback({
        queueFn: () =>
            entity.queue({ 
                id: resumeId, 
                resumeId, 
                userId: userId ?? '', 
                invalidateCache 
            }),

        fallbackFn: () =>
            entity.fallback(resumeId, invalidateCache, job, {
                userId: userId ?? undefined,
                emit,
            }),
    });
};

export const upsertResumeScoreService = async (
    resumeId: string | Types.ObjectId,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {}
) => {
    return executeComputePipeline({
        entityKey: "resumeScore",
        id: new Types.ObjectId(resumeId),
        job,
        emit
    });
};
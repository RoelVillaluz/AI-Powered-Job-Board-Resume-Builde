import { resumeEmbeddingQueue } from "../../queues/index.js";
import { getResumeEmbeddingsRepo, createResumeEmbeddingRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { generateResumeScoreService } from "./resumeScoreService.js";
import { validateResumeEmbeddings } from "../../utils/embeddingValidationUtils.ts";
import logger from "../../utils/logger.js";
import { runPython } from "../../utils/pythonRunner.js";
import { UnauthorizedError } from "../../middleware/errorHandler.js";
import { safeQueueOperation } from "../../utils/queueUtils.js";

/**
 * Main service entry point for resume embedding generation.
 *
 * Handles cache validation and queue dispatch. If valid cached embeddings exist
 * and `invalidateCache` is false, returns them immediately without queuing.
 * Otherwise queues a BullMQ job and returns the jobId for socket tracking.
 *
 * This function is called by the resume embedding controller. It does NOT
 * directly call the Python process — that happens inside the queue processor
 * via `createResumeEmbeddingService`.
 *
 * @param {string} resumeId - MongoDB ObjectId string for the resume.
 * @param {boolean} [invalidateCache=false] - Force regeneration even if a valid cache exists.
 * @param {string} userId - Authenticated user's ID. Required when a queue job must be dispatched.
 *
 * @returns {Promise<{ cached: true, data: object } | { cached: false, jobId: string }>}
 *   - `cached: true`  — Valid embeddings found; `data` is the cached embedding document.
 *   - `cached: false` — Job queued; `jobId` can be used to track progress via socket events.
 *
 * @throws {UnauthorizedError} If `userId` is missing and a new job must be queued.
 */
export const getOrGenerateResumeEmbeddingService = async (resumeId, invalidateCache = false, userId) => {
    if (!invalidateCache) {
        const cacheResult = await getResumeEmbeddingService(resumeId);

        if (cacheResult.cached) {
            const validation = validateResumeEmbeddings(cacheResult.data);

            if (validation.valid) {
                logger.info(`Valid cached embeddings for resume: ${resumeId}`, {
                    validSections: validation.validSections,
                    warnings: validation.warnings
                });
                return { cached: true, data: cacheResult.data };
            }

            logger.warn(`Invalid cached embeddings for resume: ${resumeId} — regenerating`, {
                errors: validation.errors
            });
            invalidateCache = true;
        }
    }

    if (!userId) throw new UnauthorizedError();

    logger.info(`Queueing embedding generation for resume: ${resumeId}`, {
        reason: invalidateCache ? "forced_regeneration" : "cache_miss"
    });

    // Safe fallback approach to the embedding generation
    const result = await safeQueueOperation(
        async () => {
            const job = await resumeEmbeddingQueue.add("generate-embeddings", {
                resumeId,
                userId,
                invalidateCache
            }, {
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
                timeout: 120000
            });

            return { jobId: job.id };
        },
        async () => {
            return await createResumeEmbeddingService(resumeId, invalidateCache, null, userId);
        }
    );

    if (result.type === 'queued') {
        return { cached: false, jobId: result.jobId };
    }

    return { cached: false, data: result.data };
};

/**
 * Checks whether a cached embedding document exists and is still fresh.
 *
 * Freshness threshold: 30 days from `generatedAt`.
 * Does not validate embedding content — use `validateResumeEmbeddings` for that.
 *
 * @param {string} resumeId - MongoDB ObjectId string for the resume.
 *
 * @returns {Promise<{ cached: true, data: object } | { cached: false, data: null }>}
 *   - `cached: true`  — Fresh embedding document found; `data` is the document.
 *   - `cached: false` — No document found or document is stale; `data` is null.
 */
export const getResumeEmbeddingService = async (resumeId) => {
    const cachedEmbeddings = await getResumeEmbeddingsRepo(resumeId);

    if (cachedEmbeddings) {
        const daysSinceGeneration =
            (Date.now() - new Date(cachedEmbeddings.generatedAt).getTime()) /
            (1000 * 60 * 60 * 24);

        if (daysSinceGeneration < 30) {
            logger.info(`Cache hit for resume embeddings: ${resumeId}`);
            return { cached: true, data: cachedEmbeddings };
        }
    }

    logger.info(`Cache miss for resume embeddings: ${resumeId}`);
    return { cached: false, data: null };
};

/**
 * Runs the full embedding + scoring pipeline for a resume.
 *
 * Calls Python to generate embedding vectors, persists them to the database,
 * then immediately calls `generateResumeScoreService` in the same execution
 * context — guaranteeing the score never starts before embeddings are saved.
 * 
 * @param {string} resumeId - MongoDB ObjectId string for the resume.
 * @param {boolean} [invalidateCache=false] - Force regeneration even if an embedding exists.
 * @param {import('bullmq').Job|null} [job=null] - BullMQ job for `updateProgress` calls, or null.
 * @param {string|null} [userId=null] - User ID threaded through for socket emissions in score service.
 * @param {Function} [emit=()=>{}]
 *   Socket emit function from the processor.
 *   Signature: `emit(event: string, payload: object) => void`
 *
 * @returns {Promise<{ cached: false, data: object }>}
 *   Always returns `cached: false`; `data` is the saved embedding document.
 *
 * @throws {Error} If Python fails, the DB save fails, or score calculation fails.
 */
export const createResumeEmbeddingService = async (
    resumeId,
    invalidateCache = false,
    job = null,
    userId = null,
    emit = () => {}
) => {
    try {
        await job?.updateProgress(10);

        logger.info(`Generating embeddings for resume: ${resumeId}`, { invalidateCache });

        // Python runs here (~30s). Progress events from Python are streamed in real-time
        // via the emit callback — no hardcoded messages in this layer.
        const pythonResponse = await runPython("generate_resume_embeddings", [resumeId], emit);

        await job?.updateProgress(62);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        const embeddingData = {
            resume: resumeId,
            embeddings: pythonResponse.embeddings || {},
            meanEmbeddings: pythonResponse.meanEmbeddings || {},
            metrics: pythonResponse.metrics || { totalExperienceYears: 0 },
            generatedAt: new Date()
        };

        const existing = await getResumeEmbeddingsRepo(resumeId);
        let savedEmbeddings;

        if (existing) {
            Object.assign(existing, embeddingData);
            savedEmbeddings = await existing.save();
        } else {
            savedEmbeddings = await createResumeEmbeddingRepo(embeddingData);
        }

        await job?.updateProgress(65);

        logger.info(`Embeddings saved — starting score pipeline for resume: ${resumeId}`);

        // Score runs directly (not via queue) to guarantee sequential execution.
        // generateResumeScoreService streams its own progress events via emit.
        await generateResumeScoreService(resumeId, null, emit);

        logger.info(`Embedding + score pipeline complete for resume: ${resumeId}`, {
            embeddingId: savedEmbeddings._id,
            hasSkills: !!savedEmbeddings.meanEmbeddings?.skills,
            totalExperienceYears: savedEmbeddings.metrics?.totalExperienceYears
        });

        return { cached: false, data: savedEmbeddings };

    } catch (error) {
        logger.error(`Error in embedding pipeline for resume ${resumeId}:`, error);
        throw error;
    }
};
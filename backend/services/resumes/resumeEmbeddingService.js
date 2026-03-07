import { resumeEmbeddingQueue } from "../../queues/index.js";
import { getResumeEmbeddingsRepo, createResumeEmbeddingRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { generateResumeScoreService } from "./resumeScoreService.js";
import { validateResumeEmbeddings } from "../../utils/embeddingValidationUtils.ts";
import logger from "../../utils/logger.js";
import { runPython } from "../../utils/pythonRunner.js";
import { UnauthorizedError } from "../../middleware/errorHandler.js";

/**
 * Main service function - handles cache check and queue decision.
 *
 * Validates cached embeddings if present. If invalid or missing,
 * queues a new embedding generation job.
 *
 * @param {string} resumeId - The resume ID to generate embeddings for
 * @param {boolean} invalidateCache - Force regeneration even if cache is valid
 * @param {string} userId - The authenticated user's ID (required for queuing)
 * @returns {Promise<{ cached: boolean, data?: object, jobId?: string }>}
 * @throws {UnauthorizedError} If userId is missing when queuing is needed
 */
export const getOrGenerateResumeEmbeddingService = async (resumeId, invalidateCache = false, userId) => {
    if (!invalidateCache) {
        const cacheResult = await getResumeEmbeddingService(resumeId);

        if (cacheResult.cached) {
            const validation = validateResumeEmbeddings(cacheResult.data);

            if (validation.valid) {
                logger.info(`Valid cached embeddings for ${resumeId}`, {
                    validSections: validation.validSections,
                    warnings: validation.warnings
                });
                return { cached: true, data: cacheResult.data };
            }

            logger.warn(`Invalid cached embeddings for resume: ${resumeId}. Regenerating...`, {
                errors: validation.errors,
                resumeId
            });
            invalidateCache = true;
        }
    }

    if (!userId) throw new UnauthorizedError();

    logger.info(`Queueing embedding generation for resume: ${resumeId}`, {
        reason: invalidateCache ? 'forced_regeneration' : 'cache_miss'
    });

    const job = await resumeEmbeddingQueue.add('generate-embeddings', {
        resumeId,
        userId,
        invalidateCache
    }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 120000 // 2 min — covers both embedding + score Python calls
    });

    return { cached: false, jobId: job.id };
};

/**
 * Checks if cached embeddings exist and are still fresh (< 30 days old).
 * Does not validate embedding content — use validateResumeEmbeddings for that.
 *
 * @param {string} resumeId - Resume ID
 * @returns {Promise<{ cached: boolean, data: object|null }>}
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
 * Generates resume embeddings via Python and immediately calculates the resume
 * score in the same execution context — ensuring score generation never starts
 * before embeddings are fully saved.
 *
 * Pipeline (all sequential, no queuing):
 *   1. Call Python to generate embedding vectors
 *   2. Save embeddings to database
 *   3. Call generateResumeScoreService directly (not via queue)
 *
 * Progress values emitted cover the full 0-100% pipeline:
 *   - 10% → preparing
 *   - 20% → running embedding model (pre-Python)
 *   - 60% → embeddings received from Python
 *   - 70% → embeddings saved, starting score
 *   - 75-95% → score calculation (delegated to generateResumeScoreService)
 *   - 100% → complete (emitted by caller after this resolves)
 *
 * Can be called from:
 *   - Queue processor (generateResumeEmbeddingsProcessor) — primary path
 *   - Direct API call — if needed outside the queue
 *
 * @param {string} resumeId - Resume ID
 * @param {boolean} invalidateCache - Force regeneration even if embeddings exist
 * @param {object|null} job - Optional BullMQ job for updateProgress calls
 * @param {string|null} userId - User ID threaded through for socket emissions in score service
 * @param {Function} emit - Socket emit function from the processor; defaults to no-op
 * @returns {Promise<{ cached: false, data: object }>} The saved embedding document
 * @throws {Error} If Python fails, DB save fails, or score calculation fails
 */
export const createResumeEmbeddingService = async (resumeId, invalidateCache = false, job = null, userId = null, emit = () => {}) => {
    try {
        emit('embedding:progress', { progress: 10, message: 'Preparing embedding model...' });
        await job?.updateProgress(10);

        logger.info(`Generating embeddings for resume: ${resumeId}`, { invalidateCache });

        emit('embedding:progress', { progress: 20, message: 'Running AI embedding model...' });
        await job?.updateProgress(20);

        // Python runs here — the long wait (~30s)
        const pythonResponse = await runPython('generate_resume_embeddings', [resumeId]);

        emit('embedding:progress', { progress: 60, message: 'Processing embedding vectors...' });
        await job?.updateProgress(60);

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

        emit('embedding:progress', { progress: 70, message: 'Embeddings saved, calculating score...' });
        await job?.updateProgress(70);

        logger.info(`Embeddings saved, running score directly for resume: ${resumeId}`);

        // ✅ Score runs directly — not via queue — guaranteeing sequential execution.
        // generateResumeScoreService emits score:progress at 75%, 88%, 95%
        // and the caller emits score:complete after this function resolves.
        await generateResumeScoreService(resumeId, null, emit);

        logger.info(`Embeddings generated successfully for resume: ${resumeId}`, {
            embeddingId: savedEmbeddings._id,
            hasSkills: !!savedEmbeddings.meanEmbeddings.skills,
            totalExperienceYears: savedEmbeddings.metrics.totalExperienceYears
        });

        return { cached: false, data: savedEmbeddings };
    } catch (error) {
        logger.error(`Error generating embeddings for resume ${resumeId}:`, error);
        throw error;
    }
};
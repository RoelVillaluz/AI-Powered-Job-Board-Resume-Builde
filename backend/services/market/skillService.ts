import * as SkillRepo from '../../repositories/market/skillRepositories';
import { Types } from 'mongoose';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddingValidationUtils'
import logger from '../../utils/logger';
import { PythonResponse, runPythonTyped } from '../../types/python.types';
import { QueueJob } from '../../types/queues.types';
import { skillEmbeddingQueue } from '../../queues';
import Skill, { SkillDocument } from '../../models/market/skillModel';
import { CreateSkillPayload, UpdateSkillPayload } from '../../types/skill.types';
import { safeQueueOperation } from '../../utils/queueUtils';

type SkillEmbeddingCacheResult =
    | { cached: true;  data: SkillDocument }
    | { cached: false; data: null }

type SkillEmbeddingOrchestrationResult =
    | { cached: true;  data: SkillDocument; jobId?: never }
    | { cached: false; jobId: string; data?: never }
    | { cached: false; data: SkillDocument; jobId?: never }

/**
 * Orchestrator — decides whether to return a cached embedding or queue generation.
 *
 * Flow:
 * 1. If invalidateCache is false, fetch existing embedding via getSkillEmbeddingService
 *    which checks existence and staleness
 * 2. If cached data exists, validate embedding shape and zero-vector integrity
 *    via isValidEmbedding — a separate concern from staleness
 * 3. If valid → return cached data immediately, no Python call
 * 4. If missing, stale, or invalid shape → attempt to queue background generation
 *    via safeQueueOperation; falls back to inline generation if Redis is unavailable
 *
 * @param skillId - Skill ObjectId
 * @param invalidateCache - Force regeneration even if a valid embedding exists
 * @returns Cached embedding data, jobId of the queued generation job, or inline fallback data
 */
export const getOrGenerateSkillEmbeddingService = async (
    skillId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<SkillEmbeddingOrchestrationResult> => {
    if (!invalidateCache) {
        const cacheResult = await getSkillEmbeddingService(skillId);

        if (cacheResult.cached) {
            // getSkillEmbeddingService passed existence + staleness check.
            // Now do shape validation — separate concern from staleness.
            // Catches zero vectors [0,0,0...] and NaN/Infinity values.
            const valid = isValidEmbedding(cacheResult.data.embedding);

            if (valid) {
                logger.info(`Valid cached embedding for skill: ${skillId}`);
                return { cached: true, data: cacheResult.data };
            }

            logger.warn(`Invalid embedding shape for skill: ${skillId} — regenerating`);
            invalidateCache = true;
        }
    }

    logger.info(`Queueing embedding generation for skill: ${skillId}`, {
        reason: invalidateCache ? 'forced_regeneration' : 'cache_miss'
    });

    const result = await safeQueueOperation(
        async () => {
            const job = await skillEmbeddingQueue.add(
                'generate-embeddings',
                { skillId: skillId.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000,
                    jobId: `skill-embedding-${skillId.toString()}`
                } as any
            );

            return { jobId: job.id!.toString() };
        },
        async () => {
            const res = await upsertSkillEmbeddingService(skillId, true);

            if (!res.data) {
                throw new Error("Embedding generation failed: no data returned");
            }

            return res.data;
        }
    );

    if (result.type === 'queued') {
        return { cached: false, jobId: result.jobId };
    }

    return { cached: false, data: result.data };
}

/**
 * Checks if a non-stale embedding exists for the given skill.
 *
 * Checks:
 * 1. Embedding field exists and is non-empty
 * 2. embeddingGeneratedAt is within maxAgeDays (default 90)
 *
 * Note: Does NOT validate embedding shape — that is the orchestrator's
 * responsibility via isValidEmbedding. Separation keeps each function
 * focused on one concern.
 *
 * @param skillId - Skill ObjectId
 * @returns Discriminated union — cached:true with data, or cached:false with null
 */
export const getSkillEmbeddingService = async (
    skillId: Types.ObjectId
): Promise<SkillEmbeddingCacheResult> => {
    const skillDoc = await SkillRepo.getSkillEmbeddingRepository(skillId);

    if (!skillDoc?.embedding?.length) {
        logger.info(`Cache miss — no embedding found for skill: ${skillId}`);
        return { cached: false, data: null };
    }

    if (isEmbeddingStale(skillDoc.embeddingGeneratedAt, 90)) {
        logger.info(`Cache miss — stale embedding for skill: ${skillId}`);
        return { cached: false, data: null };
    }

    logger.info(`Cache hit for skill embedding: ${skillId}`);
    return { cached: true, data: skillDoc };
}

/**
 * Generates and persists a skill embedding by calling the Python encoder.
 *
 * Called by the skillEmbeddingQueue worker, or inline via safeQueueOperation
 * fallback when Redis is unavailable. The isFallback flag distinguishes these
 * paths for observability.
 *
 * Safe progress helper — job.updateProgress() throws when called outside
 * an active BullMQ worker context (e.g. safeQueueOperation fallback path).
 * The method exists on the Job prototype so typeof checks pass, but the
 * runtime call fails without a live Redis connection. Wrapping in try/catch
 * degrades gracefully in both the queue and inline fallback paths.
 *
 * Flow:
 * 1. Call Python generate_skill_embeddings script with skillId
 * 2. Validate Python response is non-empty before writing
 * 3. Persist embedding + embeddingGeneratedAt via updateSkillEmbeddingRepository
 *
 * @param skillId - Skill ObjectId
 * @param isFallback - True when called inline (Redis unavailable), false when called by queue worker
 * @param job - BullMQ job instance for progress tracking, null if called outside queue
 * @param emit - Progress callback for streaming updates to client
 * @returns { cached: false, data: updated Skill document }
 */
export const upsertSkillEmbeddingService = async (
    skillId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: (progress: number) => void = () => {}
) => {
    const progress = async (pct: number) => {
        try {
            await (job as any)?.updateProgress(pct);
        } catch {
            // Safe to ignore — progress tracking is best-effort
        }
    };

    try {
        await progress(10);

        if (isFallback) {
            logger.warn(`Embedding generated inline (Redis fallback)`);
        }

        logger.info(`Generating embedding for skill: ${skillId}`);

        const pythonResponse = await runPythonTyped(
            'generate_skill_embeddings',
            [skillId.toString()],
            emit
        ) as PythonResponse;

        await progress(80);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        if (!pythonResponse.embedding?.length) {
            throw new Error(`Python returned empty embedding for skill: ${skillId}`);
        }

        const savedEmbedding = await SkillRepo.updateSkillEmbeddingRepository(
            skillId,
            pythonResponse.embedding
        );

        await progress(100);

        logger.info(`Embedding saved for skill: ${skillId}`, {
            embeddingLength: pythonResponse.embedding.length
        });

        return { cached: false, data: savedEmbedding };

    } catch (error) {
        logger.error(`Error in embedding pipeline for skill ${skillId}:`, error);
        throw error;
    }
}

/**
 * Creates a new skill and queues embedding generation.
 *
 * Flow:
 * 1. Persist the skill via the repository
 * 2. Queue embedding generation via safeQueueOperation — does not block the HTTP response.
 *    Falls back to inline generation if Redis is unavailable.
 *
 * @param skillData - Payload for creating a new skill
 * @returns The newly created Skill document
 */
export const createSkillService = async (skillData: CreateSkillPayload) => {
    const newSkill = await SkillRepo.createSkillRepository(skillData);

    await safeQueueOperation(
        async () => {
            const job = await skillEmbeddingQueue.add(
                'generate-embeddings',
                { skillId: newSkill._id.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000,
                    jobId: `skill-embedding-${newSkill._id.toString()}`
                } as any
            );

            return { jobId: job.id!.toString() };
        },
        async () => {
            const res = await upsertSkillEmbeddingService(newSkill._id, true);

            if (!res.data) {
                throw new Error("Embedding generation failed after create");
            }

            return res.data;
        }
    );

    logger.info(`Skill created and embedding queued: ${newSkill._id}`);
    return newSkill;
}

/**
 * Updates an existing skill and conditionally re-queues embedding generation.
 *
 * Flow:
 * 1. Update skill fields via the repository
 * 2. If name changed (affects semantic embedding):
 *    - Invalidate existing embedding
 *    - Queue a new embedding generation job via safeQueueOperation,
 *      falling back to inline generation if Redis is unavailable
 * 3. Updating other fields does not trigger re-generation
 *
 * @param skillId - ObjectId of the skill to update
 * @param updateData - Fields to update
 * @returns The updated Skill document
 */
export const updateSkillService = async (skillId: Types.ObjectId, updateData: UpdateSkillPayload) => {
    const updatedSkill = await SkillRepo.updateSkillRepository(skillId, updateData);

    if (updateData.name) {
        await Skill.findByIdAndUpdate(skillId, {
            $set: { embedding: null, embeddingGeneratedAt: null }
        });

        await safeQueueOperation(
            async () => {
                const job = await skillEmbeddingQueue.add(
                    'generate-embeddings',
                    { skillId: skillId.toString() },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        timeout: 120000,
                        jobId: `skill-embedding-${skillId.toString()}`
                    } as any
                );

                return { jobId: job.id!.toString() };
            },
            async () => {
                const res = await upsertSkillEmbeddingService(skillId, true);

                if (!res.data) {
                    throw new Error("Embedding generation failed after update");
                }

                return res.data;
            }
        );

        logger.info(`Skill updated — embedding invalidated and re-queued: ${skillId}`);
    }

    return updatedSkill;
}
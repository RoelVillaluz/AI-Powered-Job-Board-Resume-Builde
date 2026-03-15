import * as SkillRepo from '../../repositories/market/skillRepositories';
import { Types } from 'mongoose';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddingValidationUtils'
import logger from '../../utils/logger';
import { PythonResponse, runPythonTyped } from '../../types/python.types';
import { QueueJob } from '../../types/queues.types';
import { skillEmbeddingQueue } from '../../queues';
import Skill, { SkillDocument } from '../../models/market/skillModel';
import { runPython } from '../../utils/pythonRunner';
import { CreateSkillPayload, UpdateSkillPayload } from '../../types/skill.types';

type SkillEmbeddingCacheResult =
    | { cached: true;  data: SkillDocument }
    | { cached: false; data: null }

type SkillEmbeddingOrchestrationResult =
    | { cached: true;  data: SkillDocument; jobId?: never }
    | { cached: false; data?: never; jobId: string | undefined }

/**
 * Orchestrator — decides whether to return a cached embedding or queue generation.
 *
 * Flow:
 * 1. If invalidateCache is false, fetch existing embedding via getSkillEmbeddingService
 *    which checks existence and staleness
 * 2. If cached data exists, validate embedding shape and zero-vector integrity
 *    via isValidEmbedding — a separate concern from staleness
 * 3. If valid → return cached data immediately, no Python call
 * 4. If missing, stale, or invalid shape → queue background generation
 *
 * Does NOT generate embeddings directly — that is handled by the queue worker
 * which calls createSkillEmbeddingService.
 *
 * @param skillId - Skill ObjectId
 * @param invalidateCache - Force regeneration even if valid embedding exists
 * @returns Cached embedding data or jobId of the queued generation job
 */
export const getOrGenerateSkillEmbeddingService = async (
    skillId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<SkillEmbeddingOrchestrationResult> => {

    if (!invalidateCache) {
        const cacheResult = await getSkillEmbeddingService(skillId);

        if (cacheResult.cached) {
            // getSkillEmbeddingService passed existence + staleness check
            // Now do shape validation — separate concern from staleness
            // Catches zero vectors [0,0,0...] and NaN/Infinity values
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

    const job = await skillEmbeddingQueue.add(
        'generate-embeddings',
        {
            skillId: skillId.toString(),
        },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 120000   // 2 min — covers full Python pipeline
        } as any
    );

    return { cached: false, jobId: job.id };
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
 * Called exclusively by the skillEmbeddingQueue worker — never called
 * directly from a controller or HTTP request. The orchestrator
 * (getOrGenerateSkillEmbeddingService) is the only entry point that
 * should eventually lead here via the queue.
 *
 * Flow:
 * 1. Call Python generate_skill_embeddings script with skillId
 * 2. Validate Python response is non-empty before writing
 * 3. Persist embedding + embeddingGeneratedAt via updateSkillEmbeddingRepository
 *
 * @param skillId - Skill ObjectId
 * @param job - BullMQ job instance for progress tracking, null if called outside queue
 * @param emit - Progress callback for streaming updates to client
 * @returns { cached: false, data: updated Skill document }
 */
export const upsertSkillEmbeddingService = async (
    skillId: Types.ObjectId,
    job: QueueJob | null = null,
    emit: (progress: number) => void = () => {}
) => {
    try {
        await job?.updateProgress(10);

        logger.info(`Generating embedding for skill: ${skillId}`);

        const pythonResponse = await runPythonTyped(
            'generate_skill_embeddings',
            [skillId.toString()],
            emit
        ) as PythonResponse;

        await job?.updateProgress(80);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        if (!pythonResponse.embedding?.length) {
            throw new Error(`Python returned empty embedding for skill: ${skillId}`);
        }

        const savedEmbedding = await SkillRepo.updateSkillEmbeddingRepository(
            skillId,
            pythonResponse.embedding
        );

        await job?.updateProgress(100);

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
 * Creates a new skill in the database and queues embedding generation.
 *
 * Flow:
 * 1. Persist the skill via the repository
 * 2. Queue the skillEmbeddingQueue job for Python encoding
 *    — does not block the HTTP response
 *
 * @param skillData - Payload for creating a new skill
 * @returns The newly created Skill document
 */
export const createSkillService = async (skillData: CreateSkillPayload) => {
    const newSkill = await SkillRepo.createSkillRepository(skillData);

    // Queue — don't block response waiting for Python
    await skillEmbeddingQueue.add(
        'generate-embeddings',
        { skillId: newSkill._id.toString() },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 120000
        } as any
    );

    return newSkill;
}

/**
 * Updates an existing skill in the database and conditionally re-queues embedding generation.
 *
 * Flow:
 * 1. Update skill fields via the repository
 * 2. If the skill `name` changed (affects semantic embedding):
 *    - Remove existing embedding and embeddingGeneratedAt
 *    - Queue a new embedding generation job
 * 3. Updating other fields does not trigger re-generation
 *
 * @param skillId - ObjectId of the skill to update
 * @param updateData - Fields to update
 * @returns The updated Skill document
 */
export const updateSkillService = async (skillId: Types.ObjectId, updateData: UpdateSkillPayload) => {
    const updatedSkill = await SkillRepo.updateSkillRepository(skillId, updateData);

    // Only re-queue if name changed — name affects semantic embedding
    if (updateData.name) {
        await Skill.findByIdAndUpdate(skillId, { $unset: { embedding: "", embeddingGeneratedAt: "" } });

        await skillEmbeddingQueue.add(
            'generate-embeddings',
            { skillId: skillId.toString() },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                timeout: 120000
            } as any
        );
    }

    return updatedSkill;
}
import * as SkillRepo from '../../repositories/market/skillRepositories.js';
import { Types } from 'mongoose';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddings/embeddingValidationUtils.js';
import logger from '../../utils/logger.js';
import { PythonEmit } from '../../types/python.types.js';
import { QueueJob } from '../../types/queues.types.js';
import Skill, { SkillDocument } from '../../models/market/skillModel.js';
import { CreateSkillPayload, UpdateSkillPayload } from '../../types/skill.types.js';
import { embeddingRegistry } from '../../infrastructure/jobs/domains/embedding/embeddingRegistry.js';
import { orchestrateEmbeddings } from '../../infrastructure/jobs/domains/embedding/core/orchestrateEmbedding.js';
import { executeEmbeddingPipeline } from '../../infrastructure/jobs/domains/embedding/core/executeEmbeddingPipeline.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type SkillEmbeddingCacheResult =
    | { cached: true;  data: SkillDocument }
    | { cached: false; data: null }

type SkillEmbeddingOrchestrationResult =
    | { cached: true;  data: SkillDocument; jobId?: never }
    | { cached: false; jobId: string;       data?: never }
    | { cached: false; data: SkillDocument; jobId?: never }

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Decides whether to return a cached embedding or queue generation.
 * Delegates cache-check, shape-validation, queue, and fallback logic
 * to orchestrateEmbeddings — this function owns only the skill-specific
 * cache fetch and shape validator.
 */
export const getOrGenerateSkillEmbeddingService = async (
    skillId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<SkillEmbeddingOrchestrationResult> => {
    return orchestrateEmbeddings<SkillDocument>({
        invalidateCache,
        logContext: `skill:${skillId}`,

        getCached: async () => {
            const result = await getSkillEmbeddingService(skillId);
            return result.cached
                ? { cached: true,  data: result.data }
                : { cached: false };
        },

        validateShape: (data) => isValidEmbedding(data.embedding),

        queueGeneration: () =>
            embeddingRegistry.skill.queue({
                id:      skillId.toString(),
                skillId: skillId.toString(),
            }),

        fallbackGeneration: async () => {
            const res = await upsertSkillEmbeddingService(skillId, true);
            if (!res.data) throw new Error('Skill embedding fallback returned no data');
            return res.data;
        },
    });
};

// ─── Cache check ──────────────────────────────────────────────────────────────

/**
 * Checks existence and staleness only.
 * Shape validation is the orchestrator's responsibility.
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
};

// ─── Upsert (used as fallback + worker entry point) ───────────────────────────

/**
 * Generates and persists a skill embedding via Python.
 * Called directly by the skillEmbeddingQueue worker,
 * or inline via the orchestrator fallback when Redis is unavailable.
 */
export const upsertSkillEmbeddingService = async (
    skillId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {},
) => {
    if (isFallback) logger.warn(`Skill embedding generated inline (Redis fallback)`);
    return executeEmbeddingPipeline({ entityKey: 'skill', id: skillId, job, emit });
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Persists a new skill then queues embedding generation.
 * Falls back to inline generation if Redis is unavailable.
 */
export const createSkillService = async (skillData: CreateSkillPayload) => {
    const newSkill = await SkillRepo.createSkillRepository(skillData);

    await embeddingRegistry.skill.queue({
        id:      newSkill._id.toString(),
        skillId: newSkill._id.toString(),
    }).catch(async () => {
        await upsertSkillEmbeddingService(newSkill._id, true);
    });

    logger.info(`Skill created and embedding queued: ${newSkill._id}`);
    return newSkill;
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Updates a skill and re-queues embedding only when the name changed,
 * since name is the only field that affects the semantic embedding.
 */
export const updateSkillService = async (
    skillId: Types.ObjectId,
    updateData: UpdateSkillPayload,
) => {
    const updatedSkill = await SkillRepo.updateSkillRepository(skillId, updateData);

    if (updateData.name) {
        await Skill.findByIdAndUpdate(skillId, {
            $set: { embedding: null, embeddingGeneratedAt: null },
        });

        await embeddingRegistry.skill.queue({
            id:      skillId.toString(),
            skillId: skillId.toString(),
        }).catch(async () => {
            await upsertSkillEmbeddingService(skillId, true);
        });

        logger.info(`Skill updated — embedding invalidated and re-queued: ${skillId}`);
    }

    return updatedSkill;
};
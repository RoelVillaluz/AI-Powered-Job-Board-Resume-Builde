import * as JobTitleRepo from '../../repositories/market/jobTitleRepositories.js';
import { Types } from 'mongoose';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddings/embeddingValidationUtils.js';
import logger from '../../utils/logger.js';
import { QueueJob } from '../../types/queues.types.js';
import JobTitle from '../../models/market/jobTitleModel.js';
import { CreateJobTitlePayload, UpdateJobTitlePayload, JobTitleEmbeddingData } from '../../types/jobTitle.types.js';
import { ImportanceLevel } from '../../../../shared/constants/jobsAndIndustries/constants.js';
import { embeddingRegistry } from '../../infrastructure/domains/embedding/registry/embeddingRegistry.js';
import { orchestrateEmbeddings } from '../../infrastructure/domains/embedding/core/orchestrateEmbedding.js';
import { executeEmbeddingPipeline } from '../../infrastructure/domains/embedding/core/executeEmbeddingPipeline.js';
import { PythonEmit } from '../../types/python.types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type JobTitleEmbeddingCacheResult =
    | { cached: true;  data: JobTitleEmbeddingData }
    | { cached: false; data: null }

type JobTitleEmbeddingOrchestrationResult =
    | { cached: true;  data: JobTitleEmbeddingData; jobId?: never }
    | { cached: false; jobId: string;               data?: never }
    | { cached: false; data: JobTitleEmbeddingData; jobId?: never }

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export const getOrGenerateJobTitleEmbeddingService = async (
    titleId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<JobTitleEmbeddingOrchestrationResult> => {
    return orchestrateEmbeddings<JobTitleEmbeddingData>({
        invalidateCache,
        logContext: `jobTitle:${titleId}`,

        getCached: async () => {
            const result = await getJobTitleEmbeddingService(titleId);
            return result.cached
                ? { cached: true,  data: result.data }
                : { cached: false };
        },

        validateShape: (data) => isValidEmbedding(data.embedding),

        queueGeneration: () =>
            embeddingRegistry.jobTitle.queue({
                id:      titleId.toString(),
                titleId: titleId.toString(),
            }),

        fallbackGeneration: async () => {
            const res = await upsertJobTitleEmbeddingService(titleId, true);
            if (!res.data) throw new Error('JobTitle embedding fallback returned no data');
            return res.data;
        },
    });
};

// ─── Cache check ──────────────────────────────────────────────────────────────

/**
 * Checks existence and staleness only.
 * Encodes normalizedTitle — aliases like "Sr. Engineer" and "Senior Engineer"
 * map to the same normalizedTitle for semantic consistency.
 */
export const getJobTitleEmbeddingService = async (
    titleId: Types.ObjectId
): Promise<JobTitleEmbeddingCacheResult> => {
    const titleDoc = await JobTitleRepo.getJobTitleEmbeddingsByIdRepository(titleId);

    if (!titleDoc?.embedding?.length) {
        logger.info(`Cache miss — no embedding found for job title: ${titleId}`);
        return { cached: false, data: null };
    }

    if (isEmbeddingStale(titleDoc.embeddingGeneratedAt, 90)) {
        logger.info(`Cache miss — stale embedding for job title: ${titleId}`);
        return { cached: false, data: null };
    }

    logger.info(`Cache hit for job title embedding: ${titleId}`);
    return { cached: true, data: titleDoc };
};

// ─── Upsert ───────────────────────────────────────────────────────────────────
export const upsertJobTitleEmbeddingService = async (
    titleId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {},
) => {
    if (isFallback) logger.warn(`JobTitle embedding generated inline (Redis fallback)`);
    return executeEmbeddingPipeline({ entityKey: 'jobTitle', id: titleId, job, emit });
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createJobTitleService = async (data: CreateJobTitlePayload) => {
    const newTitle = await JobTitleRepo.createJobTitleRepository(data);

    await embeddingRegistry.jobTitle.queue({
        id:      newTitle._id.toString(),
        titleId: newTitle._id.toString(),
    }).catch(async () => {
        await upsertJobTitleEmbeddingService(newTitle._id, true);
    });

    logger.info(`Job title created and embedding queued: ${newTitle._id}`);
    return newTitle;
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Re-queues only when title or normalizedTitle changed —
 * these are the fields that get encoded, so other changes
 * don't affect the semantic embedding.
 */
export const updateJobTitleService = async (
    id: Types.ObjectId,
    updateData: UpdateJobTitlePayload,
) => {
    const updatedTitle = await JobTitleRepo.updateJobTitleRepository(id, updateData);

    if (updateData.title || updateData.normalizedTitle) {
        await JobTitle.findByIdAndUpdate(id, {
            $set: { embedding: null, embeddingGeneratedAt: null },
        });

        await embeddingRegistry.jobTitle.queue({
            id:      id.toString(),
            titleId: id.toString(),
        }).catch(async () => {
            await upsertJobTitleEmbeddingService(id, true);
        });

        logger.info(`Job title updated — embedding invalidated and re-queued: ${id}`);
    }

    return updatedTitle;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getJobTitleTopSkillsService = async (
    id: Types.ObjectId,
    importance: string | null,
) => {
    if (importance) {
        const lower = importance.toLowerCase() as ImportanceLevel;
        if (!Object.values(ImportanceLevel).includes(lower)) {
            throw new Error(`Invalid importance level: ${importance}`);
        }
        return JobTitleRepo.getJobTitleTopSkillsByImportance(id, lower);
    }
    return JobTitleRepo.getJobTitleTopSkillsByImportance(id, null);
};
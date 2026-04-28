import { IndustryEmbeddingData, CreateIndustryPayload, UpdateIndustryPayload } from '../../types/industry.types.js';
import { Types } from 'mongoose';
import { QueueJob } from '../../types/queues.types.js';
import logger from '../../utils/logger.js';
import { PythonEmit, PythonResponse, runPythonTyped } from '../../types/python.types.js';
import * as IndustryRepo from '../../repositories/market/industryRepositories.js';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddings/embeddingValidationUtils.js';
import Industry from '../../models/market/industryModel.js';
import { embeddingRegistry } from '../../infrastructure/jobs/domains/embedding/embeddingRegistry.js';
import { orchestrateEmbeddings } from '../../infrastructure/jobs/domains/embedding/core/orchestrateEmbedding.js';
import { executeEmbeddingPipeline } from '../../infrastructure/jobs/domains/embedding/core/executeEmbeddingPipeline.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type IndustryEmbeddingCacheResult =
    | { cached: true;  data: IndustryEmbeddingData }
    | { cached: false; data: null }

type IndustryEmbeddingOrchestrationResult =
    | { cached: true;  data: IndustryEmbeddingData; jobId?: never }
    | { cached: false; jobId: string;               data?: never }
    | { cached: false; data: IndustryEmbeddingData; jobId?: never }

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export const getOrGenerateIndustryEmbeddingService = async (
    industryId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<IndustryEmbeddingOrchestrationResult> => {
    return orchestrateEmbeddings<IndustryEmbeddingData>({
        invalidateCache,
        logContext: `industry:${industryId}`,

        getCached: async () => {
            const result = await getIndustryEmbeddingService(industryId);
            return result.cached
                ? { cached: true,  data: result.data }
                : { cached: false };
        },

        validateShape: (data) => isValidEmbedding(data.embedding),

        queueGeneration: () =>
            embeddingRegistry.industry.queue({
                id:         industryId.toString(),
                industryId: industryId.toString(),
            }),

        fallbackGeneration: async () => {
            const res = await upsertIndustryEmbeddingService(industryId, true);
            if (!res.data) throw new Error('Industry embedding fallback returned no data');
            return res.data;
        },
    });
};

// ─── Cache check ──────────────────────────────────────────────────────────────

export const getIndustryEmbeddingService = async (
    industryId: Types.ObjectId
): Promise<IndustryEmbeddingCacheResult> => {
    const industryEmbedding = await IndustryRepo.getIndustryEmbeddingByIdRepository(industryId);

    if (!industryEmbedding?.embedding?.length) {
        logger.info(`Cache miss — no embedding found for industry: ${industryId}`);
        return { cached: false, data: null };
    }

    if (isEmbeddingStale(industryEmbedding.embeddingGeneratedAt)) {
        logger.info(`Cache miss — stale embedding for industry: ${industryId}`);
        return { cached: false, data: null };
    }

    logger.info(`Cache hit for industry embedding: ${industryId}`);
    return { cached: true, data: industryEmbedding };
};

// ─── Upsert ───────────────────────────────────────────────────────────────────
export const upsertIndustryEmbeddingService = async (
    industryId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {},
) => {
    if (isFallback) logger.warn(`Industry embedding generated inline (Redis fallback)`);
    return executeEmbeddingPipeline({ entityKey: 'industry', id: industryId, job, emit });
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createIndustryService = async (data: CreateIndustryPayload) => {
    const newIndustry = await IndustryRepo.createIndustryRepository(data);

    await embeddingRegistry.industry.queue({
        id:         newIndustry._id.toString(),
        industryId: newIndustry._id.toString(),
    }).catch(async () => {
        await upsertIndustryEmbeddingService(newIndustry._id, true);
    });

    logger.info(`Industry created and embedding queued: ${newIndustry._id}`);
    return newIndustry;
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Re-queues only when name changed — other fields (description, aliases)
 * don't affect the semantic embedding.
 */
export const updateIndustryService = async (
    industryId: Types.ObjectId,
    updateData: UpdateIndustryPayload,
) => {
    const updatedIndustry = await IndustryRepo.updateIndustryRepository(industryId, updateData);

    if (updateData.name) {
        await Industry.findByIdAndUpdate(industryId, {
            $set: { embedding: null, embeddingGeneratedAt: null },
        });

        await embeddingRegistry.industry.queue({
            id:         industryId.toString(),
            industryId: industryId.toString(),
        }).catch(async () => {
            await upsertIndustryEmbeddingService(industryId, true);
        });

        logger.info(`Industry updated — embedding invalidated and re-queued: ${industryId}`);
    }

    return updatedIndustry;
};
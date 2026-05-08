import { Types }  from 'mongoose';
import logger     from '../../../utils/logger.js';
import { isEmbeddingStale } from '../../../utils/embeddings/embeddingValidationUtils.js';
import { executeComputePipelineV2 } from '../core/executeComputePipelineV2.js';
import { QueueJob } from '../../../types/queues.types.js';
import { EmitFn, ComputeConfigV2 }   from '../core/computeRegistryTypesV2.js';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface EmbeddingServiceConfig<
    T,
    TCreate,
    TUpdate extends Record<string, any>,
> {
    // ── Identity ──────────────────────────────────────────────────────────────
    entityKey: string;
    label:     string;

    // ── Repo ──────────────────────────────────────────────────────────────────
    getEmbedding: (id: Types.ObjectId) => Promise<T | null>;
    create:       (data: TCreate) => Promise<any>;
    update:       (id: Types.ObjectId, data: TUpdate) => Promise<any>;

    // ── Queue payload builder ─────────────────────────────────────────────────
    // queue fn is resolved lazily from the registry — no direct import needed
    buildQueuePayload: (id: Types.ObjectId) => { id: string; [key: string]: string };

    // ── Model (for embedding invalidation on update) ──────────────────────────
    model: {
        findByIdAndUpdate: (id: any, update: any) => Promise<any>;
    };

    // ── Embedding config ──────────────────────────────────────────────────────
    // Fields that trigger re-embedding when changed
    embeddingFields: string[];
    ttlDays?:        number;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createEmbeddingServiceFactory = <
    T extends { embedding?: any; embeddingGeneratedAt?: any },
    TCreate,
    TUpdate extends Record<string, any>,
>(
    config: EmbeddingServiceConfig<T, TCreate, TUpdate>,
) => {
    const {
        entityKey,
        label,
        getEmbedding,
        create,
        update,
        buildQueuePayload,
        model,
        embeddingFields,
        ttlDays = 90,
    } = config;

    // ── Lazy registry resolver ────────────────────────────────────────────────
    // Avoids static circular imports: services → factory → registry → services
    const resolveRegistryConfig = async (): Promise<ComputeConfigV2<any, any>> => {
        const [{ embeddingRegistryV2 }, { scoringRegistryV2 }] = await Promise.all([
            import('../domains/embedding/embeddingRegistryV2.js'),
            import('../domains/scoring/scoringRegistryV2.js'),
        ]);

        const resolved = embeddingRegistryV2[entityKey] ?? scoringRegistryV2[entityKey];

        if (!resolved) {
            throw new Error(`[${label}] No registry config found for entityKey: ${entityKey}`);
        }

        return resolved;
    };

    // ── GET: cache check + staleness ──────────────────────────────────────────

    const getEmbeddingService = async (
        id: Types.ObjectId,
    ): Promise<{ cached: true; data: T } | { cached: false; data: null }> => {
        const doc = await getEmbedding(id);

        if (!doc?.embedding?.length) {
            logger.info(`[${label}] Cache miss — no embedding: ${id}`);
            return { cached: false, data: null };
        }

        if (isEmbeddingStale(doc.embeddingGeneratedAt, ttlDays)) {
            logger.info(`[${label}] Cache miss — stale: ${id}`);
            return { cached: false, data: null };
        }

        logger.info(`[${label}] Cache hit: ${id}`);
        return { cached: true, data: doc };
    };

    // ── POST: enqueue with inline fallback ────────────────────────────────────

    const enqueueEmbeddingService = async (
        id: Types.ObjectId,
    ): Promise<{ jobId: string }> => {
        const registryConfig = await resolveRegistryConfig();

        return registryConfig.queue(buildQueuePayload(id)).catch(async () => {
            logger.warn(`[${label}] Queue unavailable — running inline: ${id}`);
            await upsertEmbeddingService(id);
            return { jobId: 'inline' };
        });
    };

    // ── Worker entry point ────────────────────────────────────────────────────

    const upsertEmbeddingService = async (
        id: Types.ObjectId,
        job: QueueJob | null = null,
        emit?: EmitFn,
    ) => {
        const registryConfig = await resolveRegistryConfig();

        return executeComputePipelineV2({
            config: registryConfig,
            id,
            job,
            emit,
        });
    };

    // ── Create: persist then enqueue ──────────────────────────────────────────

    const createService = async (data: TCreate) => {
        const created = await create(data);
        await enqueueEmbeddingService(created._id);
        logger.info(`[${label}] Created and embedding queued: ${created._id}`);
        return created;
    };

    // ── Update: persist then invalidate + re-enqueue if semantic fields changed

    const updateService = async (
        id: Types.ObjectId,
        updateData: TUpdate,
    ) => {
        const updated = await update(id, updateData);

        const semanticFieldChanged = embeddingFields.some(field => field in updateData);

        if (semanticFieldChanged) {
            await model.findByIdAndUpdate(id, {
                $set: { embedding: null, embeddingGeneratedAt: null },
            });

            await enqueueEmbeddingService(id);
            logger.info(`[${label}] Embedding invalidated and re-queued: ${id}`);
        }

        return updated;
    };

    return {
        getEmbeddingService,
        enqueueEmbeddingService,
        upsertEmbeddingService,
        createService,
        updateService,
    };
};
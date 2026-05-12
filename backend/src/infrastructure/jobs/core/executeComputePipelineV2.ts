import { Types } from "mongoose";
import logger from "../../../utils/logger.js";
import { aiClient } from "../../clients/aiClientHandler.js";
import { QueueJob } from "../../../types/queues.types.js";
import { ComputeConfigV2, EmitFn } from "./computeRegistryTypesV2.js";
import { isValidEmbedding, isEmbeddingStale } from "../../../utils/embeddings/embeddingValidationUtils.js";
import { EmbeddingVector } from "../../../types/embeddings.types.js";

interface PipelineOptions {
    config:      ComputeConfigV2<any, any>;  // ← caller passes config, not entityKey
    id:          Types.ObjectId | string;
    job?:        QueueJob | null;
    emit?:       EmitFn;
    emitSocket?: (event: string, data: any) => void;
}

export const executeComputePipelineV2 = async ({
    config,
    id,
    job        = null,
    emit       = () => {},
    emitSocket = () => {},
}: PipelineOptions) => {
    const entityId      = new Types.ObjectId(id);
    const logCtx        = `${config.key}:${entityId}`;
    const progressEvent = config.progressEvent ?? 'embedding';

    const progress = async (pct: number, message?: string) => {
        try { await (job as any)?.updateProgress(pct); } catch { /* best-effort */ }
        emit(`${progressEvent}:progress`, { progress: pct, message });
    };

    try {
        logger.info(`[PIPELINE V2 START] ${logCtx}`);
        await progress(10, 'Fetching data');

        const raw = await config.fetcher(entityId);
        if (!raw) throw new Error(`${config.key} not found: ${entityId}`);

        // ── Embedding freshness check ─────────────────────────────────────────
        if (!config.skipEmbeddingCheck) {
            const hasEmbedding = Array.isArray(raw.embedding) && raw.embedding.length > 0;
            const isValid      = hasEmbedding && isValidEmbedding(raw.embedding as EmbeddingVector);
            const isFresh      = hasEmbedding && !isEmbeddingStale(raw.embeddingGeneratedAt as Date, 90);

            if (isValid && isFresh) {
                logger.info(`[PIPELINE V2 SKIP] Valid fresh embedding: ${logCtx}`);
                await progress(100, 'Already valid');
                return { cached: true as const, data: raw };
            }

            if (hasEmbedding && (!isValid || !isFresh)) {
                logger.warn(`[PIPELINE V2] Stale or invalid — regenerating: ${logCtx}`);
            }
        }

        // ── AI call ───────────────────────────────────────────────────────────
        await progress(30, 'Calling AI service');
        const aiOutput = await aiClient(config.aiEndpoint, raw);
        await progress(70, 'Building payload');

        // ── Payload mapping ───────────────────────────────────────────────────
        const mapped = config.buildPayload
            ? await config.buildPayload(aiOutput, entityId)
            : await config.mapper!(aiOutput);

        const document = {
            [config.entity]: entityId,
            ...mapped,
            ...(config.skipEmbeddingCheck ? {} : { generatedAt: new Date() }),
        };

        // ── Persistence ───────────────────────────────────────────────────────
        await progress(85, 'Saving');
        const saved = await config.persist(entityId, document);

        // ── afterSave hook ────────────────────────────────────────────────────
        const userId = (job as any)?.data?.userId ?? null;
        if (config.afterSave) {
            await config.afterSave(saved, emitSocket, { userId });
        }

        await progress(100, 'Complete');
        logger.info(`[PIPELINE V2 SUCCESS] ${logCtx}`);

        return { cached: false as const, data: saved };

    } catch (error) {
        logger.error(`[PIPELINE V2 ERROR] ${logCtx}`, error);
        emit(`${progressEvent}:error`, {
            progress: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
import { Types } from "mongoose";
import logger from "../../../utils/logger.js";
import { aiClient } from "../../clients/aiClientHandler.js";
import { QueueJob } from "../../../types/queues.types.js";
import { ComputeConfigV2, EmitFn } from "./computeRegistryTypesV2.js";
import {
    isValidEmbedding,
    isEmbeddingStale,
} from "../../../utils/embeddings/embeddingValidationUtils.js";
import { EmbeddingVector } from "src/types/embeddings.types.js";
import { getComputeConfigV2 } from "./computeRegistryV2.js";

interface PipelineOptions {
    entityKey: string;
    id:        Types.ObjectId | string;
    job?:      QueueJob | null;
    emit?:     EmitFn;
    emitSocket?: (event: string, data: any) => void;
}

export const executeComputePipelineV2 = async ({
    entityKey,
    id,
    job        = null,
    emit       = () => {},
    emitSocket = () => {},
}: PipelineOptions) => {
    // Lazy import — avoids circular dependency at module init
    const config = await getComputeConfigV2(entityKey);

    if (!config) throw new Error(`No v2 config found for: ${entityKey}`);

    const entityId = new Types.ObjectId(id);
    const logCtx   = `${entityKey}:${entityId}`;

    if (!config) throw new Error(`No v2 config found for: ${entityKey}`);

    const progress = async (pct: number, message?: string) => {
        try { await (job as any)?.updateProgress(pct); } catch { /* best-effort */ }
        emit('embedding:progress', { progress: pct, message });
    };

    try {
        logger.info(`[PIPELINE V2 START] ${logCtx}`);
        await progress(10, 'Fetching data');

        // ── 1. Fetch ──────────────────────────────────────────────────────────
        const raw = await config.fetcher(entityId);
        if (!raw) throw new Error(`${entityKey} not found: ${entityId}`);

        // ── 2. Embedding validity check ───────────────────────────────────────────────
        // Skipped when config.skipEmbeddingCheck is true (scoring, non-embedding entities)
        // Skipped when raw has no embedding field (resume fetcher)
        if (!config.skipEmbeddingCheck) {
            const hasEmbedding = Array.isArray(raw.embedding) && raw.embedding.length > 0;
            const isValid      = hasEmbedding && isValidEmbedding(raw.embedding as EmbeddingVector);
            const isFresh      = hasEmbedding && !isEmbeddingStale(raw.embeddingGeneratedAt as Date, 90);

            if (isValid && isFresh) {
                logger.info(`[PIPELINE V2 SKIP] Valid fresh embedding exists: ${logCtx}`);
                await progress(100, 'Embedding already valid');
                return { cached: true as const, data: raw };
            }

            if (hasEmbedding && (!isValid || !isFresh)) {
                logger.warn(`[PIPELINE V2] Stale or invalid — regenerating: ${logCtx}`);
            }
        }

        // ── 3. Call AI service ────────────────────────────────────────────────
        await progress(30, 'Calling AI service');
        const aiOutput = await aiClient(config.aiEndpoint, raw);
        await progress(70, 'Building payload');

        // ── 4. Map AI response → DB payload ───────────────────────────────────────────
        // buildPayload takes precedence over mapper (used by scoring)
        // mapper is used by embedding entities
        const mapped = config.buildPayload
            ? config.buildPayload(aiOutput, entityId)
            : config.mapper!(aiOutput);

        // ── 5. Build full document ────────────────────────────────────────────
        const embeddingDocument = {
            [config.entity]: entityId,
            ...mapped,
            // only add generatedAt for embedding entities
            // scoring entities set calculatedAt in buildPayload
            ...(config.skipEmbeddingCheck ? {} : { generatedAt: new Date() }),
        };
        
        await progress(85, 'Saving embeddings');

        // ── 6. Persist ────────────────────────────────────────────────────────
        const saved = await config.persist(entityId, embeddingDocument);

        // ── 7. Post-save hooks ────────────────────────────────────────────────
        const userId = (job as any)?.data?.userId ?? null;
        if (config.afterSave) {
            await config.afterSave(saved, emitSocket, { userId });
        }

        await progress(100, 'Complete');
        logger.info(`[PIPELINE V2 SUCCESS] ${logCtx}`);

        return { cached: false as const, data: saved };

    } catch (error) {
        logger.error(`[PIPELINE V2 ERROR] ${logCtx}`, error);
        emit('embedding:error', {
            progress: 0,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
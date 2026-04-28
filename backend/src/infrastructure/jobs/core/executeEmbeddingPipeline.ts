import { Types } from 'mongoose';
import logger from '../../../../../utils/logger.js';
import { embeddingRegistry } from '../embeddingRegistry.js';
import { EmbeddingEntityKey } from '../embeddingRegistry.types.js';
import { PythonResponse, runPythonTyped } from '../../../../../types/python.types.js';
import { QueueJob } from '../../../../../types/queues.types.js';


interface PipelineOptions<TKey extends EmbeddingEntityKey> {
    entityKey:   TKey;
    id:          Types.ObjectId | string;
    job?:        QueueJob | null;
    // Matches runPython's actual emit shape
    emit?:       (event: string, data: { progress: number; message?: string }) => void;
    emitSocket?: (event: string, data: any) => void;
    pythonArgs?: (string | number)[];
}

/**
 * Generic embedding pipeline executor.
 *
 * Handles the full lifecycle for any registered entity:
 *   1. Python script execution
 *   2. Response validation
 *   3. Payload transformation via config.buildPayload
 *   4. Persistence — update-only for market entities (embedding is a field),
 *      upsert for entities with a separate embedding document (resume)
 *   5. Post-save hooks (e.g. trigger scoring)
 *
 * Persistence strategy is determined by whether config.repo.create exists:
 *   - No create fn  → always call update (market entities: field already on document)
 *   - Has create fn → getExisting first, then create or update accordingly
 *
 * Progress tracking degrades gracefully — safe to call from both
 * queue worker context and inline fallback context.
 */
export const executeEmbeddingPipeline = async <TKey extends EmbeddingEntityKey>({
    entityKey,
    id,
    job        = null,
    emit       = () => {},
    emitSocket = () => {},
    pythonArgs,
}: PipelineOptions<TKey>) => {
    const config   = embeddingRegistry[entityKey];
    const entityId = new Types.ObjectId(id);
    const logCtx   = `${entityKey}:${entityId}`;

    const progress = async (pct: number) => {
        try { await (job as any)?.updateProgress(pct); } catch { /* best-effort */ }
    };

    try {
        await progress(10);
        logger.info(`[PIPELINE START] ${logCtx}`);

        const args = pythonArgs
            ?? config.pythonArgsBuilder?.(entityId)
            ?? [entityId.toString()];

        // Pass emit directly — runPythonTyped will call emit(event, { progress, message })
        // for each progress line Python emits
        const pythonResponse = await runPythonTyped(
            config.pythonScript,
            args,
            emit,   // ← correct shape now
        ) as PythonResponse;

        await progress(60);

        if (!pythonResponse) throw new Error(`Empty Python response for ${logCtx}`);
        if (pythonResponse.error) throw new Error(pythonResponse.error);

        const payload = config.buildPayload(pythonResponse, entityId);
        await progress(75);

        let saved;
        if (config.repo.create) {
            const existing = await config.repo.getExisting(entityId);
            saved = existing
                ? await config.repo.update(entityId, payload)
                : await config.repo.create({ _id: entityId, ...payload });
        } else {
            saved = await config.repo.update(entityId, payload);
        }

        await progress(90);
        logger.info(`[PIPELINE SAVED] ${logCtx}`);

        if (config.afterSave) {
            await config.afterSave(saved, emit, emitSocket);
        }

        await progress(100);
        logger.info(`[PIPELINE SUCCESS] ${logCtx}`);

        return { cached: false, data: saved };

    } catch (error) {
        logger.error(`[PIPELINE ERROR] ${logCtx}`, error);
        throw error;
    }
};
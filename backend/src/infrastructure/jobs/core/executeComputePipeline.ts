import { Types } from 'mongoose';
import logger from '../../../utils/logger.js';
import { PythonResponse, runPythonTyped } from '../../../types/python.types.js';
import { QueueJob } from '../../../types/queues.types.js';


interface PipelineOptions {
    entityKey:   string;
    id:          Types.ObjectId | string;
    job?:        QueueJob | null;
    emit?:       (event: string, data: { progress: number; message?: string }) => void;
    emitSocket?: (event: string, data: any) => void;
    pythonArgs?: (string | number)[];
}

export const executeComputePipeline = async ({
    entityKey,
    id,
    job        = null,
    emit       = () => {},
    emitSocket = () => {},
    pythonArgs,
}: PipelineOptions) => {
     // Lazy merge — runs after all modules are initialized, no circular risk
    const { embeddingRegistry } = await import('../domains/embedding/embeddingRegistry.js');
    const { scoringRegistry }   = await import('../domains/scoring/scoringRegistry.js');

    const computeRegistry = { ...embeddingRegistry, ...scoringRegistry };
    const config   = computeRegistry[entityKey];
    const entityId = new Types.ObjectId(id);
    const logCtx   = `${entityKey}:${entityId}`;

    if (!config) throw new Error(`No compute registry config found for: ${entityKey}`);

    const progress = async (pct: number) => {
        try { await (job as any)?.updateProgress(pct); } catch { /* best-effort */ }
    };

    try {
        await progress(10);
        logger.info(`[PIPELINE START] ${logCtx}`);

        // ── Execution ────────────────────────────────────────────────────────
        let executionResult: any;

        if (config.pythonScript) {
            const args = pythonArgs
                ?? config.pythonArgsBuilder?.(entityId)
                ?? [entityId.toString()];

            executionResult = await runPythonTyped(
                config.pythonScript,
                args,
                emit,
            ) as PythonResponse;

            if (!executionResult)      throw new Error(`Empty Python response for ${logCtx}`);
            if (executionResult.error) throw new Error(executionResult.error);

        } else if (config.execute) {
            executionResult = await config.execute(entityId, { emit, emitSocket });

        } else {
            throw new Error(`ComputeJobConfig for ${entityKey} must define pythonScript or execute`);
        }

        await progress(60);

        // ── Persistence ──────────────────────────────────────────────────────
        const payload = config.buildPayload(executionResult, entityId);
        await progress(75);

        let saved: any;
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

        // ── Post-save hooks ──────────────────────────────────────────────────
        // extract userId from job data
        const userId = (job as any)?.data?.userId;

        if (config.afterSave) {
            await config.afterSave(saved, emit, emitSocket, { userId });
        }
        
        await progress(100);
        logger.info(`[PIPELINE SUCCESS] ${logCtx}`);

        return { cached: false, data: saved };

    } catch (error) {
        logger.error(`[PIPELINE ERROR] ${logCtx}`, error);
        throw error;
    }
};
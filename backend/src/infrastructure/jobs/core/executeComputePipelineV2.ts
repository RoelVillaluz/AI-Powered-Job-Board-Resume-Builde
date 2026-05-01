import { Types } from "mongoose";
import logger from "../../../utils/logger.js";
import { aiClient } from "../../clients/aiClientHandler.js";
import { embeddingRegistryV2 } from "../domains/embedding/embeddingRegistryV2.js";
import { QueueJob } from "../../../types/queues.types.js";
import { PythonEmit } from "../../../types/python.types.js";
import { ResumeEmbeddingAIResult } from "../../../types/aiResults.types.js";
import { EmitFn } from "./computeRegistryTypesV2.js";

interface PipelineOptions {
    entityKey: keyof typeof embeddingRegistryV2;
    id: Types.ObjectId | string;
    job?: QueueJob | null;
    emit?: EmitFn;  // ← replaces PythonEmit
}

export const executeComputePipelineV2 = async ({
    entityKey,
    id,
    job = null,
    emit = () => {},
}: PipelineOptions) => {

    const config = embeddingRegistryV2[entityKey];
    if (!config) throw new Error(`No config found for ${entityKey}`);

    const entityId = new Types.ObjectId(id);
    const logCtx = `${entityKey}:${entityId}`;

    const updateProgress = async (progress: number, message?: string) => {
        try {
            await job?.updateProgress(progress);
        } catch {
            // ignore queue progress failures
        }

        emit("embedding:progress", { progress, message });
    };

    try {
        logger.info(`[PIPELINE START] ${logCtx}`);
        await updateProgress(10, "Fetching data");

        // ───────────────────────────────────────
        // 1. FETCH (dynamic via registry)
        // ───────────────────────────────────────
        const aiInput = await config.fetcher(entityId);

        if (!aiInput) {
            throw new Error(`${entityKey} not found`);
        }

        await updateProgress(30, "Calling AI service");

        // ───────────────────────────────────────
        // 2. AI SERVICE CALL
        // ───────────────────────────────────────
        const aiOutput = await aiClient(config.aiEndpoint, aiInput);

        await updateProgress(70, "Building payload");

        // ───────────────────────────────────────
        // 3. BUILD PAYLOAD
        // ───────────────────────────────────────
        const mapped = config.mapper(aiOutput);

        // ───────────────────────────────────────
        // 4. BUILD PAYLOAD
        // ───────────────────────────────────────
        const embeddingDocument = {
            [config.entity]: entityId,
            ...mapped,
            generatedAt: new Date(),
        };
        await updateProgress(85, "Saving embeddings");

        // ───────────────────────────────────────
        // 5. PERSIST (dynamic via registry)
        // ───────────────────────────────────────
        const saved = await config.persist(entityId, embeddingDocument);

        await updateProgress(100, "Complete");

        logger.info(`[PIPELINE SUCCESS] ${logCtx}`);

        return {
            cached: false,
            data: saved,
        };

    } catch (error) {
        logger.error(`[PIPELINE ERROR] ${logCtx}`, error);

        emit("embedding:error", {
            progress: 0,
            message: error instanceof Error ? error.message : "Unknown error",
        });

        throw error;
    }
};
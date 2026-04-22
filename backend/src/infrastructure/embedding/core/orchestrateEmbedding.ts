import logger from "../../../utils/logger.js"
import { executeEmbeddingFallback } from "./executeEmbeddingFallback.js"

interface OrchestrationOptions<T> {
    invalidateCache?: boolean;
    logContext: string;
    getCached: () => Promise<{ cached: boolean; data?: T }>;
    validateShape: (data: T) => boolean;
    queueGeneration: () => Promise<{ jobId: string }>;
    fallbackGeneration: () => Promise<T>;
}

export const orchestrateEmbeddings = async <T>({
    invalidateCache = false,
    logContext,
    getCached,
    validateShape,
    queueGeneration,
    fallbackGeneration,
}: OrchestrationOptions<T>): Promise<
    | { cached: true; data: T }
    | { cached: false; jobId: string }
    | { cached: false; data: T }
> => {
    if (!invalidateCache) {
        const cacheResult = await getCached();

        if (cacheResult.cached && cacheResult.data) {
            if (validateShape(cacheResult.data)) {
                logger.info(`Valid cached embedding for ${logContext}`);
                return { cached: true as const, data: cacheResult.data };
            }
        }

        logger.warn(`Invalid cached embedding for ${logContext} — regenerating`);
        invalidateCache = true;
    }

    logger.info(`Queueing embedding generation for ${logContext}`, {
        reason: invalidateCache ? "forced_regeneration" : "cache_miss"
    });

    const result = await executeEmbeddingFallback({
        queueFn: queueGeneration,
        fallbackFn: fallbackGeneration
    });

    return result.type === "queued"
        ? { cached: false as const, jobId: result.jobId }
        : { cached: false as const, data: result.data as T};
}
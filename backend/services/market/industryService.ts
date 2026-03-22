import { IndustryEmbeddingData, CreateIndustryPayload, UpdateIndustryPayload } from "../../types/industry.types";
import { Types } from "mongoose";
import { QueueJob } from "../../types/queues.types";
import logger from "../../utils/logger";
import { PythonResponse, runPythonTyped } from "../../types/python.types";
import * as IndustryRepo from '../../repositories/market/industryRepositories'
import { isEmbeddingStale, isValidEmbedding } from "../../utils/embeddingValidationUtils";
import { safeQueueOperation } from "../../utils/queueUtils";
import { industryEmbeddingQueue } from "../../queues";
import Industry from "../../models/market/industryModel";

type IndustryEmbeddingCacheResult = 
    | { cached: true; data: IndustryEmbeddingData }
    | { cached: false; data: null }

type IndustryEmbeddingOrchestrationResult =
    | { cached: true; data: IndustryEmbeddingData; jobId?: never }
    | { cached: false; jobId: string; data?: never }
    | { cached: false; data: IndustryEmbeddingData; jobId?: never }

export const getOrGenerateIndustryEmbeddingService = async (
    industryId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<IndustryEmbeddingOrchestrationResult> => {
    if (!invalidateCache) {
        const cacheResult = await getIndustryEmbeddingService(industryId);

        if (cacheResult.cached) {
            const valid = isValidEmbedding(cacheResult.data.embedding);

            if (valid) {
                logger.info(`Valid cached embedding for industry: ${industryId}`);
                return { cached: true, data: cacheResult.data };
            }

            logger.warn(`Invalid embedding shape for industry: ${industryId} — regenerating`);
            invalidateCache = true;
        } 
    }

    logger.info(`Queueing embedding generation for industry: ${industryId}`, {
        reason: invalidateCache ? 'forced_regeneration' : 'cache_miss'
    });

    const result = await safeQueueOperation(
        async () => {
            const job = await industryEmbeddingQueue.add(
                'generate-embeddings',
                { industryId: industryId.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 12000,
                    jobId: `industry-embedding-${industryId.toString()}`
                } as any
            );

            return { jobId: job.id!.toString() }
        },
        async () => {
            const res = await upsertIndustryEmbeddingService(industryId, true);

            if (!res.data) {
                throw new Error("Embedding generation failed: no data returned");
            }

            return res.data;
        }
    );

    if (result.type === 'queued') {
        return { cached: false, jobId: result.jobId }
    }

    return { cached: false, data: result.data }
}

export const getIndustryEmbeddingService = async (
    industryId: Types.ObjectId
): Promise<IndustryEmbeddingCacheResult> => {
    const industryEmbedding = await IndustryRepo.getIndustryEmbeddingByIdRepository(industryId);

    if (!industryEmbedding?.embedding?.length) {
        logger.info(`Cache miss - no embedding found for industry: ${industryId}`);
        return { cached: false, data: null }
    }

    if (isEmbeddingStale(industryEmbedding.embeddingGeneratedAt)) {
        logger.info(`Cache miss - stale embedding for industry: ${industryId}`);
        return { cached: false, data: null }
    }

    return { cached: true, data: industryEmbedding }
}

export const upsertIndustryEmbeddingService = async(
    industryId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: (progress: number) => void = () => {},
) => {
    /**
     * Safe progress helper — job.updateProgress() throws when called outside
     * an active BullMQ worker context (e.g. safeQueueOperation fallback path).
     * The method exists on the Job prototype so typeof checks pass, but the
     * runtime call fails without a live Redis connection. Wrapping in try/catch
     * degrades gracefully in both the queue and inline fallback paths.
     */
    const progress = async (pct: number) => {
        try {
            await (job as any)?.updateProgress(pct);
        } catch {
            // Safe to ignore — progress tracking is best-effort
        }
    };

    try {
        await progress(10);

        if (isFallback) {
            logger.warn(`Embedding generated inline (Redis fallback)`);
        }

        logger.info(`Generating embedding for industry: ${industryId}`);

        const pythonResponse = await runPythonTyped(
            'generate_industry_embeddings',
            [industryId.toString()],
            emit 
        ) as PythonResponse;

        await progress(80);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        if (!pythonResponse.embedding?.length) {
            throw new Error(`Python returned empty embedding for industry: ${industryId}`);
        }

        const savedEmbedding = await IndustryRepo.updateIndustryEmbeddingRepository(
            industryId, 
            pythonResponse.embedding
        );

        await progress(100);

        logger.info(`Embedding saved for industry: ${industryId}`, {
            embeddingLength: pythonResponse.embedding.length
        });

        return { cached: false, data: savedEmbedding };
    } catch (error) {
        logger.error(`Error in embedding pipeline for industry: ${industryId}:`, error);
        throw error;
    }
}

/**
 * Creates a new industry and queues embedding generation.
 *
 * Flow:
 * 1. Persist the industry via the repository
 * 2. Queue embedding generation — does not block the HTTP response
 *
 * @param data - Payload for creating a new industry
 * @returns The newly created Industry document
 */
export const createIndustryService = async (data: CreateIndustryPayload) => {
    const newIndustry = await IndustryRepo.createIndustryRepository(data);

    await safeQueueOperation(
        async () => {
            const job = await industryEmbeddingQueue.add(
                'generate-embeddings',
                { industryId: newIndustry._id.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000,
                    jobId: `industry-embedding-${newIndustry._id.toString()}`
                } as any
            );

            return { jobId: job.id!.toString() };
        },
        async () => {
            const res = await upsertIndustryEmbeddingService(newIndustry._id, true);

            if (!res.data) {
                throw new Error("Embedding generation failed after create");
            }

            return res.data;
        }
    );

    logger.info(`Industry created and embedding queued: ${newIndustry._id}`);
    return newIndustry;
}

/**
 * Updates an existing industry and conditionally re-queues embedding generation.
 *
 * Flow:
 * 1. Update industry fields via the repository
 * 2. If name changed (affects semantic embedding):
 *    - Invalidate existing embedding
 *    - Queue a new embedding generation job
 * 3. Updating other fields (description, aliases) does not trigger re-generation
 *
 * @param industryId - ObjectId of the industry to update
 * @param updateData - Fields to update
 * @returns The updated Industry document
 */
export const updateIndustryService = async (
    industryId: Types.ObjectId,
    updateData: UpdateIndustryPayload
) => {
    const updatedIndustry = await IndustryRepo.updateIndustryRepository(industryId, updateData);

    if (updateData.name) {
        await Industry.findByIdAndUpdate(industryId, {
            $set: { embedding: null, embeddingGeneratedAt: null }
        });

        await safeQueueOperation(
            async () => {
                const job = await industryEmbeddingQueue.add(
                    'generate-embeddings',
                    { industryId: industryId.toString() },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        timeout: 120000,
                        jobId: `industry-embedding-${industryId.toString()}`
                    } as any
                );

                return { jobId: job.id!.toString() };
            },
            async () => {
                const res = await upsertIndustryEmbeddingService(industryId, true);

                if (!res.data) {
                    throw new Error("Embedding generation failed after update");
                }

                return res.data;
            }
        );

        logger.info(`Industry updated — embedding invalidated and re-queued: ${industryId}`);
    }

    return updatedIndustry;
}
import { Types } from "mongoose"
import Location, { LocationDocument } from "../../models/market/locationModel";
import * as LocationRepository from '../../repositories/market/locationRepositories'
import logger from "../../utils/logger";
import { isEmbeddingStale, isValidEmbedding } from "../../utils/embeddingValidationUtils";
import { QueueJob } from "../../types/queues.types";
import { PythonResponse, runPythonTyped } from "../../types/python.types";
import { CreateLocationPayload, LocationEmbeddingData, UpdateLocationPayload } from "../../types/location.types";
import { locationEmbeddingQueue } from "../../queues";
import { safeQueueOperation } from "../../utils/queueUtils";

type LocationEmbeddingCacheResult = 
    | { cached: true; data: LocationEmbeddingData }
    | { cached: false; data: null }

type LocationEmbeddingOrchestrationResult =
    | { cached: true; data: LocationEmbeddingData; jobId?: never }
    | { cached: false; jobId: string; data?: never }
    | { cached: false; data: LocationEmbeddingData; jobId?: never }

export const getOrGenerateLocationEmbeddingService = async (
    locationId: Types.ObjectId,
    invalidateCache: boolean = false
): Promise<LocationEmbeddingOrchestrationResult> => {
    if (!invalidateCache) {
        const cacheResult = await getLocationEmbeddingService(locationId);

        if (cacheResult.cached) {
            const valid = isValidEmbedding(cacheResult.data.embedding);

            if (valid) {
                logger.info(`Valid cached embedding for location: ${locationId}`);
                return { cached: true, data: cacheResult.data };
            }

            logger.warn(`Invalid embedding shape for location: ${locationId} — regenerating`);
            invalidateCache = true;
        }
    }

    logger.info(`Queueing embedding generation for location: ${locationId}`, {
        reason: invalidateCache ? 'forced_regeneration' : 'cache_miss'
    });

    const result = await safeQueueOperation(
        async () => {
            const job = await locationEmbeddingQueue.add(
                'generate-embeddings',
                { locationId: locationId.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000
                } as any
            );

            return { jobId: job.id!.toString() };
        },
        async () => {
            const res = await upsertLocationEmbeddingService(locationId, true);

            if (!res.data) {
                throw new Error("Embedding generation failed: no data returned");
            }

            return res.data;
        }
    );

    if (result.type === 'queued') {
        return { cached: false, jobId: result.jobId };
    }

    return { cached: false, data: result.data };
}

export const getLocationEmbeddingService = async (
    locationId: Types.ObjectId
): Promise<LocationEmbeddingCacheResult> => {
    const locationEmbedding = await LocationRepository.getLocationEmbeddingByIdRepository(locationId);

    if (!locationEmbedding?.embedding?.length) {
        logger.info(`Cache miss - no embedding found for location: ${locationId}`);
        return { cached: false, data: null }
    }

    if (isEmbeddingStale(locationEmbedding.embeddingGeneratedAt)) {
        logger.info(`Cache miss - stale embedding for location: ${locationId}`);
        return { cached: false, data: null }
    }

    logger.info(`Cache hit for location embedding: ${locationId}`)
    return { cached: true, data: locationEmbedding }
}

export const upsertLocationEmbeddingService = async (
    locationId: Types.ObjectId,
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

        logger.info(`Generating embedding for location: ${locationId}`);

        const pythonResponse = await runPythonTyped(
            'generate_location_embeddings',
            [locationId.toString()],
            emit
        ) as PythonResponse;

        await progress(80);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        if (!pythonResponse.embedding?.length) {
            throw new Error(`Python returned empty embedding for location: ${locationId}`);
        }

        const savedEmbedding = await LocationRepository.updateLocationEmbeddingRepository(
            locationId,
            pythonResponse.embedding
        );

        await progress(100);

        logger.info(`Embedding saved for location: ${locationId}`, {
            embeddingLength: pythonResponse.embedding.length
        });

        return { cached: false, data: savedEmbedding };

    } catch (error) {
        logger.error(`Error in embedding pipeline for location: ${locationId}:`, error);
        throw error;
    }
}

export const createLocationService = async (data: CreateLocationPayload): Promise<LocationDocument> => {
    const newLocation = await LocationRepository.createLocationRepository(data);

    await safeQueueOperation(
        async () => {
            const job = await locationEmbeddingQueue.add(
                'generate-embeddings',
                { locationId: newLocation._id.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000
                } as any
            );

            return { jobId: job.id!.toString() }
        },
        async () => {
            const res = await upsertLocationEmbeddingService(newLocation._id, true);

            if (!res.data) {
                throw new Error("Embedding generation failed after create");
            }

            return res.data;
        }
    );

    logger.info(`Location created and embedding queued: ${newLocation._id}`);
    return newLocation;
}

export const updateLocationservice = async (
    id: Types.ObjectId,
    updateData: UpdateLocationPayload
): Promise<LocationDocument | null> => {
    const updatedLocation = await LocationRepository.updateLocationRepository(id, updateData);

    if (updatedLocation?.name) {
        await Location.findByIdAndUpdate(id, {
            $set: { embedding: null, embeddingGeneratedAt: null }
        });

        await safeQueueOperation(
            async () => {
                const job = await locationEmbeddingQueue.add(
                    'generate-embeddings',
                    { locationId: updatedLocation._id.toString() },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        timeout: 120000
                    } as any
                );

                return { jobId: job.id!.toString() }
            },
            async () => {
                const res = await upsertLocationEmbeddingService(updatedLocation._id, true);

                if (!res.data) {
                    throw new Error("Embedding generation failed after update");
                }

                return res.data;
            }
        );

        logger.info(`Location updated — embedding invalidated and re-queued: ${id}`);
    }

    return updatedLocation;
}
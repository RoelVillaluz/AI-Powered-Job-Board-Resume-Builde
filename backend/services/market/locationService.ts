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

/**
 * Orchestrator — decides whether to return a cached embedding or queue generation.
 *
 * Flow:
 * 1. If invalidateCache is false, fetch existing embedding via getLocationEmbeddingService
 *    which checks existence and staleness
 * 2. If cached data exists, validate embedding shape and zero-vector integrity
 *    via isValidEmbedding — a separate concern from staleness
 * 3. If valid → return cached data immediately, no Python call
 * 4. If missing, stale, or invalid shape → attempt to queue background generation
 *    via safeQueueOperation; falls back to inline generation if Redis is unavailable
 *
 * @param locationId - Location ObjectId
 * @param invalidateCache - Force regeneration even if a valid embedding exists
 * @returns Cached embedding data, jobId of the queued generation job, or inline fallback data
 */
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
                    timeout: 120000,
                    // Dedup key — if a job for this location is already pending
                    // or active, this add() is a no-op instead of queuing duplicate work
                    jobId: `location-embedding-${locationId.toString()}`
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

/**
 * Checks if a non-stale embedding exists for the given location.
 *
 * Checks:
 * 1. Embedding field exists and is non-empty
 * 2. embeddingGeneratedAt is within the staleness threshold
 *
 * Note: Does NOT validate embedding shape — that is the orchestrator's
 * responsibility via isValidEmbedding. Separation keeps each function
 * focused on one concern.
 *
 * @param locationId - Location ObjectId
 * @returns Discriminated union — cached:true with data, or cached:false with null
 */
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

/**
 * Generates and persists a location embedding by calling the Python encoder.
 *
 * Called by the locationEmbeddingQueue worker, or inline via safeQueueOperation
 * fallback when Redis is unavailable. The isFallback flag distinguishes these
 * paths for observability.
 *
 * Safe progress helper — job.updateProgress() throws when called outside
 * an active BullMQ worker context (e.g. safeQueueOperation fallback path).
 * The method exists on the Job prototype so typeof checks pass, but the
 * runtime call fails without a live Redis connection. Wrapping in try/catch
 * degrades gracefully in both the queue and inline fallback paths.
 *
 * Flow:
 * 1. Call Python generate_location_embeddings script with locationId
 * 2. Validate Python response is non-empty before writing
 * 3. Persist embedding + embeddingGeneratedAt via updateLocationEmbeddingRepository
 *
 * @param locationId - Location ObjectId
 * @param isFallback - True when called inline (Redis unavailable), false when called by queue worker
 * @param job - BullMQ job instance for progress tracking, null if called outside queue
 * @param emit - Progress callback for streaming updates to client
 * @returns { cached: false, data: updated Location document }
 */
export const upsertLocationEmbeddingService = async (
    locationId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: (progress: number) => void = () => {},
) => {
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

/**
 * Creates a new location and queues embedding generation.
 *
 * Flow:
 * 1. Persist the location via the repository
 * 2. Queue embedding generation via safeQueueOperation — does not block the HTTP response.
 *    Falls back to inline generation if Redis is unavailable.
 *
 * @param data - Payload for creating a new location
 * @returns The newly created Location document
 */
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
                    timeout: 120000,
                    jobId: `location-embedding-${newLocation._id.toString()}`
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

/**
 * Updates an existing location and conditionally re-queues embedding generation.
 *
 * Flow:
 * 1. Update location fields via the repository
 * 2. If name changed (affects semantic embedding):
 *    - Invalidate existing embedding
 *    - Queue a new embedding generation job via safeQueueOperation,
 *      falling back to inline generation if Redis is unavailable
 * 3. Updating other fields does not trigger re-generation
 *
 * @param id - ObjectId of the location to update
 * @param updateData - Fields to update
 * @returns The updated Location document, or null if not found
 */
export const updateLocationService = async (
    id: Types.ObjectId,
    updateData: UpdateLocationPayload
): Promise<LocationDocument | null> => {
    const updatedLocation = await LocationRepository.updateLocationRepository(id, updateData);

    if (updateData.name) {
        await Location.findByIdAndUpdate(id, {
            $set: { embedding: null, embeddingGeneratedAt: null }
        });

        await safeQueueOperation(
            async () => {
                const job = await locationEmbeddingQueue.add(
                    'generate-embeddings',
                    { locationId: id.toString() },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        timeout: 120000,
                        jobId: `location-embedding-${id.toString()}`
                    } as any
                );

                return { jobId: job.id!.toString() }
            },
            async () => {
                const res = await upsertLocationEmbeddingService(id, true);

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
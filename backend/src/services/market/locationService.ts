import { Types } from 'mongoose';
import Location, { LocationDocument } from '../../models/market/locationModel.js';
import * as LocationRepository from '../../repositories/market/locationRepositories.js';
import logger from '../../utils/logger.js';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddings/embeddingValidationUtils.js';
import { QueueJob } from '../../types/queues.types.js';
import { PythonEmit, PythonResponse, runPythonTyped } from '../../types/python.types.js';
import { CreateLocationPayload, LocationEmbeddingData, UpdateLocationPayload } from '../../types/location.types.js';
import { embeddingRegistry } from '../../infrastructure/jobs/domains/embedding/embeddingRegistry.js';
import { orchestrateComputeJob } from '../../infrastructure/jobs/core/orchestrateComputeJob.js';
import { executeComputePipeline } from '../../infrastructure/jobs/core/executeComputePipeline.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationEmbeddingCacheResult =
    | { cached: true;  data: LocationEmbeddingData }
    | { cached: false; data: null }

type LocationEmbeddingOrchestrationResult =
    | { cached: true;  data: LocationEmbeddingData; jobId?: never }
    | { cached: false; jobId: string;               data?: never }
    | { cached: false; data: LocationEmbeddingData; jobId?: never }

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export const getOrGenerateLocationEmbeddingService = async (
    locationId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<LocationEmbeddingOrchestrationResult> => {
    return orchestrateComputeJob<LocationEmbeddingData>({
        invalidateCache,
        logContext: `location:${locationId}`,

        getCached: async () => {
            const result = await getLocationEmbeddingService(locationId);
            return result.cached
                ? { cached: true,  data: result.data }
                : { cached: false };
        },

        validateShape: (data) => isValidEmbedding(data.embedding),

        queueGeneration: () =>
            embeddingRegistry.location.queue({
                id:         locationId.toString(),
                locationId: locationId.toString(),
            }),

        fallbackGeneration: async () => {
            const res = await upsertLocationEmbeddingService(locationId, true);
            if (!res.data) throw new Error('Location embedding fallback returned no data');
            return res.data;
        },
    });
};

// ─── Cache check ──────────────────────────────────────────────────────────────

export const getLocationEmbeddingService = async (
    locationId: Types.ObjectId
): Promise<LocationEmbeddingCacheResult> => {
    const locationEmbedding = await LocationRepository.getLocationEmbeddingByIdRepository(locationId);

    if (!locationEmbedding?.embedding?.length) {
        logger.info(`Cache miss — no embedding found for location: ${locationId}`);
        return { cached: false, data: null };
    }

    if (isEmbeddingStale(locationEmbedding.embeddingGeneratedAt)) {
        logger.info(`Cache miss — stale embedding for location: ${locationId}`);
        return { cached: false, data: null };
    }

    logger.info(`Cache hit for location embedding: ${locationId}`);
    return { cached: true, data: locationEmbedding };
};

// ─── Upsert ───────────────────────────────────────────────────────────────────
export const upsertLocationEmbeddingService = async (
    locationId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {},
) => {
    if (isFallback) logger.warn(`Location embedding generated inline (Redis fallback)`);
    return executeComputePipeline({ entityKey: 'location', id: locationId, job, emit });
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createLocationService = async (data: CreateLocationPayload): Promise<LocationDocument> => {
    const newLocation = await LocationRepository.createLocationRepository(data);

    await embeddingRegistry.location.queue({
        id:         newLocation._id.toString(),
        locationId: newLocation._id.toString(),
    }).catch(async () => {
        await upsertLocationEmbeddingService(newLocation._id, true);
    });

    logger.info(`Location created and embedding queued: ${newLocation._id}`);
    return newLocation;
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateLocationService = async (
    id: Types.ObjectId,
    updateData: UpdateLocationPayload,
): Promise<LocationDocument | null> => {
    const updatedLocation = await LocationRepository.updateLocationRepository(id, updateData);

    if (updateData.name) {
        await Location.findByIdAndUpdate(id, {
            $set: { embedding: null, embeddingGeneratedAt: null },
        });

        await embeddingRegistry.location.queue({
            id:         id.toString(),
            locationId: id.toString(),
        }).catch(async () => {
            await upsertLocationEmbeddingService(id, true);
        });

        logger.info(`Location updated — embedding invalidated and re-queued: ${id}`);
    }

    return updatedLocation;
};
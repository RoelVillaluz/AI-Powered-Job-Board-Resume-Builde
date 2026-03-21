// services/market/jobTitleEmbeddingService.ts
import * as JobTitleRepo from '../../repositories/market/jobTitleRepositories';
import { Types } from 'mongoose';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddingValidationUtils';
import logger from '../../utils/logger';
import { PythonResponse, runPythonTyped } from '../../types/python.types';
import { runPython } from '../../utils/pythonRunner';
import { QueueJob } from '../../types/queues.types';
import { jobTitleEmbeddingQueue } from '../../queues';
import JobTitle, { JobTitleDocument } from '../../models/market/jobTitleModel';
import { CreateJobTitlePayload, UpdateJobTitlePayload, JobTitleEmbeddingData } from '../../types/jobTitle.types';

// ============================================
// RETURN TYPES
// ============================================

type JobTitleEmbeddingCacheResult =
    | { cached: true;  data: JobTitleEmbeddingData }
    | { cached: false; data: null }

type JobTitleEmbeddingOrchestrationResult =
    | { cached: true;  data: JobTitleEmbeddingData; jobId?: never }
    | { cached: false; data?: never; jobId: string | undefined }

// ============================================
// SERVICES
// ============================================

/**
 * Orchestrator — decides whether to return cached embedding or queue generation.
 *
 * Flow:
 * 1. If invalidateCache is false, check for existing embedding via getJobTitleEmbeddingService
 *    which handles existence and staleness checks
 * 2. If cached data exists, validate embedding shape and zero-vector integrity
 *    via isValidEmbedding — separate concern from staleness
 * 3. If valid → return cached data immediately
 * 4. If missing, stale, or invalid shape → queue background generation
 *
 * @param titleId - JobTitle ObjectId
 * @param invalidateCache - Force regeneration even if valid embedding exists
 * @returns Cached embedding data or jobId of the queued generation job
 */
export const getOrGenerateJobTitleEmbeddingService = async (
    titleId: Types.ObjectId,
    invalidateCache: boolean = false,
): Promise<JobTitleEmbeddingOrchestrationResult> => {

    if (!invalidateCache) {
        const cacheResult = await getJobTitleEmbeddingService(titleId);

        if (cacheResult.cached) {
            const valid = isValidEmbedding(cacheResult.data.embedding);

            if (valid) {
                logger.info(`Valid cached embedding for job title: ${titleId}`);
                return { cached: true, data: cacheResult.data };
            }

            logger.warn(`Invalid embedding shape for job title: ${titleId} — regenerating`);
            invalidateCache = true;
        }
    }

    logger.info(`Queueing embedding generation for job title: ${titleId}`, {
        reason: invalidateCache ? 'forced_regeneration' : 'cache_miss'
    });

    const job = await jobTitleEmbeddingQueue.add(
        'generate-embeddings',
        { titleId: titleId.toString() },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 120000
        } as any
    );

    return { cached: false, jobId: job.id };
}

/**
 * Checks if a non-stale embedding exists for the given job title.
 *
 * Checks:
 * 1. Embedding field exists and is non-empty
 * 2. embeddingGeneratedAt is within maxAgeDays (default 90)
 *
 * Note: Does NOT validate embedding shape — that is the orchestrator's
 * responsibility via isValidEmbedding.
 *
 * @param titleId - JobTitle ObjectId
 * @returns Discriminated union — cached:true with data, or cached:false with null
 */
export const getJobTitleEmbeddingService = async (
    titleId: Types.ObjectId
): Promise<JobTitleEmbeddingCacheResult> => {

    const titleDoc = await JobTitleRepo.getJobTitleEmbeddingsByIdRepository(titleId);

    if (!titleDoc?.embedding?.length) {
        logger.info(`Cache miss — no embedding found for job title: ${titleId}`);
        return { cached: false, data: null };
    }

    if (isEmbeddingStale(titleDoc.embeddingGeneratedAt, 90)) {
        logger.info(`Cache miss — stale embedding for job title: ${titleId}`);
        return { cached: false, data: null };
    }

    logger.info(`Cache hit for job title embedding: ${titleId}`);
    return { cached: true, data: titleDoc };
}

/**
 * Generates and persists a job title embedding by calling the Python encoder.
 * Encodes normalizedTitle — more semantically consistent than full title
 * since aliases like "Sr. Engineer" and "Senior Engineer" map to same normalizedTitle.
 *
 * Called exclusively by the jobTitleEmbeddingQueue worker.
 *
 * @param titleId - JobTitle ObjectId
 * @param job - BullMQ job instance for progress tracking
 * @param emit - Progress callback for streaming updates
 * @returns { cached: false, data: updated JobTitle document }
 */
export const upsertJobTitleEmbeddingService = async (
    titleId: Types.ObjectId,
    job: QueueJob | null = null,
    emit: (progress: number) => void = () => {}
) => {
    try {
        await job?.updateProgress(10);

        logger.info(`Generating embedding for job title: ${titleId}`);

        const pythonResponse = await runPythonTyped(
            'generate_job_title_embeddings',
            [titleId.toString()],
            emit
        ) as PythonResponse;

        await job?.updateProgress(80);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        if (!pythonResponse.embedding?.length) {
            throw new Error(`Python returned empty embedding for job title: ${titleId}`);
        }

        const savedEmbedding = await JobTitleRepo.updateJobTitleEmbeddingRepository(
            titleId,
            pythonResponse.embedding
        );

        await job?.updateProgress(100);

        logger.info(`Embedding saved for job title: ${titleId}`, {
            embeddingLength: pythonResponse.embedding.length
        });

        return { cached: false, data: savedEmbedding };

    } catch (error) {
        logger.error(`Error in embedding pipeline for job title ${titleId}:`, error);
        throw error;
    }
}

/**
 * Create a new job title and queue embedding generation as a background job.
 * Only accepts admin-enterable fields — computed metrics populated by worker.
 * Embedding is queued immediately after creation — never blocks response.
 *
 * @param data - CreateJobTitlePayload
 */
export const createJobTitleService = async (data: CreateJobTitlePayload) => {
    const newTitle = await JobTitleRepo.createJobTitleRepository(data);

    await jobTitleEmbeddingQueue.add(
        'generate-embeddings',
        { titleId: newTitle._id.toString() },
        {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 120000
        } as any
    );

    logger.info(`Job title created and embedding queued: ${newTitle._id}`);
    return newTitle;
}

/**
 * Update a job title and conditionally invalidate its embedding.
 * Re-queues embedding generation only if title or normalizedTitle changed
 * since those are what gets encoded — other field changes don't affect semantics.
 *
 * @param id - JobTitle ObjectId
 * @param updateData - Partial admin-editable fields
 */
export const updateJobTitleService = async (
    id: Types.ObjectId,
    updateData: UpdateJobTitlePayload
) => {
    const updatedTitle = await JobTitleRepo.updateJobTitleRepository(id, updateData);

    if (updateData.title || updateData.normalizedTitle) {
        await JobTitle.findByIdAndUpdate(id, {
            $set: { embedding: null, embeddingGeneratedAt: null }
        });

        await jobTitleEmbeddingQueue.add(
            'generate-embeddings',
            { titleId: id.toString() },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                timeout: 120000
            } as any
        );

        logger.info(`Job title updated — embedding invalidated and re-queued: ${id}`);
    }

    return updatedTitle;
}
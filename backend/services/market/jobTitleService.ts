import * as JobTitleRepo from '../../repositories/market/jobTitleRepositories';
import { Types } from 'mongoose';
import { isEmbeddingStale, isValidEmbedding } from '../../utils/embeddings/embeddingValidationUtils';
import logger from '../../utils/logger';
import { PythonResponse, runPythonTyped } from '../../types/python.types';
import { QueueJob } from '../../types/queues.types';
import { jobTitleEmbeddingQueue } from '../../queues';
import JobTitle, { JobTitleDocument } from '../../models/market/jobTitleModel';
import { CreateJobTitlePayload, UpdateJobTitlePayload, JobTitleEmbeddingData } from '../../types/jobTitle.types';
import { safeQueueOperation } from '../../utils/queueUtils';
import { ImportanceLevel } from '../../../shared/constants/jobsAndIndustries/constants';

// ============================================
// RETURN TYPES
// ============================================

type JobTitleEmbeddingCacheResult =
    | { cached: true;  data: JobTitleEmbeddingData }
    | { cached: false; data: null }

type JobTitleEmbeddingOrchestrationResult =
    | { cached: true;  data: JobTitleEmbeddingData; jobId?: never }
    | { cached: false; jobId: string; data?: never }
    | { cached: false; data: JobTitleEmbeddingData; jobId?: never }

// ============================================
// SERVICES
// ============================================

/**
 * Orchestrator — decides whether to return a cached embedding or queue generation.
 *
 * Flow:
 * 1. If invalidateCache is false, fetch existing embedding via getJobTitleEmbeddingService
 *    which checks existence and staleness
 * 2. If cached data exists, validate embedding shape and zero-vector integrity
 *    via isValidEmbedding — a separate concern from staleness
 * 3. If valid → return cached data immediately, no Python call
 * 4. If missing, stale, or invalid shape → attempt to queue background generation
 *    via safeQueueOperation; falls back to inline generation if Redis is unavailable
 *
 * @param titleId - JobTitle ObjectId
 * @param invalidateCache - Force regeneration even if a valid embedding exists
 * @returns Cached embedding data, jobId of the queued generation job, or inline fallback data
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

    const result = await safeQueueOperation(
        async () => {
            const job = await jobTitleEmbeddingQueue.add(
                'generate-embeddings',
                { titleId: titleId.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000,
                    jobId: `job-title-embedding-${titleId.toString()}`
                } as any
            );

            return { jobId: job.id!.toString() };
        },
        async () => {
            const res = await upsertJobTitleEmbeddingService(titleId, true);

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
 * Checks if a non-stale embedding exists for the given job title.
 *
 * Checks:
 * 1. Embedding field exists and is non-empty
 * 2. embeddingGeneratedAt is within maxAgeDays (default 90)
 *
 * Note: Does NOT validate embedding shape — that is the orchestrator's
 * responsibility via isValidEmbedding. Separation keeps each function
 * focused on one concern.
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
 * Encodes normalizedTitle — more semantically consistent than the raw title
 * since aliases like "Sr. Engineer" and "Senior Engineer" map to the same normalizedTitle.
 *
 * Called by the jobTitleEmbeddingQueue worker, or inline via safeQueueOperation
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
 * 1. Call Python generate_job_title_embeddings script with titleId
 * 2. Validate Python response is non-empty before writing
 * 3. Persist embedding + embeddingGeneratedAt via updateJobTitleEmbeddingRepository
 *
 * @param titleId - JobTitle ObjectId
 * @param isFallback - True when called inline (Redis unavailable), false when called by queue worker
 * @param job - BullMQ job instance for progress tracking, null if called outside queue
 * @param emit - Progress callback for streaming updates to client
 * @returns { cached: false, data: updated JobTitle document }
 */
export const upsertJobTitleEmbeddingService = async (
    titleId: Types.ObjectId,
    isFallback: boolean,
    job: QueueJob | null = null,
    emit: (progress: number) => void = () => {}
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

        logger.info(`Generating embedding for job title: ${titleId}`);

        const pythonResponse = await runPythonTyped(
            'generate_job_title_embeddings',
            [titleId.toString()],
            emit
        ) as PythonResponse;

        await progress(80);

        if (pythonResponse.error) throw new Error(pythonResponse.error);

        if (!pythonResponse.embedding?.length) {
            throw new Error(`Python returned empty embedding for job title: ${titleId}`);
        }

        const savedEmbedding = await JobTitleRepo.updateJobTitleEmbeddingRepository(
            titleId,
            pythonResponse.embedding
        );

        await progress(100);

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
 * Creates a new job title and queues embedding generation.
 * Only accepts admin-enterable fields — computed metrics are populated by the worker.
 *
 * Flow:
 * 1. Persist the job title via the repository
 * 2. Queue embedding generation via safeQueueOperation — does not block the HTTP response.
 *    Falls back to inline generation if Redis is unavailable.
 *
 * @param data - Payload for creating a new job title
 * @returns The newly created JobTitle document
 */
export const createJobTitleService = async (data: CreateJobTitlePayload) => {
    const newTitle = await JobTitleRepo.createJobTitleRepository(data);

    await safeQueueOperation(
        async () => {
            const job = await jobTitleEmbeddingQueue.add(
                'generate-embeddings',
                { titleId: newTitle._id.toString() },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    timeout: 120000,
                    jobId: `job-title-embedding-${newTitle._id.toString()}`
                } as any
            );

            return { jobId: job.id!.toString() };
        },
        async () => {
            const res = await upsertJobTitleEmbeddingService(newTitle._id, true);

            if (!res.data) {
                throw new Error("Embedding generation failed after create");
            }

            return res.data;
        }
    );

    logger.info(`Job title created and embedding queued: ${newTitle._id}`);
    return newTitle;
}

/**
 * Updates an existing job title and conditionally re-queues embedding generation.
 * Re-queues only if title or normalizedTitle changed — these are what gets encoded,
 * so other field changes don't affect the semantic embedding.
 *
 * Flow:
 * 1. Update job title fields via the repository
 * 2. If title or normalizedTitle changed (affects semantic embedding):
 *    - Invalidate existing embedding
 *    - Queue a new embedding generation job via safeQueueOperation,
 *      falling back to inline generation if Redis is unavailable
 * 3. Updating other fields does not trigger re-generation
 *
 * @param id - JobTitle ObjectId
 * @param updateData - Partial admin-editable fields to update
 * @returns The updated JobTitle document
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

        await safeQueueOperation(
            async () => {
                const job = await jobTitleEmbeddingQueue.add(
                    'generate-embeddings',
                    { titleId: id.toString() },
                    {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 2000 },
                        timeout: 120000,
                        jobId: `job-title-embedding-${id.toString()}`
                    } as any
                );

                return { jobId: job.id!.toString() };
            },
            async () => {
                const res = await upsertJobTitleEmbeddingService(id, true);

                if (!res.data) {
                    throw new Error("Embedding generation failed after update");
                }

                return res.data;
            }
        );

        logger.info(`Job title updated — embedding invalidated and re-queued: ${id}`);
    }

    return updatedTitle;
}

export const getJobTitleTopSkillsService = async (
  id: Types.ObjectId,
  importance: string | null
) => {
  if (importance) {
    const lower = importance.toLowerCase() as ImportanceLevel;
    if (!Object.values(ImportanceLevel).includes(lower)) {
      throw new Error(`Invalid importance level: ${importance}`);
    }
    return JobTitleRepo.getJobTitleTopSkillsByImportance(id, lower);
  }

  // null importance returns all
  return JobTitleRepo.getJobTitleTopSkillsByImportance(id, null);
};
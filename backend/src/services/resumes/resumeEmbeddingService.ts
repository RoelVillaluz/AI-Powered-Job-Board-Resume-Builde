import { Types } from "mongoose";
import { getResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import { validateResumeEmbeddings } from "../../utils/embeddings/embeddingValidationUtils.js";
import logger from "../../utils/logger.js";
import { UnauthorizedError } from "../../middleware/errorHandler.js";
import { embeddingRegistry } from "../../infrastructure/jobs/domains/embedding/embeddingRegistry.js";
import { orchestrateComputeJob } from "../../infrastructure/jobs/core/orchestrateComputeJob.js";
import { executeComputePipeline } from "../../infrastructure/jobs/core/executeComputePipeline.js";
import { QueueJob } from "../../types/queues.types.js";
import { ResumeEmbeddingsDocument } from "../../types/embeddings.types.js";
import { executeWithFallback } from "../../infrastructure/jobs/core/executeWithFallback.js";
import { PythonEmit } from "../../types/python.types.js";

export const getOrGenerateResumeEmbeddingService = async (
    resumeId: string,
    invalidateCache = false,
    userId: string
) => {
    if (!userId) throw new UnauthorizedError();

    const entity = embeddingRegistry.resume;

    return orchestrateComputeJob({
        invalidateCache,
        logContext: `Resume ${resumeId}`,

        getCached: () => getResumeEmbeddingService(resumeId),

        validateShape: (data) =>
            validateResumeEmbeddings(data).valid,

        queueGeneration: () =>
            entity.queue({
                id: resumeId,
                resumeId,
                userId,
                invalidateCache,
            }),

        fallbackGeneration: async () => {
            const result = await entity.fallback(
                resumeId,
                invalidateCache,
                null,
                {
                    userId,
                    emit: () => {}, 
                }
            );

            return result.data;
        },
    });
};

export const getResumeEmbeddingService = async (
    resumeId: string | Types.ObjectId
): Promise<{ cached: true; data: ResumeEmbeddingsDocument } | { cached: false; data: null }> => {
    const cachedEmbeddings = await getResumeEmbeddingsRepo(resumeId);

    if (cachedEmbeddings) {
        const daysSinceGeneration =
            (Date.now() - new Date(cachedEmbeddings.generatedAt).getTime()) /
            (1000 * 60 * 60 * 24);

        if (daysSinceGeneration < 30) {
            logger.info(`Cache hit for resume embeddings: ${resumeId}`);
            return { cached: true, data: cachedEmbeddings as unknown as ResumeEmbeddingsDocument };
        }
    }

    logger.info(`Cache miss for resume embeddings: ${resumeId}`);
    return { cached: false, data: null };
};

export const createResumeEmbeddingService = async (
    resumeId: Types.ObjectId | string,
    invalidateCache = false,
    job: QueueJob | null = null,
    userId: string | null = null,
    emit: PythonEmit,
) => {
    const entity = embeddingRegistry.resume;

    return executeWithFallback({
        queueFn: () =>
            entity.queue({
                id: resumeId.toString(),
                resumeId: resumeId.toString(),
                userId: userId ?? "",
            }),

        fallbackFn: () =>
            entity.fallback(resumeId, invalidateCache, job, {
                userId: userId ?? undefined,
                emit,
            }),
    });
};

export const upsertResumeEmbedding = async (
    resumeId: Types.ObjectId | string,
    job: QueueJob | null = null,
    emit: PythonEmit = () => {},
) => {
    return executeComputePipeline({
        entityKey: 'resume',
        id:        new Types.ObjectId(resumeId),
        job,
        emit,
    });
};
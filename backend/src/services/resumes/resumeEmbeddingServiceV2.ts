import { Types } from "mongoose";
import { getResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";
import logger from "../../utils/logger.js";
import { ResumeEmbeddingsDocument } from "../../types/embeddings.types.js";
import { embeddingRegistryV2 } from "../../infrastructure/jobs/domains/embedding/embeddingRegistryV2.js";
import { QueueJob } from "../../types/queues.types.js";
import { executeComputePipelineV2 } from "../../infrastructure/jobs/core/executeComputePipelineV2.js";
import { EmitFn } from "src/infrastructure/jobs/core/computeRegistryTypesV2.js";

const EMBEDDING_TTL_DAYS = 30;

export const getResumeEmbeddingServiceV2 = async (
    resumeId: string | Types.ObjectId
): Promise<ResumeEmbeddingsDocument | null> => {
    const embeddings = await getResumeEmbeddingsRepo(resumeId);

    if (!embeddings) {
        logger.info(`Embeddings not found for resume: ${resumeId}`);
        return null;
    }

    const daysSinceGeneration =
        (Date.now() - new Date(embeddings.generatedAt).getTime()) /
        (1000 * 60 * 60 * 24);

    if (daysSinceGeneration >= EMBEDDING_TTL_DAYS) {
        logger.info(`Embeddings stale for resume: ${resumeId}`);
        return null;
    }

    return embeddings as ResumeEmbeddingsDocument;
};

export const enqueueResumeEmbeddingServiceV2 = async (
    resumeId: string,
    userId: string,
): Promise<{ jobId: string }> => {
    return embeddingRegistryV2.resume.queue({
        id: resumeId,
        resumeId,
        userId,
    });
};

export const upsertResumeEmbeddingServiceV2 = async (
    resumeId: string | Types.ObjectId,
    job: QueueJob | null = null,
    emit?: EmitFn,
) => {
    return executeComputePipelineV2({
        entityKey: "resume",
        id: resumeId,
        job,
        emit,
    });
};
// services/jobPostings/jobPostingEmbeddingService.ts

import { Types } from "mongoose";
import logger from "../../utils/logger.js";
import { QueueJob } from "../../types/queues.types.js";
import { EmitFn } from "src/infrastructure/jobs/core/computeRegistryTypesV2.js";

import { getJobEmbeddingRepo } from "../../repositories/jobPostings/jobEmbeddingRepositories.js";

import { embeddingRegistryV2 } from "../../infrastructure/jobs/domains/embedding/embeddingRegistryV2.js";

import { executeComputePipelineV2 } from "../../infrastructure/jobs/core/executeComputePipelineV2.js";

import { JobPostingEmbeddingsDocument } from "../../types/embeddings.types.js";

const EMBEDDING_TTL_DAYS = 90;

export const getJobPostingEmbeddingService = async (
    jobPostingId: string | Types.ObjectId
): Promise<JobPostingEmbeddingsDocument | null> => {
    const embeddings = await getJobEmbeddingRepo(jobPostingId);

    if (!embeddings) {
        logger.info(`Embeddings not found for job posting: ${jobPostingId}`);
        return null;
    }

    const daysSinceGeneration =
        (Date.now() - new Date(embeddings.generatedAt).getTime()) /
        (1000 * 60 * 60 * 24);

    if (daysSinceGeneration >= EMBEDDING_TTL_DAYS) {
        logger.info(`Embeddings stale for job posting: ${jobPostingId}`);
        return null;
    }

    return embeddings as JobPostingEmbeddingsDocument;
};

export const enqueueJobPostingEmbeddingService = async (
    jobPostingId: string,
): Promise<{ jobId: string }> => {
    return embeddingRegistryV2.jobPosting.queue({
        id: jobPostingId,
        jobPostingId,
    });
};

export const upsertJobPostingEmbeddingService = async (
    jobPostingId: string | Types.ObjectId,
    job: QueueJob | null = null,
    emit?: EmitFn,
) => {
    return executeComputePipelineV2({
        config: embeddingRegistryV2.jobPosting,
        id: jobPostingId,
        job,
        emit,
    });
};
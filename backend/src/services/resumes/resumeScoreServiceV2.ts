import { getResumeScoreRepo } from "../../repositories/resumes/resumeScoreRepository.js";
import logger from "../../utils/logger.js";
import { QueueJob } from "../../types/queues.types.js";
import { Types } from "mongoose";
import { EmitFn } from "../../infrastructure/jobs/core/computeRegistryTypesV2.js";
import { scoringRegistryV2 } from "../../infrastructure/jobs/domains/scoring/scoringRegistryV2.js";
import { executeComputePipelineV2 } from "../../infrastructure/jobs/core/executeComputePipelineV2.js";
import { getResumeEmbeddingsRepo } from "../../repositories/resumes/resumeEmbeddingRepository.js";

const SCORE_TTL_DAYS = 30;


export const getResumeScoreServiceV2 = async (
    resumeId: string | Types.ObjectId
) => {
    const score = await getResumeScoreRepo(resumeId);

    if (score) {
        const daysSinceGeneration =
            (Date.now() - new Date(score.calculatedAt).getTime()) /
            (1000 * 60 * 60 * 24);

        if (daysSinceGeneration < SCORE_TTL_DAYS) {
            logger.info(`Cache hit for resume score: ${resumeId}`);
            return score;
        }
    }

    logger.info(`Cache miss for resume score: ${resumeId}`);
    return null;
};

export const enqueueResumeScoreServiceV2 = async (
    resumeId: string,
    userId: string,
): Promise<{ jobId: string } | { status: 'embeddings_required' }> => {
    const embeddings = await getResumeEmbeddingsRepo(resumeId);

    if (!embeddings) {
        logger.info(`Embeddings not ready for scoring: ${resumeId}`);
        return { status: 'embeddings_required' };
    }

    return scoringRegistryV2.resumeScore.queue({
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
        emit
    })
}
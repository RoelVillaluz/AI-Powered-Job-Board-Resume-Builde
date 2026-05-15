import { Types }      from "mongoose";
import logger          from "../../utils/logger.js";
import { QueueJob }   from "../../types/queues.types.js";
import { EmitFn }     from "../../infrastructure/jobs/core/computeRegistryTypesV2.js";
import { salaryPredictionRegistry } from "../../infrastructure/jobs/domains/salary/salaryPredictionRegistry.js";
import { executeComputePipelineV2 }   from "../../infrastructure/jobs/core/executeComputePipelineV2.js";
import { getResumeSalaryPredictionRepo } from "../../repositories/resumes/resumeSalaryPredictionRepository.js";

const SALARY_TTL_DAYS = 30;


export const getResumeSalaryPredictionService = async (
    resumeId: string | Types.ObjectId,
) => {
    const prediction = await getResumeSalaryPredictionRepo(resumeId);

    if (prediction) {
        const daysSinceGeneration =
            (Date.now() - new Date(prediction.calculatedAt).getTime()) /
            (1000 * 60 * 60 * 24);

        if (daysSinceGeneration < SALARY_TTL_DAYS) {
            logger.info(`Cache hit for salary prediction: ${resumeId}`);
            return prediction;
        }
    }

    logger.info(`Cache miss for salary prediction: ${resumeId}`);
    return null;
};


export const enqueueResumeSalaryPredictionService = async (
    resumeId: string,
    userId:   string,
): Promise<{ jobId: string }> => {
    // No embedding check needed — buildResumeSalaryPredictionPayload
    // handles a missing embedding gracefully via null totalExperienceYears.
    // The prediction pipeline applies a confidence penalty and continues.
    return salaryPredictionRegistry.resumeSalaryPrediction.queue({
        id: resumeId,
        resumeId,
        userId,
    });
};


export const upsertResumeSalaryPredictionService = async (
    resumeId: string | Types.ObjectId,
    job:  QueueJob | null = null,
    emit?: EmitFn,
) => {
    const { salaryPredictionRegistry } = await import(
        "../../infrastructure/jobs/domains/salary/salaryPredictionRegistry.js"
    );

    return executeComputePipelineV2({
        config: salaryPredictionRegistry.resumeSalaryPrediction,
        id:     resumeId,
        job,
        emit,
    });
};
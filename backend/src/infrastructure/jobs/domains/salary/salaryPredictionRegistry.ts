import { Types }                from "mongoose";
import { ComputeConfigV2 }     from "../../core/computeRegistryTypesV2.js";
import { createQueueJobRunner } from "../../core/createQueueJobRunner.js";
import { salaryPredictionQueue } from "../../../../queues/index.js";
import { upsertResumeSalaryPredictionRepo } from "../../../../repositories/resumes/resumeSalaryPredictionRepository.js";

const isProd = process.env.NODE_ENV === "production";

export const salaryPredictionRegistry: Record<string, ComputeConfigV2<any, any>> = {
    resumeSalaryPrediction: {
        key:    "resume-salary-prediction",
        entity: "resume",

        queueName:   "salary-prediction",
        jobName:     "predict-salary",
        jobIdPrefix: "resume-salary",

        concurrency: isProd ? 5 : 2,
        priority:    3,
        dlqName:     "salary-prediction-dlq",

        fetcher: async (id) => {
            const { buildResumeSalaryPredictionPayload } = await import(
                "../../../../helpers/salary/buildSalaryPredictionPayload.js"
            );
            return buildResumeSalaryPredictionPayload(id as string);
        },

        aiEndpoint:         "predict_salary",
        skipEmbeddingCheck: true,

        buildPayload: async (aiResult: any, id: Types.ObjectId) => ({
            resume:               id,
            predictedYearly:      aiResult.predicted_yearly      ?? 0,
            predictedMonthly:     aiResult.predicted_monthly     ?? 0,
            rangeMin:             aiResult.range_min              ?? 0,
            rangeMax:             aiResult.range_max              ?? 0,
            confidenceScore:      aiResult.confidence_score       ?? 0,
            seniorityLevel:       aiResult.seniority_level        ?? null,
            totalExperienceYears: aiResult.total_experience_years ?? null,
            anchor:               aiResult.anchor                 ?? null,
            location:             aiResult.location               ?? null,
            experience:           aiResult.experience             ?? null,
            skillPremium:         aiResult.skill_premium          ?? null,
            calculatedAt:         new Date(),
        }),

        progressEvent: "salary",

        persist: async (id, payload) => {
            return upsertResumeSalaryPredictionRepo(id, payload);
        },

        queue: createQueueJobRunner({
            queue:       salaryPredictionQueue,
            jobName:     "predict-salary",
            jobIdPrefix: "resume-salary",
            attempts:    3,
            delay:       2000,
            timeout:     60000,
        }),

        afterSave: async (saved, emitSocket) => {
            emitSocket("salary:complete", {
                cached: false,
                data:   saved,
            });
        },
    },
};
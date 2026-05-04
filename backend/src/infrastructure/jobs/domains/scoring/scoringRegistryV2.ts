// src/infrastructure/jobs/domains/scoring/scoringRegistryV2.ts

import { Types }               from "mongoose";
import { ComputeConfigV2 }     from "../../core/computeRegistryTypesV2.js";
import { createQueueJobRunner } from "../../core/createQueueJobRunner.js";
import { resumeScoringQueue }  from "../../../../queues/index.js";
import { upsertResumeScoreRepo } from "../../../../repositories/resumes/resumeScoreRepository.js";

const isProd = process.env.NODE_ENV === "production";

export const scoringRegistryV2: Record<string, ComputeConfigV2<any, any>> = {

    // =========================================================================
    // RESUME SCORE
    // Uses score_resume FastAPI endpoint.
    // fetcher sends full resume so FastAPI never hits DB.
    // skipEmbeddingCheck = true — no embedding field on score documents.
    // buildPayload used instead of mapper — score response has custom shape.
    // afterSave emits score:complete to client via socket.
    // =========================================================================
    resumeScore: {
        key:    "resume-score",
        entity: "resume",

        queueName:   "resume-scoring",
        jobName:     "calculate-score",
        jobIdPrefix: "resume-score",
        concurrency: isProd ? 5 : 2,
        priority:    3,
        dlqName:     "resume-scoring-dlq",

        // Fetches full resume + total years metrics from embedding model
        fetcher: async (id) => {
            const { prepareResumeScoringFieldsRepo } = await import(
                "../../../../repositories/resumes/resumeRepository.js"
            );
            return prepareResumeScoringFieldsRepo(id as string);
        },

        aiEndpoint: "score_resume",

        // Bypass embedding validity check — score docs have no embedding field
        skipEmbeddingCheck: true,

        // Custom payload builder — score response shape differs from embedding shape
        buildPayload: (aiResult: any, id: Types.ObjectId) => ({
            resume:                   id,
            completenessScore:        aiResult.breakdown?.completeness        ?? 0,
            experienceScore:          aiResult.breakdown?.experience          ?? 0,
            skillsScore:              aiResult.breakdown?.skills              ?? 0,
            certificationScore:       aiResult.breakdown?.certifications      ?? 0,
            totalScore:               aiResult.overall_score                  ?? 0,
            estimatedExperienceYears: aiResult.total_experience_years         ?? 0,
            strengths:                aiResult.strengths                      ?? [],
            improvements:             aiResult.improvements                   ?? [],
            recommendations:          aiResult.recommendations                ?? [],
            overallMessage:           aiResult.overall_message                ?? "",
            calculatedAt:             new Date(),
        }),

        persist: async (id, payload) => {
            return upsertResumeScoreRepo(id, payload);
        },

        queue: createQueueJobRunner({
            queue:       resumeScoringQueue,
            jobName:     "calculate-score",
            jobIdPrefix: "resume-score",
            attempts:    3,
            delay:       2000,
            timeout:     60000,
        }),

        fallback: async (id, job = null, emit) => {
            const { executeComputePipelineV2 } = await import(
                "../../core/executeComputePipelineV2.js"
            );
            return executeComputePipelineV2({ entityKey: "resumeScore", id, job, emit });
        },

        afterSave: async (saved, emitSocket) => {
            emitSocket("score:complete", {
                cached: false,
                data:   saved,
            });
        },
    },
};
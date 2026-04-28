import { Types } from "mongoose";
import { createQueueJobRunner } from "../../core/createQueueJobRunner.js";
import { resumeScoringQueue } from "../../../../queues/index.js";
import {
    getResumeScoreRepo,
    upsertResumeScoreRepo
} from "../../../../repositories/resumes/resumeScoreRepository.js";
import { ComputeJobConfig } from "../../core/computeRegistryTypes.js";
import { PythonEmit } from "../../../../types/python.types.js";

const emitProgressOnly = (cb: (progress: number) => void): PythonEmit => {
    return (_event, data) => {
        cb(data.progress);
    };
};

export const scoringRegistry: Record<string, ComputeJobConfig<any, any>> = {
    resumeScore: {
        queueName: "resume-scoring",
        concurrency: 5,
        priority: 1,
        dlqName: "resume-scoring-dlq",

        queue: createQueueJobRunner({
            queue: resumeScoringQueue,
            jobName: "calculate-score",
            jobIdPrefix: "resume-score",
            attempts: 3,
            delay: 2000,
            timeout: 60000
        }),

        fallback: async (id, _invalidateCache, job, { emit = (() => {}) as PythonEmit } = {}) => {
            const { upsertResumeScoreService } = await import(
                '../../../../services/resumes/resumeScoreService.js'
            );
            return upsertResumeScoreService(
                new Types.ObjectId(id),
                job,
                emit,
            );
        },

        pythonScript: "score_resume",

        repo: {
            getExisting: getResumeScoreRepo,
            update: upsertResumeScoreRepo
        },

        buildPayload: (pythonResponse, id) => ({
            resume: id,
            completenessScore: pythonResponse.breakdown?.completeness || 0,
            experienceScore: pythonResponse.breakdown?.experience || 0,
            skillsScore: pythonResponse.breakdown?.skills || 0,
            certificationScore: pythonResponse.breakdown?.certifications || 0,
            totalScore: pythonResponse.overall_score || 0,
            estimatedExperienceYears:
                pythonResponse.total_experience_years || 0,
            strengths: pythonResponse.strengths || [],
            improvements: pythonResponse.improvements || [],
            recommendations: pythonResponse.recommendations || [],
            overallMessage: pythonResponse.overall_message || "",
            calculatedAt: new Date()
        }),

        afterSave: async (saved, _emit, emitSocket) => {
            emitSocket?.("score:complete", {
                cached: false,
                data: saved
            });
        },

        pythonArgsBuilder: (id: Types.ObjectId | string) => [
            id.toString()
        ]
    }
};
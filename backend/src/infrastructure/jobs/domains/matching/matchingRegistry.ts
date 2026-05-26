import { ComputeConfigV2 }      from "../../core/computeRegistryTypesV2.js";
import { createQueueJobRunner }  from "../../core/createQueueJobRunner.js";
import { matchingQueue }         from "../../../../queues/index.js";
import { upsertMatchResultRepo } from "../../../../repositories/resumes/resumeJobMatchRepository.js";

const isProd = process.env.NODE_ENV === "production";

export const matchingRegistry: Record<string, ComputeConfigV2<any, any>> = {
    resumeJobMatch: {
        key: "resume-job-match",
        entity: "resume",

        queueName: "resume-job-matching",
        jobName: "match-resume-jobs",
        jobIdPrefix: "resume-job-match",
        concurrency: isProd ? 3 : 1,
        priority: 4,
        dlqName: "resume-job-matching-dlq",

        skipEmbeddingCheck: true,
        progressEvent:      "matching",

        fetcher: async (id) => {
            const { buildMatchingPayload } = await import(
                "../../../../helpers/matching/buildMatchingPayload.js"
            );
            return buildMatchingPayload(id as string);
        },

        aiEndpoint: "score_matches",

        buildPayload: async (aiResult: any, id: any) => ({
            resume:        id,
            matches:       aiResult.matches     ?? [],
            usedPinecone:  aiResult.usedPinecone ?? false, 
            rankedAt:      new Date(),
        }),

        persist: async (id, payload) => {
            return upsertMatchResultRepo(id, payload);
        },

        queue: createQueueJobRunner({
            queue:       matchingQueue,
            jobName:     "match-resume-jobs",
            jobIdPrefix: "resume-job-match",
            attempts:    3,
            delay:       1000,
            timeout:     60000,
        }),

        afterSave: async (saved, emitSocket) => {
            emitSocket("matching:complete", {
                cached: false,
                data:   saved,
            });
        },
    }
}
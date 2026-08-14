import { ComputeConfigV2 }         from "../../core/computeRegistryTypesV2.js";
import { createQueueJobRunner }    from "../../core/createQueueJobRunner.js";
import { matchInsightQueue }       from "../../../../queues/index.js";
import { setMatchExplanationRepo } from "../../../../repositories/resumes/resumeJobMatchRepository.js";
import { peekPendingInsight, removePendingInsight } from "./pendingInsightStore.js";
import { clearInsightAbort } from "./insightAbortStore.js";

export const resumeMatchInsightRegistry: Record<string, ComputeConfigV2<any, any>> = {
    resumeMatchInsight: {
        key: "resume-match-insight",
        entity: "resume",

        queueName: "resume-match-insight",
        jobName: "generate-match-insight",
        jobIdPrefix: "resume-match-insight",
        concurrency: 1,
        priority: 6,
        dlqName: null,

        skipEmbeddingCheck: true,
        progressEvent:      "matchInsight",

        stream:      true,
        streamEvent: "matchInsight:chunk",

        fetcher: async (id) => {
            const resumeId = id.toString();
            const pending  = await peekPendingInsight(resumeId); // ← peek, not pop

            if (!pending) {
                throw new Error(
                    `No pending job insight request found for resume: ${resumeId} — Redis entry missing or expired`
                );
            }

            const { buildMatchInsightPayload } = await import(
                "../../../../helpers/matching/buildMatchInsightsPayload.js"
            );
            const payload = await buildMatchInsightPayload(resumeId, pending.jobId);
            if (!payload) return null;

            return { ...payload, jobId: pending.jobId };
        },

        aiEndpoint: "generate_match_insight",

        buildPayload: async (aiResult: any): Promise<{ jobId: string; explanation: string }> => ({
            jobId:       aiResult.jobId ?? "",
            explanation: aiResult.answer ?? "",
        }),

        persist: async (id, payload) => {
            const { jobId, explanation } = payload as { jobId: string; explanation: string };
            return setMatchExplanationRepo(id.toString(), jobId, explanation);
        },

        queue: createQueueJobRunner({
            queue:       matchInsightQueue,
            jobName:     "generate-match-insight",
            jobIdPrefix: "resume-match-insight",
            attempts:    2,
            delay:       500,
            timeout:     120000,
        }),

        afterSave: async (saved, emitSocket, meta) => {
            // Terminal success — safe to remove the head entry now.
            const resumeId = (saved as any)?.resume?.toString?.() ?? meta?.userId; // see note below
            if (resumeId) {
                await removePendingInsight(resumeId);
                clearInsightAbort(resumeId);
            }

            emitSocket("matchInsight:complete", {
                data: saved,
            });
        },

        onFinalFailure: async (job) => {
            const data      = (job.data ?? {}) as Record<string, any>;
            const resumeId  = data.id?.toString?.() ?? data.resumeId;
            if (resumeId) {
                await removePendingInsight(resumeId);
                clearInsightAbort(resumeId);
            }
        },
    },
};
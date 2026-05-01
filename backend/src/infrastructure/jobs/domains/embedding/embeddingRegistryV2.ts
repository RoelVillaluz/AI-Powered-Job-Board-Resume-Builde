import { createQueueJobRunner } from "../../core/createQueueJobRunner";
import { resumeEmbeddingQueue } from "../../../../queues/index.js";
import { prepareResumeEmbeddingFieldsRepo } from "../../../../repositories/resumes/resumeRepository";
import { ResumeEmbeddingsDocument } from "../../../../types/embeddings.types";
import { Types } from "mongoose";
import { mapResumeEmbeddingResult } from "../../../../mappers/embeddings/resumeEmbeddingMapper";
import { ComputeConfigV2 } from "../../core/computeRegistryTypesV2";

const isProd = process.env.NODE_ENV === "production";

export const embeddingRegistryV2: Record<string, ComputeConfigV2<any, any>> = {
    resume: {
        // ── identity ─────────────────────────────
        key: "resume",
        entity: "resume",

        // ── queue config ─────────────────────────
        queueName: "resume-embedding",
        jobName: "generate-embeddings",
        jobIdPrefix: "resume-embedding",

        concurrency: isProd ? 5 : 2,
        priority: 2,
        dlqName: null,

        // ── pipeline config ───────────────────────

        fetcher: prepareResumeEmbeddingFieldsRepo,
        aiEndpoint: "resume-embeddings",

        // AI → DB transformation layer
        mapper: mapResumeEmbeddingResult,

        // ── persistence ───────────────────────────
        persist: async (
            id: string | Types.ObjectId,
            payload: Partial<ResumeEmbeddingsDocument>
        ) => {
            const { upsertResumeEmbeddingRepo } = await import(
                "../../../../repositories/resumes/resumeEmbeddingRepository.js"
            );

            return upsertResumeEmbeddingRepo(id, payload);
        },

        // ── queue runner ──────────────────────────
        queue: createQueueJobRunner({
            queue: resumeEmbeddingQueue,
            jobName: "generate-embeddings",
            jobIdPrefix: "resume-embedding",
        }),

        // ── fallback = reuse SAME pipeline engine ─
        fallback: "pipeline",
    },
} as const;

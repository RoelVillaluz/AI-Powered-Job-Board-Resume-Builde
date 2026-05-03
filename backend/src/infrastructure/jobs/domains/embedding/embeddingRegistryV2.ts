// src/infrastructure/jobs/domains/embedding/embeddingRegistryV2.ts

import { Types } from "mongoose";
import { createQueueJobRunner } from "../../core/createQueueJobRunner.js";
import { ComputeConfigV2 } from "../../core/computeRegistryTypesV2.js";

import {
    resumeEmbeddingQueue,
    skillEmbeddingQueue,
    jobTitleEmbeddingQueue,
    locationEmbeddingQueue,
    industryEmbeddingQueue,
    skillEmbeddingDLQ,
    jobTitleEmbeddingDLQ,
    locationEmbeddingDLQ,
    industryEmbeddingDLQ,
} from "../../../../queues/index.js";

// ── Resume ────────────────────────────────────────────────────────────────────
import { MarketEmbeddingUpdate, ResumeEmbeddingsDocument } from "../../../../types/embeddings.types.js";
import { prepareResumeEmbeddingFieldsRepo } from "../../../../repositories/resumes/resumeRepository.js";
import { mapResumeEmbeddingResult } from "../../../../mappers/embeddings/resumeEmbeddingMapper.js";

// ── Market ────────────────────────────────────────────────────────────────────
import { prepareSkillEmbeddingComputationRepository }    from "../../../../repositories/market/skillRepositories.js";
import { prepareJobTitleEmbeddingComputationRepository } from "../../../../repositories/market/jobTitleRepositories.js";
import { prepareLocationEmbeddingComputationRepository } from "../../../../repositories/market/locationRepositories.js";
import { prepareIndustryEmbeddingComputationRepository } from "../../../../repositories/market/industryRepositories.js";

const isProd = process.env.NODE_ENV === "production";

// ── Shared market mapper ───────────────────────────────────────────────────────
// Market entities all return { embedding: number[] } from FastAPI.
// The field name in the DB document is always `embedding`.
const mapMarketEmbeddingResult = (aiResult: any) => ({
    embedding:            aiResult.embedding ?? [],
    embeddingGeneratedAt: new Date(),
});

// ── Shared market persist ─────────────────────────────────────────────────────
// Market entities store embedding as a field on the existing document.
// Always update, never create a separate model.
const makeMarketPersist = (repoName: string) =>
    async (id: string | Types.ObjectId, payload: Record<string, any>) => {
        const repo = await import(`../../../../repositories/market/${repoName}.js`);
        return repo.updateEmbeddingRepository(id, payload);
    };

export const embeddingRegistryV2: Record<string, ComputeConfigV2<any, any>> = {

    // =========================================================================
    // RESUME
    // Separate ResumeEmbeddings model — upsert pattern.
    // fetcher sends full resume fields so FastAPI never touches DB.
    // afterSave triggers scoring pipeline.
    // =========================================================================
    resume: {
        key:    "resume",
        entity: "resume",

        queueName:   "resume-embedding",
        jobName:     "generate-embeddings",
        jobIdPrefix: "resume-embedding",
        concurrency: isProd ? 5 : 2,
        priority:    2,
        dlqName:     null,

        fetcher:    prepareResumeEmbeddingFieldsRepo,
        aiEndpoint: "generate_resume_embeddings",
        mapper:     mapResumeEmbeddingResult,

        persist: async (id, payload) => {
            const { upsertResumeEmbeddingRepo } = await import(
                "../../../../repositories/resumes/resumeEmbeddingRepository.js"
            );
            return upsertResumeEmbeddingRepo(id, payload);
        },

        queue: createQueueJobRunner({
            queue:       resumeEmbeddingQueue,
            jobName:     "generate-embeddings",
            jobIdPrefix: "resume-embedding",
        }),

        fallback: async (id, job = null, emit) => {
            const { executeComputePipelineV2 } = await import(
                "../../core/executeComputePipelineV2.js"
            );
            return executeComputePipelineV2({ entityKey: "resume", id, job, emit });
        },
    } as ComputeConfigV2<ResumeEmbeddingsDocument, { resumeId: string; userId: string }>,

    // =========================================================================
    // SKILL
    // Embedding field on Skill document.
    // fetcher sends { _id, name } — FastAPI encodes name only.
    // =========================================================================
    skill: {
        key:    "skill",
        entity: "skill",

        queueName:   "skill-embedding",
        jobName:     "generate-embeddings",
        jobIdPrefix: "skill-embedding",
        concurrency: isProd ? 5 : 3,
        priority:    5,
        dlqName:     "skill-embedding-failed",

        fetcher:    prepareSkillEmbeddingComputationRepository,
        aiEndpoint: "generate_skill_embeddings",
        mapper:     mapMarketEmbeddingResult,

        persist: async (id, payload) => {
            const { updateSkillEmbeddingRepository } = await import(
                "../../../../repositories/market/skillRepositories.js"
            );
            return updateSkillEmbeddingRepository(id, payload as MarketEmbeddingUpdate);
        },

        queue: createQueueJobRunner({
            queue:       skillEmbeddingQueue,
            jobName:     "generate-embeddings",
            jobIdPrefix: "skill-embedding",
        }),

        fallback: async (id, job = null, emit) => {
            const { executeComputePipelineV2 } = await import(
                "../../core/executeComputePipelineV2.js"
            );
            return executeComputePipelineV2({ entityKey: "skill", id, job, emit });
        },
    } as ComputeConfigV2<any, { skillId: string }>,

    // =========================================================================
    // JOB TITLE
    // Embedding field on JobTitle document.
    // fetcher sends { _id, title } — FastAPI encodes normalizedTitle or title.
    // =========================================================================
    jobTitle: {
        key:    "jobTitle",
        entity: "jobTitle",

        queueName:   "job-title-embedding",
        jobName:     "generate-embeddings",
        jobIdPrefix: "job-title-embedding",
        concurrency: isProd ? 5 : 3,
        priority:    6,
        dlqName:     "job-title-embedding-failed",

        fetcher:    prepareJobTitleEmbeddingComputationRepository,
        aiEndpoint: "generate_job_title_embeddings",
        mapper:     mapMarketEmbeddingResult,

        persist: async (id, payload) => {
            const { updateJobTitleEmbeddingRepository } = await import(
                "../../../../repositories/market/jobTitleRepositories.js"
            );
            return updateJobTitleEmbeddingRepository(id, payload as MarketEmbeddingUpdate);
        },

        queue: createQueueJobRunner({
            queue:       jobTitleEmbeddingQueue,
            jobName:     "generate-embeddings",
            jobIdPrefix: "job-title-embedding",
        }),

        fallback: async (id, job = null, emit) => {
            const { executeComputePipelineV2 } = await import(
                "../../core/executeComputePipelineV2.js"
            );
            return executeComputePipelineV2({ entityKey: "jobTitle", id, job, emit });
        },
    } as ComputeConfigV2<any, { titleId: string }>,

    // =========================================================================
    // LOCATION
    // Embedding field on Location document.
    // fetcher sends { _id, name } — FastAPI encodes name only.
    // =========================================================================
    location: {
        key:    "location",
        entity: "location",

        queueName:   "location-embedding",
        jobName:     "generate-embeddings",
        jobIdPrefix: "location-embedding",
        concurrency: isProd ? 4 : 2,
        priority:    7,
        dlqName:     "location-embedding-failed",

        fetcher:    prepareLocationEmbeddingComputationRepository,
        aiEndpoint: "generate_location_embeddings",
        mapper:     mapMarketEmbeddingResult,

        persist: async (id, payload) => {
            const { updateLocationEmbeddingRepository } = await import(
                "../../../../repositories/market/locationRepositories.js"
            );
            return updateLocationEmbeddingRepository(id, payload as MarketEmbeddingUpdate);
        },

        queue: createQueueJobRunner({
            queue:       locationEmbeddingQueue,
            jobName:     "generate-embeddings",
            jobIdPrefix: "location-embedding",
        }),

        fallback: async (id, job = null, emit) => {
            const { executeComputePipelineV2 } = await import(
                "../../core/executeComputePipelineV2.js"
            );
            return executeComputePipelineV2({ entityKey: "location", id, job, emit });
        },
    } as ComputeConfigV2<any, { locationId: string }>,

    // =========================================================================
    // INDUSTRY
    // Embedding field on Industry document.
    // fetcher sends { _id, name } — FastAPI encodes name only.
    // =========================================================================
    industry: {
        key:    "industry",
        entity: "industry",

        queueName:   "industry-embedding",
        jobName:     "generate-embeddings",
        jobIdPrefix: "industry-embedding",
        concurrency: isProd ? 2 : 1,
        priority:    8,
        dlqName:     "industry-embedding-failed",

        fetcher:    prepareIndustryEmbeddingComputationRepository,
        aiEndpoint: "generate_industry_embeddings",
        mapper:     mapMarketEmbeddingResult,

        persist: async (id, payload) => {
            const { updateIndustryEmbeddingRepository } = await import(
                "../../../../repositories/market/industryRepositories.js"
            );
            return updateIndustryEmbeddingRepository(id, payload as MarketEmbeddingUpdate);
        },

        queue: createQueueJobRunner({
            queue:       industryEmbeddingQueue,
            jobName:     "generate-embeddings",
            jobIdPrefix: "industry-embedding",
        }),

        fallback: async (id, job = null, emit) => {
            const { executeComputePipelineV2 } = await import(
                "../../core/executeComputePipelineV2.js"
            );
            return executeComputePipelineV2({ entityKey: "industry", id, job, emit });
        },
    } as ComputeConfigV2<any, { industryId: string }>,
};
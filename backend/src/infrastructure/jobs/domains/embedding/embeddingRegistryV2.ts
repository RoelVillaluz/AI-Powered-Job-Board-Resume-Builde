import { Types } from "mongoose";
import { createQueueJobRunner } from "../../core/createQueueJobRunner.js";
import { ComputeConfigV2 } from "../../core/computeRegistryTypesV2.js";
import logger from "../../../../utils/logger.js";

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

import { MarketEmbeddingUpdate, ResumeEmbeddingsDocument } from "../../../../types/embeddings.types.js";
import { prepareResumeEmbeddingFieldsRepo } from "../../../../repositories/resumes/resumeRepository.js";
import { mapResumeEmbeddingResult } from "../../../../mappers/embeddings/resumeEmbeddingMapper.js";
import { prepareSkillEmbeddingComputationRepository }    from "../../../../repositories/market/skillRepositories.js";
import { prepareJobTitleEmbeddingComputationRepository } from "../../../../repositories/market/jobTitleRepositories.js";
import { prepareLocationEmbeddingComputationRepository } from "../../../../repositories/market/locationRepositories.js";
import { prepareIndustryEmbeddingComputationRepository } from "../../../../repositories/market/industryRepositories.js";

const isProd = process.env.NODE_ENV === "production";

const mapMarketEmbeddingResult = (aiResult: any) => ({
    embedding:            aiResult.embedding ?? [],
    embeddingGeneratedAt: new Date(),
});

export const embeddingRegistryV2: Record<string, ComputeConfigV2<any, any>> = {

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
        afterSave: async (saved, emitSocket, ctx) => {
            logger.info(`[REGISTRY V2] Triggering resume score: ${saved.resume}`);
            if (!ctx.userId) {
                logger.warn(`[REGISTRY V2] No userId in ctx — skipping score enqueue`);
                return;
            }
            const { enqueueResumeScoreServiceV2 } = await import(
                '../../../../services/resumes/resumeScoreServiceV2.js'
            );
            await enqueueResumeScoreServiceV2(
                saved.resume.toString(),
                ctx.userId,
            );
        },
    } as ComputeConfigV2<ResumeEmbeddingsDocument, { resumeId: string; userId: string }>,

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
    } as ComputeConfigV2<any, { skillId: string }>,

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
    } as ComputeConfigV2<any, { titleId: string }>,

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
    } as ComputeConfigV2<any, { locationId: string }>,

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
    } as ComputeConfigV2<any, { industryId: string }>,
};
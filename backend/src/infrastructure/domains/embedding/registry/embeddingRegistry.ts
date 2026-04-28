import { Types } from "mongoose";
import { createEmbeddingQueueRunner } from "../core/createEmbeddingQueueRunner.js";
import {
    resumeEmbeddingQueue,
    skillEmbeddingQueue,
    jobTitleEmbeddingQueue,
    locationEmbeddingQueue,
    industryEmbeddingQueue,
    jobEmbeddingQueue,
} from "../../../../queues/index.js";
import { EmbeddingEntityConfig } from "./embeddingRegistry.types.js";

// ─── Resume ───────────────────────────────────────────────────────────────────
import { JobPostingEmbeddingsDocument, MarketEmbeddingUpdate, ResumeEmbeddingsDocument } from "../../../../types/embeddings.types.js";
import {
    getResumeEmbeddingsRepo,
    createResumeEmbeddingRepo,
    updateResumeEmbeddingRepo,
} from "../../../../repositories/resumes/resumeEmbeddingRepository.js";
import { upsertResumeEmbedding } from "../../../../services/resumes/resumeEmbeddingService.js";
import { generateResumeScoreService } from "../../../../services/resumes/resumeScoreService.js";

// ─── Skill ────────────────────────────────────────────────────────────────────
import { SkillDocument } from "../../../../models/market/skillModel.js";
import {
    getSkillEmbeddingRepository,
    updateSkillEmbeddingRepository,
} from "../../../../repositories/market/skillRepositories.js";
import { upsertSkillEmbeddingService } from "../../../../services/market/skillService.js";

// ─── JobTitle ─────────────────────────────────────────────────────────────────
import { JobTitleEmbeddingData } from "../../../../types/jobTitle.types.js";
import {
    getJobTitleEmbeddingsByIdRepository,
    updateJobTitleEmbeddingRepository,
} from "../../../../repositories/market/jobTitleRepositories.js";
import { upsertJobTitleEmbeddingService } from "../../../../services/market/jobTitleService.js";

// ─── Location ─────────────────────────────────────────────────────────────────
import { LocationEmbeddingData } from "../../../../types/location.types.js";
import {
    getLocationEmbeddingByIdRepository,
    updateLocationEmbeddingRepository,
} from "../../../../repositories/market/locationRepositories.js";
import { upsertLocationEmbeddingService } from "../../../../services/market/locationService.js";

// ─── Industry ─────────────────────────────────────────────────────────────────
import { IndustryEmbeddingData } from "../../../../types/industry.types.js";
import {
    getIndustryEmbeddingByIdRepository,
    updateIndustryEmbeddingRepository,
} from "../../../../repositories/market/industryRepositories.js";
import { upsertIndustryEmbeddingService } from "../../../../services/market/industryService.js";

import logger from "../../../../utils/logger.js";
import { QueueJob } from "../../../../types/queues.types.js";
import { createJobEmbeddingRepo, getJobEmbeddingRepo, updateJobEmbeddingRepo } from "../../../../repositories/jobPostings/jobEmbeddingRepositories.js";
import { getJobPostingEmbeddingService, upsertJobPostingEmbeddingService } from "../../../../services/jobPostings/jobPostingEmbeddingService.js";
import { PythonEmit } from "../../../../types/python.types.js";

const isProd = process.env.NODE_ENV === 'production';

const emitProgressOnly = (cb: (progress: number) => void): PythonEmit => {
    return (_event, data) => {
        cb(data.progress);
    };
};

/**
 * Single source of truth for all embedding entity configurations.
 *
 * Each entry owns:
 *   Worker deployment  — queueName, concurrency, priority, dlqName
 *   Pipeline behaviour — queue, fallback, pythonScript, repo, buildPayload, afterSave
 *
 * Persistence strategy is signalled by repo.create:
 *   Absent  → market entities (skill, jobTitle, location, industry)
 *             Embedding is a field on the existing document. Always update.
 *   Present → resume
 *             ResumeEmbeddings is a separate model. getExisting → create or update.
 *
 * To add a new entity:
 *   1. Add an entry here.
 *   2. Export its Queue + DLQ from queues/index.ts.
 *   3. Add it to queueMap + dlqMap in workerRegistry.ts.
 */
export const embeddingRegistry: Record<string, EmbeddingEntityConfig<any, any>> = {

    // =========================================================================
    // RESUME
    // Separate ResumeEmbeddings model — needs create + update.
    // afterSave triggers resume scoring once embeddings are persisted.
    // dlqName is null — resume pipeline has its own error handling.
    // =========================================================================
    resume: {
        queueName:   'resume-embedding',
        concurrency: isProd ? 5 : 2,
        priority:    2,
        dlqName:     null,

        queue: createEmbeddingQueueRunner({
            queue:       resumeEmbeddingQueue,
            jobName:     'generate-embeddings',
            jobIdPrefix: 'resume-embedding',
        }),

        fallback: async (
            id: Types.ObjectId | string,
            _invalidateCache: boolean,
            job: QueueJob | null,
            { emit = (() => {}) as PythonEmit }: { emit?: PythonEmit } = {},
        ) => {
            return upsertResumeEmbedding(id, job, emit);
        },

        pythonScript: 'generate_resume_embeddings',

        // create is present — resume embeddings live in a separate model
        repo: {
            getExisting: getResumeEmbeddingsRepo,
            create:      createResumeEmbeddingRepo,
            update:      updateResumeEmbeddingRepo,
        },

        buildPayload: (pythonResponse, id) => ({
            resume:         id,
            embeddings:     pythonResponse.embeddings     ?? {},
            meanEmbeddings: pythonResponse.meanEmbeddings ?? {},
            metrics:        pythonResponse.metrics        ?? { totalExperienceYears: 0 },
            generatedAt:    new Date(),
        }),

        afterSave: async (saved, _emit, emitSocket) => {
            logger.info(`[REGISTRY] Triggering resume score calculation: ${saved.resume}`);
            // emitSocket is (event, data) => void — matches what generateResumeScoreService expects
            await generateResumeScoreService(saved.resume.toString(), null, emitSocket);
        },

    } as EmbeddingEntityConfig<ResumeEmbeddingsDocument, { resumeId: string; userId: string }>,

    // jobPosting: {
    //     queueName:   'job-embedding',
    //     concurrency: isProd ? 5 : 3,
    //     priority:    3,
    //     dlqName:     'job-dlq',

    //     queue: createEmbeddingQueueRunner({
    //         queue:       jobEmbeddingQueue,
    //         jobName:     'generate-embeddings',
    //         jobIdPrefix: 'job-embedding',
    //     }),

    //     fallback: async (
    //         id: Types.ObjectId | string,
    //         _invalidateCache: boolean,
    //         job: QueueJob | null,
    //         { emit = () => {} } = {},
    //     ) => {
    //         return upsertJobPostingEmbeddingService(id, true, job, emit);
    //     },

    //     pythonScript: 'generate_job_embeddings',

    //     // create is present — JobEmbedding is a separate model referenced by jobPosting
    //     repo: {
    //         getExisting: getJobEmbeddingRepo,     
    //         create:      createJobEmbeddingRepo,
    //         update:      updateJobEmbeddingRepo,
    //     },

    //     buildPayload: (pythonResponse, id) => ({
    //         jobPosting:     id,
    //         embeddings:     pythonResponse.embeddings     ?? {},
    //         meanEmbeddings: pythonResponse.meanEmbeddings ?? {},
    //         generatedAt:    new Date(),
    //     }),

    // } as EmbeddingEntityConfig<JobPostingEmbeddingsDocument, { jobPostingId: string }>,

    // =========================================================================
    // SKILL
    // Embedding is a field on the Skill document — update only, no create.
    // Re-queued when skill.name changes (name is what gets encoded).
    // =========================================================================
    skill: {
        queueName:   'skill-embedding',
        concurrency: isProd ? 5 : 3,
        priority:    5,
        dlqName:     'skill-embedding-failed',

        queue: createEmbeddingQueueRunner({
            queue:       skillEmbeddingQueue,
            jobName:     'generate-embeddings',
            jobIdPrefix: 'skill-embedding',
        }),

       fallback: async (id, _invalidateCache, job, { emit = () => {} } = {}) => {
            const adaptedEmit = emitProgressOnly(emit as any);
            return upsertSkillEmbeddingService(
                new Types.ObjectId(id),
                true,
                job,
                adaptedEmit
            );
        },

        pythonScript: 'generate_skill_embeddings',

        // create absent — embedding field lives on the existing Skill document
        repo: {
            getExisting: getSkillEmbeddingRepository,
            update:      updateSkillEmbeddingRepository,
        },

        buildPayload: (pythonResponse, _id) => ({
            embedding:            pythonResponse.embedding ?? [],
            embeddingGeneratedAt: new Date(),
        } satisfies MarketEmbeddingUpdate),

    } as EmbeddingEntityConfig<SkillDocument, { skillId: string }>,

    // =========================================================================
    // JOB TITLE
    // Embedding is a field on the JobTitle document — update only, no create.
    // Re-queued when title or normalizedTitle changes.
    // Encodes normalizedTitle so aliases ("Sr. Engineer" / "Senior Engineer")
    // map to the same vector.
    // =========================================================================
    jobTitle: {
        queueName:   'job-title-embedding',
        concurrency: isProd ? 5 : 3,
        priority:    6,
        dlqName:     'job-title-embedding-failed',

        queue: createEmbeddingQueueRunner({
            queue:       jobTitleEmbeddingQueue,
            jobName:     'generate-embeddings',
            jobIdPrefix: 'job-title-embedding',
        }),

        fallback: async (id, _invalidateCache, job, { emit = () => {} } = {}) => {
            const adaptedEmit = emitProgressOnly(emit as any);
            return upsertJobTitleEmbeddingService(
                new Types.ObjectId(id),
                true,
                job,
                adaptedEmit
            );
        },

        pythonScript: 'generate_job_title_embeddings',

        // create absent — embedding field lives on the existing JobTitle document
        repo: {
            getExisting: getJobTitleEmbeddingsByIdRepository,
            update:      updateJobTitleEmbeddingRepository,
        },

        buildPayload: (pythonResponse, _id) => ({
            embedding:            pythonResponse.embedding ?? [],
            embeddingGeneratedAt: new Date(),
        } satisfies MarketEmbeddingUpdate),

    } as EmbeddingEntityConfig<JobTitleEmbeddingData, { titleId: string }>,

    // =========================================================================
    // LOCATION
    // Embedding is a field on the Location document — update only, no create.
    // Re-queued when location.name changes (name is what gets encoded).
    // =========================================================================
    location: {
        queueName:   'location-embedding',
        concurrency: isProd ? 4 : 2,
        priority:    7,
        dlqName:     'location-embedding-failed',

        queue: createEmbeddingQueueRunner({
            queue:       locationEmbeddingQueue,
            jobName:     'generate-embeddings',
            jobIdPrefix: 'location-embedding',
        }),

        fallback: async (id, _invalidateCache, job, { emit = () => {} } = {}) => {
            const adaptedEmit = emitProgressOnly(emit as any);
            return upsertLocationEmbeddingService(
                new Types.ObjectId(id),
                true,
                job,
                adaptedEmit
            );
        },

        pythonScript: 'generate_location_embeddings',

        // create absent — embedding field lives on the existing Location document
        repo: {
            getExisting: getLocationEmbeddingByIdRepository,
            update:      updateLocationEmbeddingRepository,
        },

        buildPayload: (pythonResponse, _id) => ({
            embedding:            pythonResponse.embedding ?? [],
            embeddingGeneratedAt: new Date(),
        } satisfies MarketEmbeddingUpdate),

    } as EmbeddingEntityConfig<LocationEmbeddingData, { locationId: string }>,

    // =========================================================================
    // INDUSTRY
    // Embedding is a field on the Industry document — update only, no create.
    // Re-queued when industry.name changes (name is what gets encoded).
    // =========================================================================
    industry: {
        queueName:   'industry-embedding',
        concurrency: isProd ? 2 : 1,
        priority:    8,
        dlqName:     'industry-embedding-failed',

        queue: createEmbeddingQueueRunner({
            queue:       industryEmbeddingQueue,
            jobName:     'generate-embeddings',
            jobIdPrefix: 'industry-embedding',
        }),

        fallback: async (id, _invalidateCache, job, { emit = () => {} } = {}) => {
            const adaptedEmit = emitProgressOnly(emit as any);
            return upsertIndustryEmbeddingService(
                new Types.ObjectId(id),
                true,
                job,
                adaptedEmit
            );
        },

        pythonScript: 'generate_industry_embeddings',

        // create absent — embedding field lives on the existing Industry document
        repo: {
            getExisting: getIndustryEmbeddingByIdRepository,
            update:      updateIndustryEmbeddingRepository,
        },

        buildPayload: (pythonResponse, _id) => ({
            embedding:            pythonResponse.embedding ?? [],
            embeddingGeneratedAt: new Date(),
        } satisfies MarketEmbeddingUpdate),

    } as EmbeddingEntityConfig<IndustryEmbeddingData, { industryId: string }>,
};
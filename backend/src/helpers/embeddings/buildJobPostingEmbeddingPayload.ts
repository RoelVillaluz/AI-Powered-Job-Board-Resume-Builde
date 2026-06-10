import { Types } from "mongoose";

import { prepareJobPostingEmbeddingFieldsRepo } from "../../repositories/jobPostings/jobPostingRepositories.js";

import logger from "../../utils/logger.js";
import { resolveSkillDocs, resolveMarketDoc } from "../payloadHelpers.js";
import { getJobTitleEmbeddingsByIdRepository, getJobTitleEmbeddingByNameRepository } from "../../repositories/market/jobTitleRepositories.js";
import { getLocationEmbeddingByIdRepository, getLocationEmbeddingByNameRepository } from "../../repositories/market/locationRepositories.js";
import { MarketDoc } from "../../types/embeddings.types.js";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface JobPostingEmbeddingPayload {
    job: Record<string, any>;

    skillDocs: MarketDoc[];

    jobTitleDoc: MarketDoc | null;

    locationDoc: MarketDoc | null;
}

// ── Builder ───────────────────────────────────────────────────────────────────
export const buildJobPostingEmbeddingPayload = async (
    jobPostingId: string | Types.ObjectId,
): Promise<JobPostingEmbeddingPayload | null> => {

    // 1. Job Posting
    const job =
        await prepareJobPostingEmbeddingFieldsRepo(
            jobPostingId as string
        ) as Record<string, any> | null;

    if (!job) {
        logger.error(
            `[buildJobPostingEmbeddingPayload] Job posting not found: ${jobPostingId}`
        );

        return null;
    }

    const [skillDocs, jobTitleDoc, locationDoc] = await Promise.all([
        resolveSkillDocs(job.skills ?? [], 'buildJobEmbeddingPayload.skills'),
        resolveMarketDoc(job.jobTitle, {
            idRepo:    getJobTitleEmbeddingsByIdRepository,
            nameRepo:  getJobTitleEmbeddingByNameRepository,
            nameField: 'title',
            context:   'buildjobEmbeddingPayload.jobTitle',
        }),
        resolveMarketDoc(job.location, {
            idRepo:    getLocationEmbeddingByIdRepository,
            nameRepo:  getLocationEmbeddingByNameRepository,
            nameField: 'name',
            context:   'buildJobEmbeddingPayload.location',
        }),
    ]);

    // 5. Return
    return {
        job,
        skillDocs,
        jobTitleDoc,
        locationDoc,
    };
};
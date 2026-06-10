/**
 * Helper: buildResumeEmbeddingPayload
 *
 * Fetches all data the Python embedding pipeline needs and assembles it
 * into a single payload. Pure data assembly — no business logic.
 *
 * Lives in helpers/ because it has no service-level concerns (no caching,
 * no orchestration). Called by the embedding worker before the AI client call.
 *
 * Python payload shape:
 *   skillDocs:                { _id, name, embedding | null }[]
 *   jobTitleDoc:              { _id, name, embedding | null } | null
 *   locationDoc:              { _id, name, embedding | null } | null
 *   workExperienceTitleDocs:  { _id, name, embedding | null }[]
 */

import { Types } from "mongoose";
import { prepareResumeEmbeddingFieldsRepo } from "../../repositories/resumes/resumeRepository.js";
import logger from "../../utils/logger.js";
import { MarketDoc } from "../../types/embeddings.types.js";
import { getJobTitleEmbeddingByNameRepository, getJobTitleEmbeddingsByBulkIdRepository, getJobTitleEmbeddingsByIdRepository } from "../../repositories/market/jobTitleRepositories.js";
import { getLocationEmbeddingByIdRepository, getLocationEmbeddingByNameRepository } from "../../repositories/market/locationRepositories.js";
import { resolveMarketDoc, resolveSkillDocs, resolveWorkExperienceDoc } from "../payloadHelpers.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResumeEmbeddingPayload {
    resume:                  Record<string, any>;
    skillDocs:               MarketDoc[];
    jobTitleDoc:             MarketDoc | null;
    locationDoc:             MarketDoc | null;
    workExperienceTitleDocs: MarketDoc[];
}

// ── Builder ───────────────────────────────────────────────────────────────────

export const buildResumeEmbeddingPayload = async (
    resumeId: string | Types.ObjectId,
): Promise<ResumeEmbeddingPayload | null> => {

    // 1. Resume — reuse existing repo
    const resume = await prepareResumeEmbeddingFieldsRepo(resumeId as string) as Record<string, any> | null;
    if (!resume) {
        logger.error(`[buildResumeEmbeddingPayload] Resume not found: ${resumeId}`);
        return null;
    }

    // 2. Fetch skills, job title, location, and work experience job titles in parallel
    const [skillDocs, jobTitleDoc, locationDoc, workExperienceTitleDocs] = await Promise.all([
        resolveSkillDocs(resume.skills ?? [], 'buildResumeEmbeddingPayload.skills'),
        resolveMarketDoc(resume.jobTitle, {
            idRepo:    getJobTitleEmbeddingsByIdRepository,
            nameRepo:  getJobTitleEmbeddingByNameRepository,
            nameField: 'title',
            context:   'buildResumeEmbeddingPayload.jobTitle',
        }),
        resolveMarketDoc(resume.location, {
            idRepo:    getLocationEmbeddingByIdRepository,
            nameRepo:  getLocationEmbeddingByNameRepository,
            nameField: 'name',
            context:   'buildResumeEmbeddingPayload.location',
        }),
        resolveWorkExperienceDoc(resume.workExperience, 'buildResumeEmbeddingPayload.workExperience'),
    ]);

    // 3. Return
    return {
        resume,
        skillDocs,
        jobTitleDoc,
        locationDoc,
        workExperienceTitleDocs,
    };
};
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
import JobTitle  from "../../models/market/jobTitleModel.js";
import Skill     from "../../models/market/skillModel.js";
import Location  from "../../models/market/locationModel.js";
import { prepareResumeEmbeddingFieldsRepo } from "../../repositories/resumes/resumeRepository.js";
import logger from "../../utils/logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketDoc {
    _id:       Types.ObjectId;
    name:      string;
    embedding: number[] | null;
}

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

    // 2. Skill docs — fetch from Skill collection by name (resume.skills are
    //    embedded subdocs with no ref to the Skill collection _id)
    const skillNames: string[] = (resume.skills ?? [])
        .map((s: any) => s.name)
        .filter(Boolean);

    const skillMarketDocs = skillNames.length
        ? await Skill.find(
              { name: { $in: skillNames } },
              { _id: 1, name: 1, embedding: 1 }
          ).lean()
        : [];

    // Build name → { _id, embedding } map for O(1) lookup
    const skillMarketMap = new Map<string, { _id: Types.ObjectId; embedding: number[] | null }>(
        skillMarketDocs.map(d => [
            (d.name as string).toLowerCase(),
            { _id: d._id as Types.ObjectId, embedding: (d as any).embedding ?? null },
        ])
    );

    // skillDocs uses Skill collection _id + name — not the resume subdoc _id
    const skillDocs: MarketDoc[] = skillNames
        .map(name => {
            const market = skillMarketMap.get(name.toLowerCase());
            if (!market) return null;   // skill not in our Skill collection — skip
            return {
                _id:       market._id,
                name,
                embedding: market.embedding,
            };
        })
        .filter((d): d is MarketDoc => d !== null);

    // 3. Job title doc — embedding field from JobTitle model
    const jobTitleRef = resume.jobTitle as any;
    let jobTitleDoc: MarketDoc | null = null;

    if (jobTitleRef?._id) {
        const jobTitle = await JobTitle
            .findById(jobTitleRef._id)
            .select('_id title embedding')
            .lean();

        if (jobTitle) {
            jobTitleDoc = {
                _id:       jobTitle._id as Types.ObjectId,
                name:      jobTitle.title as string,   // JobTitle uses 'title', Python expects 'name'
                embedding: (jobTitle as any).embedding ?? null,
            };
        }
    }

    // 4. Location doc — embedding field from Location model
    const locationRef = resume.location as any;
    let locationDoc: MarketDoc | null = null;

    if (locationRef?._id) {
        const location = await Location
            .findById(locationRef._id)
            .select('_id name embedding')
            .lean();

        if (location) {
            locationDoc = {
                _id:       location._id as Types.ObjectId,
                name:      location.name as string,
                embedding: (location as any).embedding ?? null,
            };
        }
    }

    // 5. Work experience title docs — batch fetch from JobTitle model
    const workExpTitleRefs = (resume.workExperience ?? [])
        .map((e: any) => e.jobTitle)
        .filter(Boolean);

    const workExpTitleIds = workExpTitleRefs
        .map((t: any) => t._id)
        .filter(Boolean);

    const workExpTitleMarketDocs = workExpTitleIds.length
        ? await JobTitle.find(
              { _id: { $in: workExpTitleIds } },
              { _id: 1, title: 1, embedding: 1 }   // JobTitle uses 'title'
          ).lean()
        : [];

    const workExpEmbeddingMap = new Map<string, { title: string; embedding: number[] | null }>(
        workExpTitleMarketDocs.map(d => [
            d._id.toString(),
            { title: d.title as string, embedding: (d as any).embedding ?? null },
        ])
    );

    const workExperienceTitleDocs: MarketDoc[] = workExpTitleRefs
        .map((t: any) => {
            const market = workExpEmbeddingMap.get(t._id?.toString());
            if (!market) return null;
            return {
                _id:       t._id,
                name:      market.title,   // map 'title' → 'name' for Python
                embedding: market.embedding,
            };
        })
        .filter((d): d is MarketDoc => d !== null);

    // 6. Return
    return {
        resume,
        skillDocs,
        jobTitleDoc,
        locationDoc,
        workExperienceTitleDocs,
    };
};
import { Types } from "mongoose";

import Skill from "../../models/market/skillModel.js";
import JobTitle from "../../models/market/jobTitleModel.js";
import Location from "../../models/market/locationModel.js";

import { prepareJobPostingEmbeddingFieldsRepo } from "../../repositories/jobPostings/jobPostingRepositories.js";

import logger from "../../utils/logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketDoc {
    _id: Types.ObjectId;
    name: string;
    embedding: number[] | null;
}

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

    // 2. Skill docs
    const skillNames: string[] = (job.skills ?? [])
        .map((s: any) => {
            if (typeof s === "string") return s;
            return s?.name;
        })
        .filter(Boolean);

    const skillMarketDocs = skillNames.length
        ? await Skill.find(
              { name: { $in: skillNames } },
              { _id: 1, name: 1, embedding: 1 }
          ).lean()
        : [];

    const skillMarketMap = new Map<
        string,
        {
            _id: Types.ObjectId;
            embedding: number[] | null;
        }
    >(
        skillMarketDocs.map(d => [
            (d.name as string).toLowerCase(),
            {
                _id: d._id as Types.ObjectId,
                embedding: (d as any).embedding ?? null,
            },
        ])
    );

    const skillDocs: MarketDoc[] = skillNames
        .map(name => {
            const market = skillMarketMap.get(name.toLowerCase());

            if (!market) return null;

            return {
                _id: market._id,
                name,
                embedding: market.embedding,
            };
        })
        .filter((d): d is MarketDoc => d !== null);

    // 3. Job title doc
    const titleRef = job.title as any;

    let jobTitleDoc: MarketDoc | null = null;

    if (titleRef?._id) {

        const jobTitle = await JobTitle
            .findById(titleRef._id)
            .select("_id title embedding")
            .lean();

        if (jobTitle) {

            jobTitleDoc = {
                _id: jobTitle._id as Types.ObjectId,

                // Python expects `name`
                name: jobTitle.title as string,

                embedding: (jobTitle as any).embedding ?? null,
            };
        }
    }

    // 4. Location doc
    const locationRef = job.location as any;

    let locationDoc: MarketDoc | null = null;

    if (locationRef?._id) {

        const location = await Location
            .findById(locationRef._id)
            .select("_id name embedding")
            .lean();

        if (location) {

            locationDoc = {
                _id: location._id as Types.ObjectId,
                name: location.name as string,
                embedding: (location as any).embedding ?? null,
            };
        }
    }

    // 5. Return
    return {
        job,
        skillDocs,
        jobTitleDoc,
        locationDoc,
    };
};
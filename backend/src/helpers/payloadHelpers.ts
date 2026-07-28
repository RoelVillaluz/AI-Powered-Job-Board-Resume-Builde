import { Types } from "mongoose";
import logger from "../utils/logger.js";
import { MarketDoc } from "../types/embeddings.types";
import { getJobTitleEmbeddingByNameRepository, getJobTitleEmbeddingsByBulkNameRepository } from "../repositories/market/jobTitleRepositories.js";
import { getSkillEmbeddingsByBulkNameRepository } from "../repositories/market/skillRepositories.js";

interface ResolveMarketDocOptions {
    idRepo?: (
        id: Types.ObjectId,
    ) => Promise<Record<string, any> | null>;

    nameRepo?: (
        name: string,
    ) => Promise<Record<string, any> | null>;

    /**
     * Field containing the display name on the market document.
     * Examples:
     * - "title" for JobTitle
     * - "name" for Location
     */
    nameField: string;

    /**
     * Context used in log messages.
     */
    context: string;
}

/**
 * Resolves a market entity (JobTitle, Location, Skill, etc.) into a
 * normalized MarketDoc shape used by the embedding pipeline.
 *
 * Resolution order:
 * 1. Lookup by `_id` if present and `idRepo` is provided.
 * 2. Fallback to lookup by `name` if present and `nameRepo` is provided.
 *
 * Logs fallback matches and missing market records automatically.
 *
 * @param ref - Reference object containing an optional `_id` and/or `name`.
 * @param options - Repository functions and mapping configuration.
 *
 * @returns Normalized MarketDoc if found, otherwise null.
 *
 * @example
 * const jobTitleDoc = await resolveMarketDoc(
 *   resume.jobTitle,
 *   {
 *     idRepo: getJobTitleEmbeddingsByIdRepository,
 *     nameRepo: getJobTitleEmbeddingByNameRepository,
 *     nameField: "title",
 *     context: "buildResumeEmbeddingPayload.jobTitle",
 *   }
 * );
 */
export const resolveMarketDoc = async (
    ref: { _id?: Types.ObjectId; name?: string } | null | undefined,
    options: ResolveMarketDocOptions,
): Promise<MarketDoc | null> => {
    if (!ref) return null;

    const { idRepo, nameRepo, nameField, context } = options;

    const toMarketDoc = (
        doc: Record<string, any>,
    ): MarketDoc => ({
        _id: doc._id as Types.ObjectId,
        name: doc[nameField] as string,
        embedding: doc.embedding ?? null,
    });

    if (ref._id && idRepo) {
        const doc = await idRepo(ref._id);
        if (doc) return toMarketDoc(doc);
    }

    if (ref.name && nameRepo) {
        const doc = await nameRepo(ref.name);

        if (doc) {
            logger.info(
                `[${context}] fallback matched: "${ref.name}"`,
            );

            return toMarketDoc(doc);
        }

        logger.warn(
            `[${context}] not found in market: "${ref.name}"`,
        );
    }

    return null;
};

export const resolveSkillDocs = async (
    skills: Array<{ name?: string; [key: string]: any }>,
    context: string,
): Promise<MarketDoc[]> => {
    if (!skills || skills.length === 0) {
        logger.error(`[${context}] skills are empty`);
        return [];
    }

    // 1. Extract skill names
    const skillNames: string[] = (skills ?? [])
        .map((s: any) => s.name)
        .filter(Boolean);

    return getSkillEmbeddingsByBulkNameRepository(skillNames);
};

export const resolveWorkExperienceDoc = async (
    workExperienceList: Array<{ jobTitle?: string; [key: string]: any }>,
    context: string,
): Promise<MarketDoc[]> => {
    if (!workExperienceList?.length) {
        logger.warn(`[${context}] workExperienceList is empty`);
        return [];
    }

    // 1. Extract job titles
    const jobTitles = workExperienceList
        .map(e => e.jobTitle)
        .filter((t): t is string => typeof t === 'string' && t.length > 0);

    if (!jobTitles.length) {
        logger.warn(`[${context}] no job titles found`);
        return [];
    }

    // 2. DEDUPLICATE (critical improvement)
    const uniqueJobTitles = [...new Set(jobTitles)];

    // 3. SINGLE batch DB call using $in (BEST case optimization)
    const docs = await getJobTitleEmbeddingsByBulkNameRepository(
        uniqueJobTitles
    );

    // 4. Normalize into map
    const docMap = new Map(
        docs.map((d: any) => [
            d.title.toLowerCase(),
            {
                _id: d._id as Types.ObjectId,
                name: d.title as string,
                embedding: (d as any).embedding ?? null,
            } as MarketDoc,
        ])
    );

    // 5. Optional fallback ONLY for missing items (still deduped)
    const missing = uniqueJobTitles.filter(
        name => !docMap.has(name.toLowerCase())
    );

    if (missing.length) {
        const fallbackDocs = await Promise.all(
            missing.map(name =>
                getJobTitleEmbeddingByNameRepository(name)
            )
        );

        fallbackDocs.forEach(doc => {
            if (!doc) return;

            docMap.set(doc.title.toLowerCase(), {
                _id: doc._id as Types.ObjectId,
                name: doc.title,
                embedding: (doc as any).embedding ?? null,
            });
        });
    }

    // 6. Reconstruct original order (important for embeddings consistency)
    return jobTitles
        .map(name => docMap.get(name.toLowerCase()) ?? null)
        .filter((d): d is MarketDoc => d !== null);
};
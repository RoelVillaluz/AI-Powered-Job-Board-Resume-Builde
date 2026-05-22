import { Types }       from "mongoose";
import Resume          from "../../models/resumes/resumeModel.js";
import ResumeEmbedding from "../../models/resumes/resumeEmbeddingsModel.js";
import { getSkillsByBulkNameRepository }  from "../../repositories/market/skillRepositories.js";
import logger          from "../../utils/logger.js";
import { queryJobsForResume, JobQueryFilters } from "../../infrastructure/pinecone/pineconeQuery.js";
import { fallbackMongoJobQuery }               from "../../infrastructure/pinecone/pineconeFallback.js";
import { shouldUsePinecone }                   from "../../infrastructure/pinecone/pineconeThreshold.js";
import { SkillMarketEntry }                    from "../scoring/buildScoringPayload.js";

export interface MatchingPayload {
    resume:          Record<string, any>;
    jobMatches:      any[];
    skillMarketData: SkillMarketEntry[];
    usedPinecone:    boolean;
}

export const buildMatchingPayload = async (
    resumeId: string | Types.ObjectId,
): Promise<MatchingPayload | null> => {

    const resume = await Resume.findById(resumeId).lean();
    if (!resume) {
        logger.error(`[buildMatchingPayload] Resume not found: ${resumeId}`);
        return null;
    }

    const resumeEmbedding = await ResumeEmbedding
        .findOne({ resume: resumeId })
        .lean();

    if (!resumeEmbedding) {
        logger.error(`[buildMatchingPayload] ResumeEmbedding not found: ${resumeId}`);
        return null;
    }

    const resumeSkillNames: string[] = (resume.skills ?? [])
        .map((s: any) => s?.name)
        .filter((n): n is string => Boolean(n));

    // ── Skill market data — reuses same repo as buildScoringPayload ───────────
    let skillMarketData: SkillMarketEntry[] = [];
    if (resumeSkillNames.length > 0) {
        const skillDocs = await getSkillsByBulkNameRepository(resumeSkillNames).lean();
        skillMarketData = skillDocs.map(s => ({
            name:                s.name                as string ?? '',
            demandScore:         (s as any).demandScore         ?? 0,
            growthRate:          (s as any).growthRate          ?? 0,
            seniorityMultiplier: (s as any).seniorityMultiplier ?? 1.0,
        }));
    }

    // ── Pinecone retrieval ────────────────────────────────────────────────────
    const filters: JobQueryFilters = {
        experienceLevel:      (resume as any).experienceLevel ?? undefined,
        totalExperienceYears: resumeEmbedding.metrics?.totalExperienceYears,
        jobType:              undefined,
    };

    let jobMatches:   any[] = [];
    let usedPinecone        = false;

    try {
        if (await shouldUsePinecone()) {
            jobMatches   = await queryJobsForResume(resumeEmbedding as any, filters, 20);
            usedPinecone = true;
            logger.info(
                `[buildMatchingPayload] Pinecone: ${jobMatches.length} candidates for resume: ${resumeId}`
            );
        } else {
            jobMatches = await fallbackMongoJobQuery(
                resumeSkillNames,
                (resume as any).experienceLevel ?? '',
                undefined,
                20,
            );
            logger.info(
                `[buildMatchingPayload] Fallback: ${jobMatches.length} candidates for resume: ${resumeId}`
            );
        }
    } catch (err) {
        logger.error(`[buildMatchingPayload] Pinecone failed — using MongoDB fallback`, err);
        jobMatches = await fallbackMongoJobQuery(
            resumeSkillNames,
            (resume as any).experienceLevel ?? '',
            undefined,
            20,
        );
    }

    if (jobMatches.length === 0) {
        logger.warn(`[buildMatchingPayload] No candidates found for resume: ${resumeId}`);
    }

    return {
        resume:       resume as Record<string, any>,
        jobMatches,
        skillMarketData,
        usedPinecone,
    };
};
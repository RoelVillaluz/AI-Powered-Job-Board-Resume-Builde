import { Types } from "mongoose";
import JobTitle from "../../models/market/jobTitleModel.js";
import Industry from "../../models/market/industryModel.js";
import Skill    from "../../models/market/skillModel.js";
import Location from "../../models/market/locationModel.js";
import { prepareResumeSalaryPredictionRepo } from "../../repositories/resumes/resumeRepository.js";
import logger from "../../utils/logger.js";

export interface ResumeSalaryPredictionPayload {
    seniority_level:        string;
    total_experience_years: number | null;
    job_title_data:         Record<string, any> | null;
    industry_data:          Record<string, any> | null;
    location_data:          Record<string, any> | null;
    skill_market_data:      Record<string, any>[] | null;
}

export const buildResumeSalaryPredictionPayload = async (
    resumeId: Types.ObjectId | string
): Promise<ResumeSalaryPredictionPayload | null> => {

    // ── Step 1: Resume + embedding metrics ───────────────────────────────
    const result = await prepareResumeSalaryPredictionRepo(resumeId);

    if (!result) return null;

    const { resume, metrics } = result;

    // ── Step 2: Resolve IDs for dependent lookups ─────────────────────────
    const jobTitleId = (resume.jobTitle as any)?._id   ?? null;
    const locationId = (resume.location as any)?._id   ?? null;
    const skillNames = (resume.skills ?? [])
        .map((s: any) => s.name)
        .filter(Boolean) as string[];

    // ── Step 3: Resolve industry lookup strategy ──────────────────────────
    const industryRef = (resume.jobTitle as any)?.industry ?? null;

    const industryQuery = industryRef
        ? Types.ObjectId.isValid(industryRef)
            ? Industry.findById(industryRef)
                .select('salaryBenchmarks')
                .lean()
            : Industry.findOne({ name: industryRef })
                .select('salaryBenchmarks')
                .lean()
        : null;

    // ── Step 4: Market data in parallel ───────────────────────────────────
    const [jobTitleDoc, industryDoc, locationDoc, skillDocs] = await Promise.all([
        jobTitleId
            ? JobTitle.findById(jobTitleId)
                .select('salaryData seniorityLevel industry')
                .lean()
            : null,

        industryQuery,   // ← already handles both ObjectId and string

        locationId
            ? Location.findById(locationId)
                .select('name baselineFactor costOfLivingIndex')
                .lean()
            : null,

        skillNames.length > 0
            ? Skill.find({ name: { $in: skillNames } })
                .select('name demandScore growthRate seniorityMultiplier')
                .lean()
            : [],
    ]);

    // ── Step 5: Resolve seniority level ───────────────────────────────────
    // seniorityLevel lives on the JobTitle document.
    // Falls back to 'Mid-Level' when unavailable — the prediction pipeline
    // will still produce a result, just with the default profile applied.
    const seniority_level: string =
        (jobTitleDoc as any)?.seniorityLevel ?? "Mid-Level";

    // ── Step 6: Shape the payload ─────────────────────────────────────────

    // job_title_data — salaryData subset only; currency must be included
    const job_title_data = (jobTitleDoc as any)?.salaryData
        ? { salaryData: (jobTitleDoc as any).salaryData }
        : null;

    // industry_data — salaryBenchmarks subset only
    const industry_data = (industryDoc as any)?.salaryBenchmarks
        ? { salaryBenchmarks: (industryDoc as any).salaryBenchmarks }
        : null;

    // location_data — flat shape LocationFactorApplicator expects
    const location_data = locationDoc
        ? {
            name:              (locationDoc as any).name,
            baselineFactor:    (locationDoc as any).baselineFactor    ?? null,
            costOfLivingIndex: (locationDoc as any).costOfLivingIndex ?? null,
            salaryData:        (locationDoc as any).salaryData        ?? null
          }
        : null;

    // skill_market_data — flat array SkillPremium expects
    const skill_market_data = (skillDocs as any[]).length > 0
        ? (skillDocs as any[]).map(s => ({
            name:                s.name,
            demandScore:         s.demandScore         ?? 0,
            growthRate:          s.growthRate          ?? 0,
            seniorityMultiplier: s.seniorityMultiplier ?? 1.0,
          }))
        : null;

    // total_experience_years — null-safe: embedding may not exist yet on
    // first run (race condition with embedding generation).
    // The Python experience step degrades gracefully when this is null.
    const total_experience_years = metrics?.totalExperienceYears ?? null;

    logger.info(
        `[buildResumeSalaryPredictionPayload] resumeId=${resumeId} ` +
        `seniority=${seniority_level} ` +
        `experience=${total_experience_years ?? "null (embedding pending)"} ` +
        `skills=${skillDocs.length} ` +
        `anchor=${job_title_data ? "job_title" : industry_data ? "industry" : "none"}`
    );

    return {
        seniority_level,
        total_experience_years,
        job_title_data,
        industry_data,
        location_data,
        skill_market_data,
    };
};
// ─────────────────────────────────────────────────────────────────────────────
// buildResumeSalaryPredictionPayload.ts  (updated)
//
// Changes from previous version
// ──────────────────────────────
// 1. JobTitle query now selects 'topSkills' in addition to existing fields.
//    Required for SkillTitleAlignment to measure skill-title overlap.
//    Without this, alignment defaults to neutral (blend_weight=1.0) and
//    the ML Engineer / mismatched-title bug persists.
//
// 2. job_title_data now includes topSkills array shaped for Python:
//    { skillName: string, importance: string }[]
//
// 3. skill_market_data entries now include 'level' from the resume's
//    skills array, merged by name lookup against the fetched Skill docs.
//    Without this, SkillPremium.score_skill() falls back to Beginner for
//    every skill and level differentiation never fires.
//
// Everything else is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { Types } from "mongoose";
import JobTitle  from "../../models/market/jobTitleModel.js";
import Industry  from "../../models/market/industryModel.js";
import Skill     from "../../models/market/skillModel.js";
import Location  from "../../models/market/locationModel.js";
import { prepareResumeSalaryPredictionRepo } from "../../repositories/resumes/resumeRepository.js";
import logger from "../../utils/logger.js";

export interface ResumeSalaryPredictionPayload {
    seniority_level:        string;
    resume_score:           number | null;
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
    const { resume, metrics, totalScore } = result;

    // ── Step 2: Resolve IDs for dependent lookups ─────────────────────────
    const jobTitleId = (resume.jobTitle as any)?._id ?? null;
    const locationId = (resume.location as any)?._id ?? null;
    const skillNames = (resume.skills ?? [])
        .map((s: any) => s.name)
        .filter(Boolean) as string[];

    // ── Step 3: Resolve industry lookup strategy ──────────────────────────
    const industryRef = (resume.jobTitle as any)?.industry ?? null;
    const industryQuery = industryRef
        ? Types.ObjectId.isValid(industryRef)
            ? Industry.findById(industryRef).select("salaryBenchmarks").lean()
            : Industry.findOne({ name: industryRef }).select("salaryBenchmarks").lean()
        : null;

    // ── Step 4: Market data in parallel ───────────────────────────────────
    const [jobTitleDoc, industryDoc, locationDoc, skillDocs] = await Promise.all([
        jobTitleId
            ? JobTitle.findById(jobTitleId)
                // ↓ topSkills added — required for SkillTitleAlignment
                .select("salaryData seniorityLevel industry topSkills")
                .lean()
            : null,

        industryQuery,

        locationId
            ? Location.findById(locationId)
                .select("name baselineFactor costOfLivingIndex salaryData")
                .lean()
            : null,

        skillNames.length > 0
            ? Skill.find({ name: { $in: skillNames } })
                .select("name demandScore growthRate seniorityMultiplier")
                .lean()
            : [],
    ]);

    // ── Step 5: Resolve seniority level ───────────────────────────────────
    const seniority_level: string =
        (jobTitleDoc as any)?.seniorityLevel ?? "Mid-Level";

    // ── Step 6: Build resume skill level map ──────────────────────────────
    // Maps skill name (lowercased) → candidate's self-reported proficiency.
    // Used to attach 'level' to each skill_market_data entry so Python's
    // SkillPremium.score_skill() can apply the level_weight multiplier.
    // Without this merge, every skill defaults to Beginner regardless of
    // what the candidate actually selected on their resume.
    const resumeSkillLevelMap = new Map<string, string>(
        (resume.skills ?? []).map((s: any) => [
            (s.name as string).toLowerCase(),
            (s.level as string) ?? "Beginner",
        ])
    );

    // ── Step 7: Shape the payload ─────────────────────────────────────────

    // job_title_data — salaryData + topSkills
    // topSkills shaped as { skillName, importance } for SkillTitleAlignment
    const rawTopSkills = (jobTitleDoc as any)?.topSkills ?? [];
    const job_title_data = (jobTitleDoc as any)?.salaryData
        ? {
            salaryData: (jobTitleDoc as any).salaryData,
            // ↓ new — provides skill requirements for alignment check
            topSkills: rawTopSkills.map((s: any) => ({
                skillName:  s.skillName  ?? "",
                importance: s.importance ?? "Preferred",
            })),
          }
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
            salaryData:        (locationDoc as any).salaryData        ?? null,
          }
        : null;

    // skill_market_data — flat array with 'level' merged from resume
    // ↓ level field added — required for SkillPremium level_weight to fire
    const skill_market_data = (skillDocs as any[]).length > 0
        ? (skillDocs as any[]).map(s => ({
            name:                s.name,
            demandScore:         s.demandScore         ?? 0,
            growthRate:          s.growthRate          ?? 0,
            seniorityMultiplier: s.seniorityMultiplier ?? 1.0,
            // Merge candidate's self-reported proficiency level.
            // Falls back to "Beginner" when the skill isn't on the resume
            // or the level field is missing.
            level: resumeSkillLevelMap.get(s.name.toLowerCase()) ?? "Beginner",
          }))
        : null;

    const total_experience_years = metrics?.totalExperienceYears ?? null;

    logger.info(
        `[buildResumeSalaryPredictionPayload] resumeId=${resumeId} ` +
        `seniority=${seniority_level} ` +
        `experience=${total_experience_years ?? "null (embedding pending)"} ` +
        `skills=${skillDocs.length} ` +
        `topSkills=${rawTopSkills.length} ` +
        `anchor=${job_title_data ? "job_title" : industry_data ? "industry" : "none"}`
    );

    return {
        seniority_level,
        resume_score: totalScore,
        total_experience_years,
        job_title_data,
        industry_data,
        location_data,
        skill_market_data,
    };
};
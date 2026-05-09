/**
 * Helper: buildScoringPayload
 *
 * Fetches all data the Python scoring service needs and assembles it into
 * a single ScoringPayload. Pure data assembly — no business logic.
 *
 * Lives in helpers/ because it has no service-level concerns (no caching,
 * no orchestration). Called by resumeScoreService before the AI client call.
 */

import { Types } from "mongoose";
import JobTitle  from "../../models/market/jobTitleModel.js";
import Skill     from "../../models/market/skillModel.js";
import { prepareResumeScoringFieldsRepo } from "../../repositories/resumes/resumeRepository.js";
import logger from "../../utils/logger.js";

// ── Resume shape returned by prepareResumeScoringFieldsRepo ───────────────────
// Resume.findById().lean() + embedding.metrics.totalExperienceYears merged in

interface ResumeScoringFields {
    _id:                  Types.ObjectId;
    jobTitle:             { _id?: Types.ObjectId; name: string } | null;
    firstName:            string;
    lastName:             string;
    email?:               string;
    phone?:               string;
    summary?:             string;
    skills:               Array<{ _id?: Types.ObjectId; name: string; level?: string }>;
    workExperience:       Array<{
        jobTitle?:         string;
        company?:          string;
        startDate?:        Date;
        endDate?:          Date;
        responsibilities?: string[];
    }>;
    certifications:       Array<{ name?: string; year?: string }>;
    totalExperienceYears: number | null;  // from embedding.metrics, null if not yet generated
}

// ── Payload types sent to Python ──────────────────────────────────────────────

export interface TopSkillEntry {
    skillName:  string;
    frequency:  number;
    importance: "Required" | "Preferred" | "Nice-to-Have";
}

export interface CurrentTitlePayload {
    title:          string;
    medianSalary:   number;
    seniorityLevel: string;
    topSkills:      TopSkillEntry[];
}

export interface HigherPayingTitlePayload {
    title:        string;
    medianSalary: number;
    topSkills:    TopSkillEntry[];
}

export interface SkillMarketEntry {
    name:                string;
    demandScore:         number;
    growthRate:          number;
    seniorityMultiplier: number;
}

export interface ScoringPayload {
    resume:               ResumeScoringFields;
    resumeSkills:         string[];
    currentTitle:         CurrentTitlePayload | null;
    higherPayingTitles:   HigherPayingTitlePayload[];
    skillMarketData:      SkillMarketEntry[];
    totalExperienceYears: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// A title must pay at least 15% more than the current title to count as
// a career progression signal. Matches the Python scoring formula.
const HIGHER_PAYING_THRESHOLD = 1.15;

// ── Builder ───────────────────────────────────────────────────────────────────

export const buildScoringPayload = async (
    resumeId: string | Types.ObjectId,
): Promise<ScoringPayload | null> => {

    // 1. Resume + pre-computed experience years from embedding metrics
    const resume = await prepareResumeScoringFieldsRepo(resumeId as string) as ResumeScoringFields | null;
    if (!resume) {
        logger.error(`[buildScoringPayload] Resume not found: ${resumeId}`);
        return null;
    }

    const totalExperienceYears = resume.totalExperienceYears ?? 0;
    if (resume.totalExperienceYears == null) {
        logger.warn(
            `[buildScoringPayload] totalExperienceYears missing for resume: ${resumeId}. ` +
            `Using 0 — ensure embeddings are generated first.`
        );
    }

    const resumeSkillNames = resume.skills
        .map(s => s?.name)
        .filter((n): n is string => Boolean(n));

    const targetJobTitle = resume.jobTitle?.name ?? "";

    // 2. Current job title + topSkills
    const currentTitleDoc = targetJobTitle
        ? await JobTitle.findOne(
              { title: targetJobTitle },
              { title: 1, seniorityLevel: 1, "salaryData.medianSalary": 1,
                topSkills: 1, industry: 1, normalizedTitle: 1 }
          ).lean()
        : null;

    const currentTitle: CurrentTitlePayload | null = currentTitleDoc
        ? {
              title:          currentTitleDoc.title as string,
              medianSalary:   (currentTitleDoc.salaryData as any)?.medianSalary ?? 0,
              seniorityLevel: currentTitleDoc.seniorityLevel as string,
              topSkills: ((currentTitleDoc.topSkills as any[]) ?? []).map(ts => ({
                  skillName:  ts.skillName  as string,
                  frequency:  ts.frequency  as number,
                  importance: ts.importance as TopSkillEntry["importance"],
              })),
          }
        : null;

    // 3. Higher-paying titles in the same industry (career progression signal)
    let higherPayingTitles: HigherPayingTitlePayload[] = [];

    if (currentTitleDoc && currentTitle && currentTitle.medianSalary > 0) {
        const salaryThreshold = currentTitle.medianSalary * HIGHER_PAYING_THRESHOLD;

        const higherTitleDocs = await JobTitle.find(
            {
                industry:                  (currentTitleDoc as any).industry,
                normalizedTitle:           { $ne: currentTitleDoc.normalizedTitle },
                isActive:                  true,
                "salaryData.medianSalary": { $gt: salaryThreshold },
            },
            { title: 1, "salaryData.medianSalary": 1, topSkills: 1 }
        ).lean();

        higherPayingTitles = higherTitleDocs.map(t => ({
            title:        t.title as string,
            medianSalary: (t.salaryData as any)?.medianSalary ?? 0,
            topSkills: ((t.topSkills as any[]) ?? []).map(ts => ({
                skillName:  ts.skillName  as string,
                frequency:  ts.frequency  as number,
                importance: ts.importance as TopSkillEntry["importance"],
            })),
        }));

        logger.info(
            `[buildScoringPayload] ${higherPayingTitles.length} higher-paying titles ` +
            `found for "${targetJobTitle}"`
        );
    }

    // 4. Market data for skills on this resume only
    let skillMarketData: SkillMarketEntry[] = [];

    if (resumeSkillNames.length > 0) {
        const skillDocs = await Skill.find(
            { name: { $in: resumeSkillNames } },
            { name: 1, demandScore: 1, growthRate: 1, seniorityMultiplier: 1 }
        ).lean();

        skillMarketData = skillDocs.map(s => ({
            name:                s.name as string,
            demandScore:         (s as any).demandScore         ?? 0,
            growthRate:          (s as any).growthRate          ?? 0,
            seniorityMultiplier: (s as any).seniorityMultiplier ?? 1.0,
        }));
    }

    return {
        resume,
        resumeSkills:         resumeSkillNames,
        currentTitle,
        higherPayingTitles,
        skillMarketData,
        totalExperienceYears,
    };
};
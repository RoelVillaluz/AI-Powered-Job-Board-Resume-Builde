import { Types } from "mongoose";
import { prepareResumeScoringFieldsRepo }  from "../../repositories/resumes/resumeRepository.js";
import { getSkillsByBulkNameRepository }   from "../../repositories/market/skillRepositories.js";
import {
    getJobTitleForScoringRepository,
    getHigherPayingTitlesRepository,
} from "../../repositories/market/jobTitleRepositories.js";
import logger from "../../utils/logger.js";

// ── Types ─────────────────────────────────────────────────────────────────────

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
    totalExperienceYears: number | null;
}

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

const HIGHER_PAYING_THRESHOLD = 1.15;

// ── Shared mappers ────────────────────────────────────────────────────────────

const mapTopSkills = (topSkills: any[]): TopSkillEntry[] =>
    (topSkills ?? []).map(ts => ({
        skillName:  ts.skillName  as string,
        frequency:  ts.frequency  as number,
        importance: ts.importance as TopSkillEntry["importance"],
    }));

const mapSkillMarketData = (skillDocs: any[]): SkillMarketEntry[] =>
    skillDocs.map(s => ({
        name:                s.name                ?? '',
        demandScore:         s.demandScore         ?? 0,
        growthRate:          s.growthRate          ?? 0,
        seniorityMultiplier: s.seniorityMultiplier ?? 1.0,
    }));

// ── Builder ───────────────────────────────────────────────────────────────────

export const buildScoringPayload = async (
    resumeId: string | Types.ObjectId,
): Promise<ScoringPayload | null> => {

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

    // ── Current title ─────────────────────────────────────────────────────────
    const currentTitleDoc = targetJobTitle
        ? await getJobTitleForScoringRepository(targetJobTitle)
        : null;

    const currentTitle: CurrentTitlePayload | null = currentTitleDoc
        ? {
              title:          currentTitleDoc.title as string,
              medianSalary:   (currentTitleDoc.salaryData as any)?.medianSalary ?? 0,
              seniorityLevel: currentTitleDoc.seniorityLevel as string,
              topSkills:      mapTopSkills((currentTitleDoc.topSkills as any[]) ?? []),
          }
        : null;

    // ── Higher-paying titles ──────────────────────────────────────────────────
    let higherPayingTitles: HigherPayingTitlePayload[] = [];

    if (currentTitleDoc && currentTitle && currentTitle.medianSalary > 0) {
        const salaryThreshold = currentTitle.medianSalary * HIGHER_PAYING_THRESHOLD;

        const higherTitleDocs = await getHigherPayingTitlesRepository(
            (currentTitleDoc as any).industry,
            currentTitleDoc.normalizedTitle as string,
            salaryThreshold,
        );

        higherPayingTitles = higherTitleDocs.map(t => ({
            title:        t.title as string,
            medianSalary: (t.salaryData as any)?.medianSalary ?? 0,
            topSkills:    mapTopSkills((t.topSkills as any[]) ?? []),
        }));

        logger.info(
            `[buildScoringPayload] ${higherPayingTitles.length} higher-paying titles ` +
            `found for "${targetJobTitle}"`
        );
    }

    // ── Skill market data ─────────────────────────────────────────────────────
    let skillMarketData: SkillMarketEntry[] = [];

    if (resumeSkillNames.length > 0) {
        const skillDocs = await getSkillsByBulkNameRepository(resumeSkillNames).lean();
        skillMarketData = mapSkillMarketData(skillDocs);
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
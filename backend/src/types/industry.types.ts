// types/industry.types.ts
import { Types } from "mongoose";
import { INDUSTRY_NAMES, SENIORITY_LEVELS } from "../../../shared/constants/jobsAndIndustries/constants";
import { Currency, SalaryBySeniority } from "./salaryTypes.js";
import { EmbeddingVector } from "./embeddings.types.js";

export type IndustryName = typeof INDUSTRY_NAMES[number];
export type CompetitionLevel = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type SeniorityLevel = typeof SENIORITY_LEVELS[number];

export interface MarketMetrics {
    totalCompanies: number;
    activeJobPostings: number;
    monthlyJobGrowth: number;
    competitionLevel: CompetitionLevel;
}

export interface SalaryByRole {
    jobTitle: string;
    median: number;
    average: number;
    sampleSize: number;
}

export interface SalaryBenchmarks {
    overallMedian: number;
    byRole: SalaryByRole[];
    bySeniority: SalaryBySeniority;
    salaryGrowthRate: number;
    lastUpdated: Date;
}

export interface IndustrySkill {
    skill: Types.ObjectId;
    skillName?: string;
    demandPercentage: number;
    averageSalaryPremium: number;
    growthRate: number;
}

export interface IndustryJobTitle {
    jobTitle: Types.ObjectId;
    titleName?: string;
    postingCount: number;
    percentage: number;
    medianSalary: number;
}

export interface EmergingSkill {
    skill: string;
    growthRate: number;
    adoptionPercentage: number;
}

export interface DecliningSkill {
    skill: string;
    declineRate: number;
    currentPercentage: number;
}

export interface IndustryInterface {
    _id?: Types.ObjectId;
    name: IndustryName;
    parentIndustry?: Types.ObjectId;
    aliases: string[];
    description?: string;
    marketMetrics: MarketMetrics;
    salaryBenchmarks: SalaryBenchmarks;
    topSkills: IndustrySkill[];
    topJobTitles: IndustryJobTitle[];
    emergingSkills: EmergingSkill[];
    decliningSkills: DecliningSkill[];
    dataQuality: number;
    embedding: EmbeddingVector | null;
    lastAnalyzed: Date;
    createdAt?: Date;
    updatedAt?: Date;
    embeddingGeneratedAt?: Date;
}

export interface CreateIndustryPayload {
    name: string
    description?: string;
    aliases?: string[];
}

export interface UpdateIndustryPayload {
    name: string
    description?: string;
    aliases?: string[];
}

export interface IndustryEmbeddingData {
    _id: Types.ObjectId;
    name: string;
    embedding: EmbeddingVector | null;
    embeddingGeneratedAt?: Date | null;
}
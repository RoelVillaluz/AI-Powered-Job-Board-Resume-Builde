// types/jobTitle.types.ts
import { Types } from "mongoose";
import { INDUSTRY_NAMES } from "../../shared/constants/jobsAndIndustries/constants";
import { Currency, SalaryBySeniority, SalaryRange } from "./salaryTypes";
import { SeniorityLevel } from "./industry.types";
import { Embedding } from "./embeddings.types";


type SalaryData = {
    averageSalary: number;
    medianSalary: number;
    salaryRange: SalaryRange;
    bySeniority: SalaryBySeniority;
    currency: Currency;
    lastCalculated: Date;
}

type DemandMetrics = {
    totalPostings: number;
    monthlyGrowth: number;
    demandScore: number;
    competitionRatio: number;
    lastUpdated: Date;
}

type TrendData = {
    isGrowing: boolean;
    growthRate: number;
}

type TopSkill = {
    skill: Types.ObjectId;
    skillName: string;
    frequency: number;
    importance: 'required' | 'preferred' | 'nice-to-have';
}

type CommonIndustry = {
    industry: Types.ObjectId;
    industryName: string;
    percentage: number;
}

type CommonEducation = {
    degree: 'High School' | 'Associate' | 'Bachelor' | 'Master' | 'PhD' | 'None Required';
    percentage: number;
}

type ExperienceDistribution = {
    '0-2': number;
    '3-5': number;
    '6-10': number;
    '10+': number;
}

type SimilarJob = {
    jobTitle: Types.ObjectId;
    titleName: string;
    similarityScore: number;
    medianSalary: number;
}

export interface JobTitleInterface {
    _id: Types.ObjectId,
    title: string;
    normalizedTitle: string;
    similarJobs: SimilarJob[];
    aliases: string[];
    industry: typeof INDUSTRY_NAMES[number];
    seniorityLevel: SeniorityLevel;
    demandMetrics: DemandMetrics;
    salaryData: SalaryData;
    topSkills: TopSkill[];
    commonIndustries: CommonIndustry[];
    commonEducation: CommonEducation[];
    experienceDistribution: ExperienceDistribution;
    trendData: TrendData;
    embedding: Embedding | null;
    isActive: boolean;
    lastAnalyzed: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateJobTitlePayload {
    title: string;
    normalizedTitle?: string;
    industry: typeof INDUSTRY_NAMES[number];
    seniorityLevel: SeniorityLevel;
    aliases?: string[];
}

export interface UpdateJobTitlePayload {
    title?: string;
    normalizedTitle?: string;
    aliases?: string[];
    isActive?: boolean;
}
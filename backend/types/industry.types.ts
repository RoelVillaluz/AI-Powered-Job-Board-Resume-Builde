import { Types } from "mongoose"; // Import Types from mongoose to use Types.ObjectId
import { COMPETITION_LEVELS, DEGREE_TYPES, INDUSTRY_CHOICES, JOB_STATUS, JOB_TYPES, SENIORITY_LEVELS, SKILL_IMPORTANCE_LEVELS } from "../../shared/constants/jobsAndIndustries/constants";

/**
 * ENUMS
 */
export type IndustryName = keyof typeof INDUSTRY_CHOICES;
export type SeniorityLevel = typeof SENIORITY_LEVELS[number];
export type CompetitionLevel = typeof COMPETITION_LEVELS[number];
export type SkillImportance = typeof SKILL_IMPORTANCE_LEVELS[number];
export type DegreeType = typeof DEGREE_TYPES[number];
export type JobType = typeof JOB_TYPES[number];
export type JobStatus = typeof JOB_STATUS[number];

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

export interface SalaryBySeniorityLevel {
  median: number;
  average: number;
}

export interface SalaryBySeniority {
  Entry?: SalaryBySeniorityLevel;
  "Mid-Level"?: SalaryBySeniorityLevel;
  Senior?: SalaryBySeniorityLevel;
  Executive?: SalaryBySeniorityLevel;
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

// Main Industry Interface
export interface Industry {
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
  lastAnalyzed: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
import { Types } from "mongoose";

export type SeniorityLevel = 'Intern' | 'Entry' | 'Mid-Level' | 'Senior';
export type SkillImportance = 'required' | 'preferred' | 'nice-to-have';
export type Currency = '$' | '₱' | '€' | '¥' | '£';

export interface SalaryRange {
  min: number;
  max: number;
  p25: number;
  p75: number;
}

export interface SalaryBySeniority {
  Entry: { avg: number; median: number };
  'Mid-Level': { avg: number; median: number };
  Senior: { avg: number; median: number };
}

export interface SalaryData {
  averageSalary: number;
  medianSalary: number;
  salaryRange: SalaryRange;
  bySeniority: SalaryBySeniority;
  currency: Currency;
  lastCalculated: Date;
}

export interface TopSkill {
  skill: Types.ObjectId;
  skillName: string;
  frequency: number;
  importance: SkillImportance;
}

export interface IndustryAssociation {
  industry: Types.ObjectId;
  industryName: string;
  percentage: number;
}

export interface EducationRequirement {
  degree: 'High School' | 'Associate' | 'Bachelor' | 'Master' | 'PhD' | 'None Required';
  percentage: number;
}

export interface TrendData {
  isGrowing: boolean;
  growthRate: number;
}

export interface JobTitle {
  title: string;
  normalizedTitle: string;
  aliases: string[];
  seniorityLevel: SeniorityLevel;
  demandMetrics: {
    totalPostings: number;
    monthlyGrowth: number;
    demandScore: number;
    competitionRatio: number;
    lastUpdated: Date;
  };
  salaryData: SalaryData;
  topSkills: TopSkill[];
  commonIndustries: IndustryAssociation[];
  commonEducation: EducationRequirement[];
  experienceDistribution: { '0-2': number; '3-5': number; '6-10': number; '10+': number };
  trendData: TrendData;
  isActive: boolean;
  lastAnalyzed: Date;
}
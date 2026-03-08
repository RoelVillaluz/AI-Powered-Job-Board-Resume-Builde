import { Types } from "mongoose";

export type SkillType = 'technical' | 'soft';

export interface SalaryRange {
  min: number;
  max: number;
}

export interface SkillSalaryData {
  averageSalary: number;
  medianSalary: number;
  salaryRange: SalaryRange;
  lastCalculated: Date;
}

export interface Skill {
  name: string;
  type?: SkillType;
  demandScore: number;       // 0-100
  growthRate: number;        // % growth -100 to 100
  seniorityMultiplier: number; // 0.5 to 3
  salaryData: SkillSalaryData;
  lastUpdated: Date;
}
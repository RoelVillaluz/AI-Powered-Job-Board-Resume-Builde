import { Types } from "mongoose";
import { Embedding } from "./embeddings.types";
import { Currency } from "./salaryTypes";

type SalaryRange = {
  min: number;
  max: number;
  p25: number;
  p75: number;
}

type SalaryData = {
  averageSalary: number;
  medianSalary: number;
  salaryRange: SalaryRange;
  currency: Currency;
  lastCalculated: Date;
}

type SimilarSkill = {
  skill: Types.ObjectId;
  skillName: string;
  similarityScore: number;
}

export interface SkillInterface {
  _id: Types.ObjectId;
  name: string;
  similarSkills: SimilarSkill[];
  demandScore: number;
  growthRate: number;
  seniorityMultiplier: number;
  salaryData: SalaryData;
  embedding: Embedding | null;
  embeddingGeneratedAt?: Date;
  lastUpdated: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

// What the client sends when creating a skill
export interface CreateSkillPayload {
    name: string;
}

// PATCH — name is the only editable field too
export interface UpdateSkillPayload {
    name?: string;
}
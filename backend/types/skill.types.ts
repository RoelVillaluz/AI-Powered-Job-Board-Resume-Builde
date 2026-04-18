import { Types } from "mongoose";
import { EmbeddingVector } from "./embeddings.types";
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
  embedding: EmbeddingVector | null;
  embeddingGeneratedAt?: Date;
  lastUpdated: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SkillSearchResult = {
  _id: Types.ObjectId;
  name: string;
}

// What the client sends when creating a skill
export interface CreateSkillPayload {
    name: string;
}

// PATCH — name is the only editable field too
export interface UpdateSkillPayload {
    name?: string;
}
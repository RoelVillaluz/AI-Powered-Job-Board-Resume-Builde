// types/location.types.ts
import { Types } from "mongoose";
import { Currency, SalaryRange } from "./salaryTypes";
import { Embedding } from "./embeddings.types";

export interface LocationSalaryData {
    averageSalary: number;
    medianSalary: number;
    salaryRange: SalaryRange;
    currency: Currency;
    lastCalculated: Date;
}

export interface LocationDemandMetrics {
    totalPostings: number;
    growthRate: number;
    lastUpdated: Date;
}

export interface LocationInterface {
    _id: Types.ObjectId;
    name: string;
    costOfLivingIndex: number;
    baselineFactor: number;
    salaryData: LocationSalaryData;
    demandMetrics: LocationDemandMetrics;
    embedding: number[] | null;
    embeddingGeneratedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateLocationPayload {
    name: string;
}

export interface UpdateLocationPayload {
    name?: string;
}

export interface LocationEmbeddingData {
    _id: Types.ObjectId;
    name: string;
    embedding: Embedding | null;
    embeddingGeneratedAt?: Date | null;
}
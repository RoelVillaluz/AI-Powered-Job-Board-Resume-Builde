import { Types } from "mongoose";

export type EmbeddingVector = number[];

// --- Resume ---
export type ResumeEmbeddingsDocument = {
    resume: Types.ObjectId | string;
    embeddings: {
        jobTitle: EmbeddingVector;
        location: EmbeddingVector;
    }
    meanEmbeddings: {
        skills?: EmbeddingVector;
        workExperience?: EmbeddingVector;
        certifications?: EmbeddingVector;
    };
    metrics?: {
        totalExperienceYears: number;
    };
    generatedAt: Date;
};

// --- Job Posting ---
export type JobPostingEmbeddingsDocument = {
    jobPosting: Types.ObjectId | string;
    embeddings: {
        jobTitle: EmbeddingVector;
        experienceLevel: EmbeddingVector;
        location: EmbeddingVector;
    };
    meanEmbeddings: {
        skills: EmbeddingVector;
        requirements: EmbeddingVector;
        experienceLevel?: EmbeddingVector | null;
    };
    generatedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
};

// --- Validation ---

export type EmbeddingValidationReturn = {
    valid: boolean;
    errors: string[];
    warnings: string[];
    validSections?: string[];
};

/** Market entities — embedding is a field on the document */
export type MarketEmbeddingUpdate = {
    embedding:            number[];
    embeddingGeneratedAt: Date;
}

/** Entities with extra computed fields on update */
export type JobTitleEmbeddingUpdate = MarketEmbeddingUpdate & {
    lastUpdated: Date;
}

export type IndustryEmbeddingUpdate = MarketEmbeddingUpdate & {
    lastAnalyzed: Date;
}
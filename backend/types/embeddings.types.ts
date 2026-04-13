import { Types } from "mongoose";

export type EmbeddingVector = number[];

// --- Resume ---

export type ResumeMeanEmbeddings = {
    skills?: EmbeddingVector;
    workExperience?: EmbeddingVector;
    certifications?: EmbeddingVector;
};

export type ResumeEmbeddings = {
    meanEmbeddings: ResumeMeanEmbeddings;
};

// --- Job Posting ---

export type JobPostingMeanEmbeddings = {
    jobTitle?: EmbeddingVector;
    skills: EmbeddingVector;
    requirements: EmbeddingVector;
    experienceLevel?: EmbeddingVector;
    location?: EmbeddingVector;
};

export type JobPostingEmbeddings = {
    meanEmbeddings: JobPostingMeanEmbeddings;
};

// --- Validation ---

export type EmbeddingValidationReturn = {
    valid: boolean;
    errors: string[];
    warnings: string[];
    validSections?: string[];
};
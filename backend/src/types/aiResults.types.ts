import { JobPostingEmbeddingsDocument, ResumeEmbeddingsDocument } from "./embeddings.types.js";

export type ResumeEmbeddingAIResult = Omit<
    ResumeEmbeddingsDocument,
    "resume" | "generatedAt"
>;

export type JobPostingEmbeddingAIResult = Omit<
    JobPostingEmbeddingsDocument,
    "jobPosting" | "generatedAt" | "createdAt" | "updatedAt"
>
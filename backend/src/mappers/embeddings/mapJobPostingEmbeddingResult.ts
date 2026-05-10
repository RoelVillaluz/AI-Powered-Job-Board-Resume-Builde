import { JobPostingEmbeddingAIResult } from "../../types/aiResults.types.js";
import { JobPostingEmbeddingsDocument } from "../../types/embeddings.types.js";

export type JobPostingEmbeddingMapped = Omit<
    JobPostingEmbeddingsDocument,
    "jobPosting" | "generatedAt"
>;

export const mapJobPostingEmbeddingResult = (
    aiResult: unknown
): JobPostingEmbeddingMapped => {

    const data = aiResult as JobPostingEmbeddingAIResult;

    return {
        embeddings: {
            jobTitle: data.embeddings.jobTitle,
            experienceLevel: data.embeddings.experienceLevel,
            location: data.embeddings.location,
        },

        meanEmbeddings: {
            skills: data.meanEmbeddings?.skills,
            requirements: data.meanEmbeddings?.requirements,
            experienceLevel: data.meanEmbeddings?.experienceLevel,
        },
    };
};
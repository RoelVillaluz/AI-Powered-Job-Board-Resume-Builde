import { ResumeEmbeddingAIResult } from "../../types/aiResults.types.js";
import { ResumeEmbeddingsDocument } from "../../types/embeddings.types.js";


export type ResumeEmbeddingMapped = Omit<
    ResumeEmbeddingsDocument,
    "resume" | "generatedAt"
>;

export const mapResumeEmbeddingResult = (
    aiResult: unknown
): ResumeEmbeddingMapped => {

    const data = aiResult as ResumeEmbeddingAIResult;

    return {
        embeddings: {
            jobTitle: data.embeddings.jobTitle,
            location: data.embeddings.location,
        },

        meanEmbeddings: {
            skills: data.meanEmbeddings?.skills,
            workExperience: data.meanEmbeddings?.workExperience,
            certifications: data.meanEmbeddings?.certifications,
        },

        metrics: data.metrics,
    };
};
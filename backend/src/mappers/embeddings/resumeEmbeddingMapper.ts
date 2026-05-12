
import { ResumeEmbeddingAIResult } from "../../types/aiResults.types.js";
import { ResumeEmbeddingsDocument } from "../../types/embeddings.types.js";
import { backfillMarketEmbeddings } from "../../mappers/embeddings/backfillMarketEmbedding.js";

export type ResumeEmbeddingMapped = Omit<
    ResumeEmbeddingsDocument,
    "resume" | "generatedAt"
>;

export const mapResumeEmbeddingResult = async (
    aiResult: unknown
): Promise<ResumeEmbeddingMapped> => {

    const data = aiResult as ResumeEmbeddingAIResult;

    // Fire and forget — backfill never blocks or throws
    await backfillMarketEmbeddings({
        skillIdsToBackfill:        data.skill_ids_to_backfill        ?? [],
        skillEmbeddingsToBackfill: data.skill_embeddings_to_backfill ?? [],
        jobTitleIdToBackfill:      data.job_title_id_to_backfill     ?? null,
        jobTitleEmbedding:         data.embeddings?.jobTitle         ?? null,
        locationIdToBackfill:      data.location_id_to_backfill      ?? null,
        locationEmbedding:         data.embeddings?.location         ?? null,
    });

    return {
        embeddings: {
            jobTitle:  data.embeddings.jobTitle,
            location:  data.embeddings.location,
        },
        meanEmbeddings: {
            skills:         data.meanEmbeddings?.skills,
            workExperience: data.meanEmbeddings?.workExperience,
            certifications: data.meanEmbeddings?.certifications,
        },
        metrics: data.metrics,
    };
};
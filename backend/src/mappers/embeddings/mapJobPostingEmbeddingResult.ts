import { JobPostingEmbeddingAIResult } from "../../types/aiResults.types.js";
import { JobPostingEmbeddingsDocument } from "../../types/embeddings.types.js";
import { backfillMarketEmbeddings } from "../../mappers/embeddings/backfillMarketEmbedding.js";

export type JobPostingEmbeddingMapped = Omit<
    JobPostingEmbeddingsDocument,
    "jobPosting" | "generatedAt"
>;

export const mapJobPostingEmbeddingResult = async (
    aiResult: unknown
): Promise<JobPostingEmbeddingMapped> => {

    const data = aiResult as JobPostingEmbeddingAIResult;

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
            jobTitle:        data.embeddings.jobTitle,
            experienceLevel: data.embeddings.experienceLevel,
            location:        data.embeddings.location,
        },
        meanEmbeddings: {
            skills:          data.meanEmbeddings?.skills,
            requirements:    data.meanEmbeddings?.requirements,
            experienceLevel: data.meanEmbeddings?.experienceLevel,
        },
    };
};
import {
    JobPostingEmbeddingsDocument,
    ResumeEmbeddingsDocument,
} from "./embeddings.types.js";

// ── Backfill fields returned by Python but not stored on the embedding doc ────
// Python includes these so Node can write the newly-generated vectors back
// to the Skill / JobTitle / Location market collections.

interface BackfillFields {
    skill_ids_to_backfill:        string[];
    skill_embeddings_to_backfill: number[][];
    job_title_id_to_backfill:     string | null;
    location_id_to_backfill:      string | null;
}

// ── AI result types ───────────────────────────────────────────────────────────

export type ResumeEmbeddingAIResult =
    Omit<ResumeEmbeddingsDocument, "resume" | "generatedAt">
    & BackfillFields;

export type JobPostingEmbeddingAIResult =
    Omit<JobPostingEmbeddingsDocument, "jobPosting" | "generatedAt" | "createdAt" | "updatedAt">
    & BackfillFields;
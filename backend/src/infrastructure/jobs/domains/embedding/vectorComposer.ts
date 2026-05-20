import { ResumeEmbeddingsDocument, JobPostingEmbeddingsDocument } from "../../../../types/embeddings.types.js";

const VECTOR_DIM = 768; // all-mpnet-base-v2 output dimension

type WeightedVector = [number[] | null | undefined, number];

/**
 * Builds a single weighted composite vector from resume embeddings.
 * Falls back gracefully if any field embeddings are missing.
 */
export const buildResumeVector = (doc: ResumeEmbeddingsDocument): number[] => {
    const { meanEmbeddings, embeddings } = doc;

    const pairs: WeightedVector[] = [
        [meanEmbeddings.skills,           0.40],
        [meanEmbeddings.workExperience,   0.30],
        [embeddings.jobTitle,            0.15],
        [meanEmbeddings.certifications,  0.10],
        [embeddings.location,            0.05],
    ];

    return weightedMean(pairs);
}

/**
 * Builds a single weighted composite vector from job posting embeddings.
 * Falls back gracefully if any field embeddings are missing.
 */
export const buildJobVector = (doc: JobPostingEmbeddingsDocument): number[] => {
    const { meanEmbeddings, embeddings } = doc;

    const pairs: WeightedVector[] = [
        [meanEmbeddings.skills,          0.35],
        [meanEmbeddings.requirements,    0.25],
        [embeddings.jobTitle,            0.20],
        [meanEmbeddings.experienceLevel, 0.15],
        [embeddings.location,            0.05],
    ];

    return weightedMean(pairs);
}

/**
 * Weighted mean of multiple vectors. Automatically renormalizes weights
 * when some fields are null/missing so the result is always valid.
 */
const weightedMean = (pairs: WeightedVector[]): number[] => {
    const valid = pairs.filter(
        ([vec]) => Array.isArray(vec) && vec.length === VECTOR_DIM
    ) as [number[], number][];

    if (valid.length === 0) {
        throw new Error(
        `[vectorComposer] No valid ${VECTOR_DIM}-d embeddings found. ` +
        `Check that meanEmbeddings were computed before upserting to Pinecone.`
        );
    }

    const totalWeight = valid.reduce((sum, [, w]) => sum + w, 0);
    const result = new Array(VECTOR_DIM).fill(0);

    for (const [vec, weight] of valid) {
        const normalized = weight / totalWeight;
        for (let i = 0; i < VECTOR_DIM; i++) {
        result[i] += vec[i] * normalized;
        }
    }

    return result;
}
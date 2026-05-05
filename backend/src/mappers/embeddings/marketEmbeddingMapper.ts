import { MarketEmbeddingUpdate } from "../../types/embeddings.types.js";

/**
 * Maps FastAPI response to DB update shape for all market entities.
 * Used by: skill, jobTitle, location, industry registry entries.
 *
 * FastAPI returns:
 *   { "embedding": [0.12, 0.34, ...] }
 *
 * DB update shape:
 *   { embedding: number[], embeddingGeneratedAt: Date }
 */
export const mapMarketEmbeddingResult = (aiResult: any): MarketEmbeddingUpdate => {
    if (!aiResult?.embedding?.length) {
        throw new Error("AI service returned empty or missing embedding");
    }

    return {
        embedding:            aiResult.embedding,
        embeddingGeneratedAt: new Date(),
    };
};
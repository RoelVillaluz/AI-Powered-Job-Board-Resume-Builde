import { ResumeEmbeddingsDocument } from "./embeddings.types.js";

export type ResumeEmbeddingAIResult = Omit<
    ResumeEmbeddingsDocument,
    "resume" | "generatedAt"
>;
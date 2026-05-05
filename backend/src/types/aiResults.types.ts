import { ResumeEmbeddingsDocument } from "./embeddings.types";

export type ResumeEmbeddingAIResult = Omit<
    ResumeEmbeddingsDocument,
    "resume" | "generatedAt"
>;
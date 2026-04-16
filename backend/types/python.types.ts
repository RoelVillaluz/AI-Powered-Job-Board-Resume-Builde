import { runPython } from "../infrastructure/python/pythonRunner";
import { EmbeddingVector } from "./embeddings.types";

export interface PythonResponse {
  embedding: EmbeddingVector;
  error?: string;
}

export const runPythonTyped = runPython as unknown as (
    script: string,
    args: any[],
    emit?: (progress: number) => void
) => Promise<PythonResponse>;
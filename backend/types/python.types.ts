import { runPython } from "../utils/pythonRunner";
import { Embedding } from "./embeddings.types";

export interface PythonResponse {
  embedding: Embedding;
  error?: string;
}

export const runPythonTyped = runPython as unknown as (
    script: string,
    args: any[],
    emit?: (progress: number) => void
) => Promise<PythonResponse>;
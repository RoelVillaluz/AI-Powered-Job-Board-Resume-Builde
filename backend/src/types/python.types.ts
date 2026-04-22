import { runPython } from "../infrastructure/python/pythonRunner.js";
import { EmbeddingVector } from "./embeddings.types.js";

export type PythonEmit = (
    event: string,
    data: { progress: number; message?: string }
) => void;

export type PythonResponse = {
    error?: string;
    [key: string]: any;
};

export const runPythonTyped = (
    command: string,
    args: (string | number)[],
    emit: PythonEmit = () => {},
): Promise<PythonResponse> => {
    return runPython(command, args.map(String), emit as any) as Promise<PythonResponse>;
};
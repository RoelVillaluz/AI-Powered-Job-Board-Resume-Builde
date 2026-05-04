import { Types } from "mongoose";
import { embeddingRegistryV2 } from "../domains/embedding/embeddingRegistryV2";
import { QueueJob } from "../../../types/queues.types.js";

// ─────────────────────────────────────────────
// MAIN CONFIG (RENAMED)
// ─────────────────────────────────────────────
export interface ComputeConfigV2<T, TAIResult = any> {

    // ─────────────────────────────────────────────
    // Identity (optional but useful for debugging)
    // ─────────────────────────────────────────────
    key?: string;
    entity: string;

    // ─────────────────────────────────────────────
    // Queue layer
    // ─────────────────────────────────────────────
    queueName: string;
    jobName: string;
    jobIdPrefix: string;

    concurrency: number;
    priority: number;
    dlqName: string | null;

    queue: (payload: { id: string } & Record<string, any>) =>
        Promise<{ jobId: string }>;

    // ─────────────────────────────────────────────
    // Data layer (IMPORTANT)
    // ─────────────────────────────────────────────
    fetcher: (id: Types.ObjectId | string) =>
        Promise<Record<string, any> | null>;

    aiEndpoint: string;

    // Optional — scoring and non-embedding entities set this to true
    // to bypass the embedding validity check in executeComputePipelineV2
    skipEmbeddingCheck?: boolean;

    // Optional — used when AI response needs custom payload building
    // instead of the standard mapper pattern (e.g. scoring)
    // If present, used instead of mapper
    buildPayload?: (aiResult: TAIResult, id: Types.ObjectId) => Partial<T>;

    // mapper is now optional since buildPayload can replace it
    mapper?: (aiResult: TAIResult) => Partial<T>;

    persist: (
        id: string | Types.ObjectId,
        data: Partial<T>
    ) => Promise<T>;

    // ─────────────────────────────────────────────
    // Execution control
    // ─────────────────────────────────────────────
    fallback: (
        id: string | Types.ObjectId,
        job?: QueueJob | null,
        emit?: EmitFn,
    ) => Promise<any>;

    // Optional — runs after document is saved to DB
    // Used by resume to trigger scoring pipeline
    afterSave?: (
        saved:      T,
        emitSocket: (event: string, data: any) => void,
        ctx:        { userId: string | null },
    ) => Promise<void>;
}

export type EmitFn = (
    event: string,
    data: { progress: number; message?: string }
) => void;
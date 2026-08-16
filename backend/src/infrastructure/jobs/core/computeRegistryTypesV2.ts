import { Types } from "mongoose";
import { Job } from "bullmq";
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

    // Streaming support — when set, the pipeline streams the AI response via
    // aiClientStream instead of a single aiClient call, forwarding each chunk
    // as `streamEvent` socket events and checking `shouldAbort` between chunks.
    stream?: boolean;
    streamEvent?: string; // socket event emitted per stream chunk

    // Optional — scoring and non-embedding entities set this to true
    // to bypass the embedding validity check in executeComputePipelineV2
    skipEmbeddingCheck?: boolean;

    // Optional — used when AI response needs custom payload building
    // instead of the standard mapper pattern (e.g. scoring)
    // If present, used instead of mapper
    buildPayload?: (aiOutput: unknown, id: Types.ObjectId) => Promise<any>;

    progressEvent?: string; // defaults to 'embedding'

    // mapper is now optional since buildPayload can replace it
    mapper?:       (aiResult: unknown) => any | Promise<any>;


    persist: (
        id: string | Types.ObjectId,
        data: Partial<T>
    ) => Promise<T>;

    // Optional — runs after document is saved to DB
    // Used by resume to trigger scoring pipeline
    afterSave?: (
        saved:      T,
        emitSocket: (event: string, data: any) => void,
        ctx:        { userId: string | null; startTime: number },
    ) => Promise<void>;

    // Optional — runs once a job has exhausted all retry attempts and will
    // not be retried again. Used for cleaning up per-request side state that
    // fetcher() reads (e.g. a Redis pending-entry keyed by resumeId) — safe
    // to delete only once no further attempt will try to read it. Registries
    // that don't set per-request side state (most of them) can omit this.
    onFinalFailure?: (job: Job) => Promise<void>;

}

export type EmitFn = (
    event: string,
    data: { progress: number; message?: string }
) => void;
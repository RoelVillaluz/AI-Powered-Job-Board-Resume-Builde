import { Types } from "mongoose";
import { embeddingRegistryV2 } from "../domains/embedding/embeddingRegistryV2";
import { QueueJob } from "../../../types/queues.types.js";

// ─────────────────────────────────────────────
// Registry Types
// ─────────────────────────────────────────────
export type ComputeRegistry = typeof embeddingRegistryV2;

export type ComputeEntityKey = keyof ComputeRegistry;

export type ComputeEntityConfig<K extends ComputeEntityKey> =
    ComputeRegistry[K];

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
        Promise<Record<string, unknown> | null>;

    aiEndpoint: string;

    mapper: (aiResult: TAIResult) => Partial<T>;

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
}

export type EmitFn = (
    event: string,
    data: { progress: number; message?: string }
) => void;
import { Types } from "mongoose";
import { QueueJob } from "../../../types/queues.types";
import { embeddingRegistry } from "./embeddingRegistry";

/**
 * Repository adapter for embedding persistence.
 * 
 * create is optional — market entities (skill, jobTitle, location, industry)
 * store embeddings as fields on an existing document, so only update is needed.
 * Resume embeddings live in a separate model that may not exist yet, so both
 * create and update are required.
 */
export interface EmbeddingRepository<T> {
    getExisting: (id: Types.ObjectId | string) => Promise<T | null>;
    update:      (id: Types.ObjectId | string, data: any) => Promise<T>;
    create?:     (data: any) => Promise<T>;
}

export type PayloadBuilder<T> = (
    pythonResponse: any,
    id: Types.ObjectId
) => Partial<T>;

export type AfterSaveHook<T> = (
    saved:      T,
    emit:       (event: string, data: { progress: number; message?: string }) => void,
    emitSocket: (event: string, data: any) => void,
) => Promise<void>;

/**
 * Complete configuration for a single embedding entity type.
 * This is the single source of truth for both pipeline behaviour
 * and worker deployment (queue name, concurrency, DLQ).
 */
export interface EmbeddingEntityConfig<T, TPayload = any> {
    queueName:   string;
    concurrency: number;
    priority:    number;
    dlqName:     string | null;

    queue: (payload: TPayload & { id: string }) => Promise<{ jobId: string }>;

    fallback: (
        id: Types.ObjectId | string,
        invalidateCache: boolean,
        job: QueueJob | null,
        context: {
            userId?: string;
            emit?: (progress: number) => void;
        }
    ) => Promise<any>;

    pythonScript: string;

    repo: {
        getExisting: (id: Types.ObjectId | string) => Promise<T | null>;
        create?:     (data: any) => Promise<T>;
        update:      (id: Types.ObjectId | string, data: any) => Promise<T>;
    };

    buildPayload: PayloadBuilder<T>;

    afterSave?: AfterSaveHook<T>;

    /**
     * Optional custom Python args builder.
     * Default: [id.toString()]
     * Use when the Python script needs more than just the entity ID
     * (e.g. passing additional context or flags).
     */
    pythonArgsBuilder?: (id: Types.ObjectId | string) => (string | number)[];
}

/**
 * Type-safe key for accessing embeddingRegistry entries.
 */
export type EmbeddingEntityKey = keyof typeof embeddingRegistry;
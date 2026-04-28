import { Types } from "mongoose";
import { QueueJob } from "../../../types/queues.types.js";
import { PythonEmit } from "../../../types/python.types.js";

export interface ComputeRepository<T> {
    getExisting: (id: Types.ObjectId | string) => Promise<T | null>;
    update:      (id: Types.ObjectId | string, data: any) => Promise<T>;
    create?:     (data: any) => Promise<T>;
}

export type ComputePayloadBuilder<T> = (
    pythonResponse: any,
    id: Types.ObjectId
) => Partial<T>;

export type AfterSaveHook<T> = (
    saved:      T,
    emit:       PythonEmit,
    emitSocket: (event: string, data: any) => void,
    ctx:        { userId?: string },   // ← add this
) => Promise<void>;

export interface ComputeJobConfig<T, TPayload = any> {
    queueName:   string;
    concurrency: number;
    priority:    number;
    dlqName:     string | null;

    queue: (payload: TPayload & { id: string }) => Promise<{ jobId: string }>;

    fallback: (
        id:              Types.ObjectId | string,
        invalidateCache: boolean,
        job:             QueueJob | null,
        context: {
            userId?:     string;
            emit?:       PythonEmit;   // ← was (progress: number) => void
            emitSocket?: (event: string, data: any) => void;
        }
    ) => Promise<any>;

    pythonScript:      string;
    execute?:           (id: Types.ObjectId, ctx: { userId?: string; emit?: PythonEmit; emitSocket?: (event: string, data: any) => void }) => Promise<any>;
    pythonArgsBuilder?: (id: Types.ObjectId | string) => (string | number)[];

    repo: {
        getExisting: (id: Types.ObjectId | string) => Promise<T | null>;
        create?:     (data: any) => Promise<T>;
        update:      (id: Types.ObjectId | string, data: any) => Promise<T>;
    };

    buildPayload: ComputePayloadBuilder<T>;
    afterSave?:   AfterSaveHook<T>;
}

export type ComputeEntityKey = string;
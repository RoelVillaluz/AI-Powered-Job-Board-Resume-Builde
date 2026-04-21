export interface QueueJob {
    updateProgress: (percent: number) => Promise<void> | void;
}

export type QueueResult<T> =
    | { type: 'queued'; jobId: string }
    | { type: 'executed'; data: T };
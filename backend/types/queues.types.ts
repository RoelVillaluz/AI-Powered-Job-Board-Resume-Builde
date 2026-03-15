export interface QueueJob {
    updateProgress: (percent: number) => Promise<void> | void;
}
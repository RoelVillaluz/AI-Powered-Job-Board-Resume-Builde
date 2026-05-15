import { Queue } from 'bullmq';
import { redisConnection } from '../../../config/queue.config.js';
import {
    resumeEmbeddingQueue,
    jobEmbeddingQueue,
    skillEmbeddingQueue,
    jobTitleEmbeddingQueue,
    locationEmbeddingQueue,
    industryEmbeddingQueue,
    resumeScoringQueue,
    skillEmbeddingDLQ,
    jobTitleEmbeddingDLQ,
    locationEmbeddingDLQ,
    industryEmbeddingDLQ,
    salaryPredictionQueue,
} from '../../../queues/index.js';
import { embeddingRegistryV2 } from '../domains/embedding/embeddingRegistryV2.js';
import { scoringRegistryV2 }   from '../domains/scoring/scoringRegistryV2.js';
import { createWorkerV2 }      from './createWorkerV2.js';
import logger from '../../../utils/logger.js';
import { salaryPredictionRegistry } from '../domains/salary/salaryPredictionRegistry.js';

// ── Queue + DLQ maps ──────────────────────────────────────────────────────────

const queueMap: Record<string, Queue> = {
    resume:      resumeEmbeddingQueue,
    jobPosting:  jobEmbeddingQueue,
    skill:       skillEmbeddingQueue,
    jobTitle:    jobTitleEmbeddingQueue,
    location:    locationEmbeddingQueue,
    industry:    industryEmbeddingQueue,
    resumeScore: resumeScoringQueue,
    resumeSalaryPrediction: salaryPredictionQueue,
};

const dlqMap: Record<string, Queue | null> = {
    resume:      null,
    skill:       skillEmbeddingDLQ,
    jobTitle:    jobTitleEmbeddingDLQ,
    location:    locationEmbeddingDLQ,
    industry:    industryEmbeddingDLQ,
    resumeScore: null,
};

// ── Build workers from both registries ────────────────────────────────────────
// workerRegistryV2 is the ONLY file that imports both registries.
// executeComputePipelineV2 and createWorkerV2 never import registries directly.

const allConfigs = {
    ...embeddingRegistryV2,
    ...scoringRegistryV2,
    ...salaryPredictionRegistry,
};

export const workersV2 = Object.fromEntries(
    Object.entries(allConfigs).map(([key, config]) => [
        key,
        createWorkerV2({
            config,
            queue:      queueMap[key],
            connection: redisConnection,
            dlq:        dlqMap[key] ?? null,
        }),
    ])
);

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export const shutdownWorkersV2 = async () => {
    logger.info('[WORKERS V2] Shutting down...');
    await Promise.allSettled(
        Object.entries(workersV2).map(async ([key, worker]) => {
            try {
                await worker.close();
                logger.info(`[WORKERS V2] Closed ${key}`);
            } catch (err) {
                logger.error(`[WORKERS V2] Failed closing ${key}`, { err });
            }
        })
    );
    logger.info('[WORKERS V2] Shutdown complete');
};

export const pauseAllWorkersV2  = async () =>
    Promise.all(Object.values(workersV2).map(w => w.pause()));

export const resumeAllWorkersV2 = async () =>
    Promise.all(Object.values(workersV2).map(w => w.resume()));
import { Queue } from "bullmq";
import { redisConnection } from "../../../config/queue.config.js";

import {
    resumeEmbeddingQueue,
    skillEmbeddingQueue,
    jobTitleEmbeddingQueue,
    locationEmbeddingQueue,
    industryEmbeddingQueue,
    skillEmbeddingDLQ,
    jobTitleEmbeddingDLQ,
    locationEmbeddingDLQ,
    industryEmbeddingDLQ,
    jobEmbeddingQueue,
    resumeScoringQueue,  // ← add this
} from "../../../queues/index.js";

import { embeddingRegistry } from "../domains/embedding/embeddingRegistry.js";
import { scoringRegistry } from "../domains/scoring/scoringRegistry.js";
import { createWorker } from "../workers/createWorker.js"
import logger from "../../../utils/logger.js";

// ── Queue maps ────────────────────────────────────────────────────────────────

const embeddingQueueMap: Record<string, Queue> = {
    resume:     resumeEmbeddingQueue,
    jobPosting: jobEmbeddingQueue,
    skill:      skillEmbeddingQueue,
    jobTitle:   jobTitleEmbeddingQueue,
    location:   locationEmbeddingQueue,
    industry:   industryEmbeddingQueue,
};

const embeddingDLQMap: Record<string, Queue | null> = {
    resume:     null,
    jobPosting: null,
    skill:      skillEmbeddingDLQ,
    jobTitle:   jobTitleEmbeddingDLQ,
    location:   locationEmbeddingDLQ,
    industry:   industryEmbeddingDLQ,
};

const scoringQueueMap: Record<string, Queue> = {
    resumeScore: resumeScoringQueue,
};

const scoringDLQMap: Record<string, Queue | null> = {
    resumeScore: null,
};

// ── Worker factories ──────────────────────────────────────────────────────────

const buildWorkers = (
    registry: Record<string, any>,
    queueMap: Record<string, Queue>,
    dlqMap:   Record<string, Queue | null>,
    jobName:  string,
) =>
    Object.fromEntries(
        Object.entries(registry).map(([key, config]) => [
            key,
            createWorker({
                entityKey:   key,
                config,          // ← passed directly, worker never touches any registry
                queue:       queueMap[key],
                jobName,
                concurrency: config.concurrency,
                connection:  redisConnection,
                dlq:         dlqMap[key] ?? null,
            }),
        ])
    );

export const embeddingWorkers = buildWorkers(
    embeddingRegistry,
    embeddingQueueMap,
    embeddingDLQMap,
    'generate-embeddings',
);

export const scoringWorkers = buildWorkers(
    scoringRegistry,
    scoringQueueMap,
    scoringDLQMap,
    'calculate-score',
);

const allWorkers = { ...embeddingWorkers, ...scoringWorkers };

// ── Lifecycle helpers ─────────────────────────────────────────────────────────

export const shutdownWorkers = async () => {
    logger.info("[WORKERS] shutting down...");

    await Promise.allSettled(
        Object.entries(allWorkers).map(async ([key, worker]) => {
            try {
                await worker.close();
                logger.info(`[WORKERS] closed ${key}`);
            } catch (err) {
                logger.error(`[WORKERS] failed closing ${key}`, { err });
            }
        })
    );

    logger.info("[WORKERS] shutdown complete");
};

export const pauseAllWorkers  = async () =>
    Promise.all(Object.values(allWorkers).map(w => w.pause()));

export const resumeAllWorkers = async () =>
    Promise.all(Object.values(allWorkers).map(w => w.resume()));

// ── Direct exports ────────────────────────────────────────────────────────────

export const resumeWorker    = embeddingWorkers.resume;
export const jobWorker       = embeddingWorkers.jobPosting;
export const skillWorker     = embeddingWorkers.skill;
export const jobTitleWorker  = embeddingWorkers.jobTitle;
export const locationWorker  = embeddingWorkers.location;
export const industryWorker  = embeddingWorkers.industry;
export const resumeScoreWorker = scoringWorkers.resumeScore;
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
    resumeScoringQueue,
} from "../../../queues/index.js";

import { embeddingRegistryV2 } from "../domains/embedding/embeddingRegistryV2.js";
import { scoringRegistry }     from "../domains/scoring/scoringRegistry.js";
import { createWorkerV2 }      from "../workers/createWorkerV2.js";
import logger                  from "../../../utils/logger.js";

// ── Queue maps ─────────────────────────────────────────────────────────────────

const embeddingQueueMapV2: Record<string, Queue> = {
    resume:   resumeEmbeddingQueue,
    skill:    skillEmbeddingQueue,
    jobTitle: jobTitleEmbeddingQueue,
    location: locationEmbeddingQueue,
    industry: industryEmbeddingQueue,
};

const embeddingDLQMapV2: Record<string, Queue | null> = {
    resume:   null,
    skill:    skillEmbeddingDLQ,
    jobTitle: jobTitleEmbeddingDLQ,
    location: locationEmbeddingDLQ,
    industry: industryEmbeddingDLQ,
};

const scoringQueueMapV2: Record<string, Queue> = {
    resumeScore: resumeScoringQueue,
};

const scoringDLQMapV2: Record<string, Queue | null> = {
    resumeScore: null,
};

// ── Worker factory ─────────────────────────────────────────────────────────────

const buildWorkersV2 = (
    registry: Record<string, any>,
    queueMap: Record<string, Queue>,
    dlqMap:   Record<string, Queue | null>,
) =>
    Object.fromEntries(
        Object.entries(registry).map(([key, config]) => [
            key,
            createWorkerV2({
                entityKey:   key,
                queue:       queueMap[key],
                concurrency: config.concurrency,
                connection:  redisConnection,
                dlq:         dlqMap[key] ?? null,
            }),
        ])
    );

export const embeddingWorkersV2 = buildWorkersV2(
    embeddingRegistryV2,
    embeddingQueueMapV2,
    embeddingDLQMapV2,
);

export const scoringWorkersV2 = buildWorkersV2(
    scoringRegistry,
    scoringQueueMapV2,
    scoringDLQMapV2,
);

const allWorkersV2 = { ...embeddingWorkersV2 };

// ── Lifecycle helpers ──────────────────────────────────────────────────────────

export const shutdownWorkersV2 = async () => {
    logger.info("[WORKERS V2] Shutting down...");
    await Promise.allSettled(
        Object.entries(allWorkersV2).map(async ([key, worker]) => {
            try {
                await worker.close();
                logger.info(`[WORKERS V2] Closed: ${key}`);
            } catch (err) {
                logger.error(`[WORKERS V2] Failed closing: ${key}`, { err });
            }
        })
    );
    logger.info("[WORKERS V2] Shutdown complete");
};

export const pauseAllWorkersV2  = async () =>
    Promise.all(Object.values(allWorkersV2).map(w => w.pause()));

export const resumeAllWorkersV2 = async () =>
    Promise.all(Object.values(allWorkersV2).map(w => w.resume()));

// ── Named exports ──────────────────────────────────────────────────────────────

export const resumeWorkerV2   = embeddingWorkersV2.resume;
export const skillWorkerV2    = embeddingWorkersV2.skill;
export const jobTitleWorkerV2 = embeddingWorkersV2.jobTitle;
export const locationWorkerV2 = embeddingWorkersV2.location;
export const industryWorkerV2 = embeddingWorkersV2.industry;
export const resumeScoreWorkerV2 = scoringWorkersV2.resumeScore;
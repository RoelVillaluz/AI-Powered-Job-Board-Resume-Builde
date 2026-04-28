import { Queue } from "bullmq";
import { redisConnection } from "../../../../config/queue.config.js";

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
} from "../../../../queues/index.js";

import { embeddingRegistry } from "../registry/embeddingRegistry.js";
import { createEmbeddingWorker } from "./createEmbeddingWorker.js";
import { EmbeddingEntityKey } from "../registry/embeddingRegistry.types.js";
import logger from "../../../../utils/logger.js";

/**
 * Queue bindings
 */
const queueMap: Record<EmbeddingEntityKey, Queue> = {
    resume: resumeEmbeddingQueue,
    jobPosting: jobEmbeddingQueue,
    skill: skillEmbeddingQueue,
    jobTitle: jobTitleEmbeddingQueue,
    location: locationEmbeddingQueue,
    industry: industryEmbeddingQueue,
};

/**
 * DLQ bindings
 */
const dlqMap: Record<EmbeddingEntityKey, Queue | null> = {
    resume: null,
    skill: skillEmbeddingDLQ,
    jobTitle: jobTitleEmbeddingDLQ,
    location: locationEmbeddingDLQ,
    industry: industryEmbeddingDLQ,
};

/**
 * MAIN WORKER FACTORY
 * Everything is driven by embeddingRegistry.
 */
export const embeddingWorkers = Object.fromEntries(
    Object.entries(embeddingRegistry).map(([key, config]) => [
        key,
        createEmbeddingWorker({
            entityKey: key as EmbeddingEntityKey,
            queue: queueMap[key as EmbeddingEntityKey],
            jobName: "generate-embeddings",
            concurrency: config.concurrency,
            connection: redisConnection,
            dlq: dlqMap[key as EmbeddingEntityKey],
        }),
    ])
) as Record<EmbeddingEntityKey, ReturnType<typeof createEmbeddingWorker>>;

/**
 * Lifecycle helpers
 */
export const shutdownWorkers = async () => {
    logger.info("[WORKERS] shutting down...");

    await Promise.allSettled(
        Object.entries(embeddingWorkers).map(async ([key, worker]) => {
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

export const pauseAllWorkers = async () => {
    await Promise.all(
        Object.values(embeddingWorkers).map((w) => w.pause())
    );
};

export const resumeAllWorkers = async () => {
    await Promise.all(
        Object.values(embeddingWorkers).map((w) => w.resume())
    );
};

/**
 * Optional direct exports (safe version)
 */
export const resumeWorker = embeddingWorkers.resume;
export const jobWorker = embeddingWorkers.jobPosting;
export const skillWorker = embeddingWorkers.skill;
export const jobTitleWorker = embeddingWorkers.jobTitle;
export const locationWorker = embeddingWorkers.location;
export const industryWorker = embeddingWorkers.industry;
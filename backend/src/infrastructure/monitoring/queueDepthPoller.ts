import logger from "../../utils/logger.js";
import { allQueues } from "../../queues/index.js";
import { embeddingQueueDepth } from "../../config/metrics.js";

let pollerHandle: NodeJS.Timeout | null = null;

async function poll() {
    try {
        await Promise.all(
            allQueues.map(async (queue) => {
                const depth = await queue.getWaitingCount();
                embeddingQueueDepth.set({ queue: queue.name }, depth);
            })
        );
    } catch (err) {
        logger.warn('[QueueDepthPoller] Failed to poll queue depth', err);
    }
}

export function startQueueDepthPoller(intervalMs = 15_000) {
    poll(); // immediate first read, don't await
    pollerHandle = setInterval(poll, intervalMs);
    logger.info('[QueueDepthPoller] Started');
}

export function stopQueueDepthPoller() {
    if (pollerHandle) {
        clearInterval(pollerHandle);
        pollerHandle = null;
        logger.info('[QueueDepthPoller] Stopped');
    }
}
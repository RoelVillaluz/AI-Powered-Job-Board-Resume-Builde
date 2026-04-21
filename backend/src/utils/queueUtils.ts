import Redis from "ioredis";
import { redisConnection } from "../config/queue.config";
import logger from "./logger.js";
import { QueueResult } from "../types/queues.types";

type RedisState = 'healthy' | 'down' | 'unknown';

let redisState: RedisState = "unknown";
let lastHealthCheck = 0;
const HEALTH_CHECK_TTL_MS = 30_000; // re-check every 30s once marked down

/**
 * Singleton Redis client for health checks only.
 * - retryStrategy caps retries so ioredis stops hammering the connection
 * - lazyConnect prevents an immediate connection attempt on import
 */
const redisClient = new Redis(redisConnection);

// Suppress ioredis's own unhandled error events — we handle errors manually
redisClient.on("error", () => {});

/**
 * Checks Redis health with TTL-based caching.
 * When Redis is down, skips re-checking until HEALTH_CHECK_TTL_MS has elapsed,
 * which prevents log spam and avoids hammering a dead connection.
 */
export const checkRedisConnectionHealth = async (): Promise<void> => {
    const now = Date.now();

    // If we already know it's down and the TTL hasn't expired, fail fast
    if (redisState === "down" && now - lastHealthCheck < HEALTH_CHECK_TTL_MS) {
        throw new Error("Redis is currently unavailable (cached state)");
    }

    try {
        const response = await redisClient.ping();

        if (response !== "PONG") {
            throw new Error(`Unexpected Redis response: ${response}`);
        }

        if (redisState !== "healthy") {
            logger.info("Redis connection restored");
        }

        redisState = "healthy";
        lastHealthCheck = now;
        logger.debug("Redis connection is healthy");
    } catch (err) {
        const wasHealthy = redisState !== "down";

        redisState = "down";
        lastHealthCheck = now;

        // Only log once per transition (healthy → down), not on every call
        if (wasHealthy) {
            logger.warn("Redis is unavailable — falling back to inline processing");
        }
        throw err;
    }
};

// ─── Safe Queue Operation ─────────────────────────────────────────────────────

/**
 * Safely executes a Redis-dependent operation with a fallback.
 *
 * - If Redis is known to be down (cached state), skips straight to fallback
 * - If Redis is healthy, runs the queue operation
 * - Only retries on transient errors; uses fallback after max attempts
 * - Suppresses redundant error logs after the first failure
 */
export const safeQueueOperation = async <T>(
    operation: () => Promise<{ jobId: string }>,
    fallback: () => Promise<T>,
    options?: {
        maxAttempts?: number;
        delayMs?: number;
    }
): Promise<QueueResult<T>> => {
    const maxAttempts = options?.maxAttempts ?? 3;
    const delayMs = options?.delayMs ?? 2000;

    // Fast path: skip queue entirely if Redis is known to be down
    if (redisState === "down") {
        const now = Date.now();
        if (now - lastHealthCheck < HEALTH_CHECK_TTL_MS) {
            logger.warn(`[SAFE_QUEUE] Redis down (cached) — skipping to fallback immediately. lastHealthCheck=${new Date(lastHealthCheck).toISOString()}, ttlRemaining=${HEALTH_CHECK_TTL_MS - (now - lastHealthCheck)}ms`);
            const data = await fallback();
            return { type: "executed", data };
        }
    }

    logger.info(`[SAFE_QUEUE] redisState=${redisState}, attempting queue operation. maxAttempts=${maxAttempts}`);

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
        try {
            logger.info(`[SAFE_QUEUE] attempt ${attempt + 1}/${maxAttempts} — checking Redis health`);
            await checkRedisConnectionHealth();
            logger.info(`[SAFE_QUEUE] Redis healthy — running queue operation`);
            const result = await operation();
            logger.info(`[SAFE_QUEUE] Queue operation succeeded — jobId=${result.jobId}`);
            return { type: "queued", jobId: result.jobId };
        } catch (error) {
            lastError = error;
            attempt++;
            logger.warn(`[SAFE_QUEUE] attempt ${attempt}/${maxAttempts} failed — redisState=${redisState}, error=${(error as Error).message}`);

            // If Redis just went down, fall back immediately (no point retrying)
            if (redisState === "down") {
                logger.warn(`[SAFE_QUEUE] Redis went down during attempt — breaking to fallback`);
                break;
            }

            if (attempt < maxAttempts) {
                logger.info(`[SAFE_QUEUE] Retrying in ${delayMs}ms`);
                await new Promise((res) => setTimeout(res, delayMs));
            }
        }
    }

    logger.warn(`[SAFE_QUEUE] All attempts exhausted — executing fallback. totalAttempts=${attempt}`);
    const data = await fallback();
    return { type: "executed", data };
};
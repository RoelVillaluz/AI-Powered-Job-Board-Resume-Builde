import Redis from 'ioredis';
import { redisConnection } from '../../../../config/queue.config.js';

const redisClient = new Redis(redisConnection as any);
redisClient.on('error', (err) => console.error('[pendingInsightStore] Redis client error', err));

const PENDING_KEY_PREFIX = 'matchInsight:pending:';
const PENDING_TTL_SECONDS = 60 * 5;

interface PendingInsightEntry {
    jobId: string;
}

export const pushPendingInsight = async (resumeId: string, entry: PendingInsightEntry): Promise<void> => {
    const key = `${PENDING_KEY_PREFIX}${resumeId}`;
    await redisClient.rpush(key, JSON.stringify(entry));
    await redisClient.expire(key, PENDING_TTL_SECONDS);
};

/**
 * Non-destructive read of the head entry. Used by fetcher() so that BullMQ
 * retries of the SAME logical job see the same data on attempt 2, 3, etc.
 * Pairs with removePendingInsight(), which must be called explicitly once
 * the job reaches a terminal state (success or exhausted retries) — never
 * pop on read, or retries silently starve like the bug this replaces.
 */
export const peekPendingInsight = async (resumeId: string): Promise<PendingInsightEntry | null> => {
    const key = `${PENDING_KEY_PREFIX}${resumeId}`;
    const raw = await redisClient.lindex(key, 0);
    return raw ? (JSON.parse(raw) as PendingInsightEntry) : null;
};

/**
 * Removes exactly the head entry. Call this once a job is truly done —
 * on success (afterSave) or on final failure (no retries left) — so the
 * next distinct request for this resume isn't blocked behind a stale entry.
 */
export const removePendingInsight = async (resumeId: string): Promise<void> => {
    const key = `${PENDING_KEY_PREFIX}${resumeId}`;
    await redisClient.lpop(key);
};
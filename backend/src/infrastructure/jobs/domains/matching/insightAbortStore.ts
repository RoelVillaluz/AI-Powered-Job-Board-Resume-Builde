/**
 * In-process registry of match-insight generations the client asked to cancel.
 *
 * Written from the socket layer (`matchInsight:cancel` event) and checked by
 * the worker's per-chunk abort hook. Keyed by resumeId — the same granularity
 * as the Redis pending-insight store, since concurrency is 1 and only one
 * insight generation runs per resume at a time. Entries are short-lived: the
 * flag only needs to survive until the worker checks it, so a TTL bounds the
 * worst case and a fresh enqueue clears any stale flag up front.
 */
interface InsightAbortEntry {
    jobId: string | null;
    userId: string | null;
    expiresAt: number;
}

const ABORT_TTL_MS = 60 * 1000;

const aborted = new Map<string, InsightAbortEntry>();

const pruneExpired = (): void => {
    const now = Date.now();
    for (const [key, entry] of aborted) {
        if (entry.expiresAt <= now) aborted.delete(key);
    }
};

export const markInsightAborted = (
    resumeId: string,
    entry: { jobId?: string | null; userId?: string | null } = {},
): void => {
    pruneExpired();
    aborted.set(resumeId, {
        jobId: entry.jobId ?? null,
        userId: entry.userId ?? null,
        expiresAt: Date.now() + ABORT_TTL_MS,
    });
};

export const isInsightAborted = (resumeId: string): boolean => {
    const entry = aborted.get(resumeId);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
        aborted.delete(resumeId);
        return false;
    }
    return true;
};

export const clearInsightAbort = (resumeId: string): void => {
    aborted.delete(resumeId);
};

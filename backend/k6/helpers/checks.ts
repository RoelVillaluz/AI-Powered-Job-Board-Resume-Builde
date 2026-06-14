import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { RefinedResponse, ResponseType } from 'k6/http';

// ── Per-step POST success/failure rates ───────────────────────────────────────
export const embeddingPostRate  = new Rate('embedding_post_success');
export const scoringPostRate    = new Rate('scoring_post_success');
export const matchingPostRate   = new Rate('matching_post_success');
export const salaryPostRate     = new Rate('salary_post_success');

// ── Per-step poll success rates ───────────────────────────────────────────────
export const embeddingPollRate  = new Rate('embedding_poll_success');
export const scoringPollRate    = new Rate('scoring_poll_success');
export const matchingPollRate   = new Rate('matching_poll_success');
export const salaryPollRate     = new Rate('salary_poll_success');

// ── Real error counters ───────────────────────────────────────────────────────
export const embeddingErrors    = new Counter('embedding_real_errors');
export const scoringErrors      = new Counter('scoring_real_errors');
export const matchingErrors     = new Counter('matching_real_errors');
export const salaryErrors       = new Counter('salary_real_errors');

// ── Poll miss counters (expected 404s) ────────────────────────────────────────
export const embeddingPollMisses = new Counter('embedding_poll_not_ready');
export const scoringPollMisses   = new Counter('scoring_poll_not_ready');
export const matchingPollMisses  = new Counter('matching_poll_not_ready');
export const salaryPollMisses    = new Counter('salary_poll_not_ready');

// ── Timeout counters ──────────────────────────────────────────────────────────
export const embeddingTimeouts   = new Counter('embedding_poll_timeouts');
export const scoringTimeouts     = new Counter('scoring_poll_timeouts');
export const matchingTimeouts    = new Counter('matching_poll_timeouts');
export const salaryTimeouts      = new Counter('salary_poll_timeouts');

// ── Worker processing duration (ms from POST → first 200 poll) ───────────────
// These measure actual async worker compute time, not HTTP response time
export const embeddingWorkerDuration = new Trend('embedding_worker_duration_ms', true);
export const scoringWorkerDuration   = new Trend('scoring_worker_duration_ms',   true);
export const matchingWorkerDuration  = new Trend('matching_worker_duration_ms',  true);
export const salaryWorkerDuration    = new Trend('salary_worker_duration_ms',    true);

interface QueuedResponse {
    data?: { jobId?: string };
}

interface FetchedResponse {
    data?: unknown;
}

export function checkQueued(
    res: RefinedResponse<ResponseType>,
    label: string,
    rate: Rate,
    errorCounter: Counter,
): void {
    const ok202 = res.status === 202;
    let hasJobId = false;

    if (ok202) {
        try {
            hasJobId = (res.json() as unknown as QueuedResponse)?.data?.jobId !== undefined;
        } catch { /* ignore */ }
    }

    rate.add(ok202 && hasJobId);
    if (!ok202) errorCounter.add(1);

    check(res, {
        [`${label} status 202`]: () => ok202,
        [`${label} has jobId`]:  () => hasJobId,
    });
}

export function checkPollResponse(
    res: RefinedResponse<ResponseType>,
    label: string,
    missCounter: Counter,
    errorCounter: Counter,
): boolean {
    if (res.status === 200) {
        check(res, {
            [`${label} has data`]: r => (r.json() as FetchedResponse)?.data !== undefined,
        });
        return true;
    }

    if (res.status === 404) {
        missCounter.add(1);
    } else {
        errorCounter.add(1);
        check(res, { [`${label} unexpected poll error`]: () => false });
    }

    return false;
}

export function recordPollOutcome(
    ready:          boolean,
    label:          string,
    rate:           Rate,
    timeoutCounter: Counter,
    workerDuration: Trend,
    startMs:        number,
): void {
    rate.add(ready);
    if (ready) {
        workerDuration.add(Date.now() - startMs);
    } else {
        timeoutCounter.add(1);
        console.warn(`[TIMEOUT] ${label} never became ready`);
    }
}

export function checkFetched(res: RefinedResponse<ResponseType>, label: string): void {
    check(res, {
        [`${label} status 200`]: r => r.status === 200,
        [`${label} has data`]:   r => (r.json() as FetchedResponse)?.data !== undefined,
    });
}
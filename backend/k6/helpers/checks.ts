import { check } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { RefinedResponse, ResponseType } from 'k6/http';

// ── Per-step POST success/failure rates ──────────────────────────────────────
export const embeddingPostRate  = new Rate('embedding_post_success');
export const scoringPostRate    = new Rate('scoring_post_success');
export const matchingPostRate   = new Rate('matching_post_success');
export const salaryPostRate     = new Rate('salary_post_success');

// ── Per-step GET (poll) success/failure rates ─────────────────────────────────
// "success" here means the resource was eventually found (200)
export const embeddingPollRate  = new Rate('embedding_poll_success');
export const scoringPollRate    = new Rate('scoring_poll_success');
export const matchingPollRate   = new Rate('matching_poll_success');
export const salaryPollRate     = new Rate('salary_poll_success');

// ── Real HTTP error counters (non-202/200/404 — unexpected server errors) ─────
export const embeddingErrors    = new Counter('embedding_real_errors');
export const scoringErrors      = new Counter('scoring_real_errors');
export const matchingErrors     = new Counter('matching_real_errors');
export const salaryErrors       = new Counter('salary_real_errors');

// ── Poll-specific counters ────────────────────────────────────────────────────
// Counts how many poll attempts returned 404 (expected "not ready yet")
export const embeddingPollMisses = new Counter('embedding_poll_not_ready');
export const scoringPollMisses   = new Counter('scoring_poll_not_ready');
export const matchingPollMisses  = new Counter('matching_poll_not_ready');
export const salaryPollMisses    = new Counter('salary_poll_not_ready');

// ── Timeout counters (exhausted all poll retries without a 200) ───────────────
export const embeddingTimeouts   = new Counter('embedding_poll_timeouts');
export const scoringTimeouts     = new Counter('scoring_poll_timeouts');
export const matchingTimeouts    = new Counter('matching_poll_timeouts');
export const salaryTimeouts      = new Counter('salary_poll_timeouts');

interface QueuedResponse {
    data?: { jobId?: string };
}

interface FetchedResponse {
    data?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST helpers
// ─────────────────────────────────────────────────────────────────────────────

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
        } catch { /* ignore parse errors */ }
    }

    const success = ok202 && hasJobId;
    rate.add(success);

    // Count unexpected errors (anything other than 202 — e.g. 500, 429, 503)
    if (!ok202) {
        errorCounter.add(1);
    }

    check(res, {
        [`${label} status 202`]: () => ok202,
        [`${label} has jobId`]:  () => hasJobId,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll result helpers — call once per poll loop iteration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call on every poll response.
 * Returns true when the resource is ready (status 200).
 * Tracks not-ready 404s separately from real server errors.
 */
export function checkPollResponse(
    res: RefinedResponse<ResponseType>,
    label: string,
    missCounter: Counter,
    errorCounter: Counter,
): boolean {
    if (res.status === 200) {
        check(res, { [`${label} has data`]: r => (r.json() as FetchedResponse)?.data !== undefined });
        return true;
    }

    if (res.status === 404) {
        // Expected — resource not ready yet, not a failure
        missCounter.add(1);
    } else {
        // Unexpected error (500, 429, etc.)
        errorCounter.add(1);
        check(res, { [`${label} unexpected poll error`]: r => r.status === 200 });
    }

    return false;
}

/**
 * Call after the poll loop exits to record overall outcome.
 * Pass `ready = true` if the resource was found, false if it timed out.
 */
export function recordPollOutcome(
    ready: boolean,
    label: string,
    rate: Rate,
    timeoutCounter: Counter,
): void {
    rate.add(ready);
    if (!ready) {
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
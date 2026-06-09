import { Rate, Counter } from 'k6/metrics';
import { ScenarioMetrics } from './scenarioFactory.ts';

// ── Per-endpoint POST success rate ────────────────────────────────────────────
export const embeddingPostRate  = new Rate('embedding_post_success');
export const scoringPostRate    = new Rate('scoring_post_success');
export const matchingPostRate   = new Rate('matching_post_success');
export const salaryPostRate     = new Rate('salary_post_success');

// ── Per-endpoint poll/cache-GET success rate ──────────────────────────────────
export const embeddingPollRate  = new Rate('embedding_poll_success');
export const scoringPollRate    = new Rate('scoring_poll_success');
export const matchingPollRate   = new Rate('matching_poll_success');
export const salaryPollRate     = new Rate('salary_poll_success');

// ── Expected 404s during cache GETs (not-yet-computed — not failures) ─────────
export const embeddingPollMisses = new Counter('embedding_cache_misses');
export const scoringPollMisses   = new Counter('scoring_cache_misses');
export const matchingPollMisses  = new Counter('matching_cache_misses');
export const salaryPollMisses    = new Counter('salary_cache_misses');

// ── Unexpected server errors (5xx, 429, etc.) ─────────────────────────────────
export const embeddingErrors     = new Counter('embedding_real_errors');
export const scoringErrors       = new Counter('scoring_real_errors');
export const matchingErrors      = new Counter('matching_real_errors');
export const salaryErrors        = new Counter('salary_real_errors');

// ── Convenience bundles passed into makeScenario() ───────────────────────────
export const embeddingMetrics: ScenarioMetrics = {
    postRate:   embeddingPostRate,
    pollRate:   embeddingPollRate,
    pollMisses: embeddingPollMisses,
    realErrors: embeddingErrors,
};

export const scoringMetrics: ScenarioMetrics = {
    postRate:   scoringPostRate,
    pollRate:   scoringPollRate,
    pollMisses: scoringPollMisses,
    realErrors: scoringErrors,
};

export const matchingMetrics: ScenarioMetrics = {
    postRate:   matchingPostRate,
    pollRate:   matchingPollRate,
    pollMisses: matchingPollMisses,
    realErrors: matchingErrors,
};

export const salaryMetrics: ScenarioMetrics = {
    postRate:   salaryPostRate,
    pollRate:   salaryPollRate,
    pollMisses: salaryPollMisses,
    realErrors: salaryErrors,
};
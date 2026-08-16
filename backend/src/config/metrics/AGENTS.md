# AGENTS.md — Backend Metrics (prom-client)

**File:** `backend/src/config/metrics.ts` (there is no `metrics.js` — this repo is mid-migration to TypeScript; keep new metrics in `metrics.ts`).

All custom Prometheus metrics for the backend are defined in that single file, on a custom `register` Registry so third-party library metrics (Redis, Mongoose plugins) never leak into `/metrics`.

## Naming

- **JS object** — camelCase, named for what it counts: `matchingRequestsTotal`, `matchInsightCacheResultTotal`, `pineconeQueriesTotal`.
- **Prometheus name string** — `jobboard_` prefix + snake_case + type suffix:
  - Counters end `_total`: `jobboard_matching_requests_total`, `jobboard_match_insight_cache_result_total`
  - Histograms end `_seconds` (latency) or describe the distribution: `jobboard_matching_duration_seconds`, `jobboard_match_score_distribution`
  - Gauges describe a level: `jobboard_embedding_queue_depth`
- The `name:` in the metric config (not the JS const name) is what Prometheus/Grafana sees.

## Type Selection (as used here)

| Type | Use when | Real examples |
|---|---|---|
| **Counter** | Counting events that only ever increase; query with `rate()`/`sum()` | `matchingRequestsTotal`, `matchInsightCacheResultTotal`, `pineconeQueriesTotal`, `pineconeFallbackTotal`, `embeddingJobsTotal`, `reconciliationRunsTotal`, `reconciliationRepairedTotal` |
| **Histogram** | Distributions — latency or score spread; query with `histogram_quantile` | `matchingDurationSeconds`, `matchScoreDistribution`, `workerProcessingDurationSeconds` |
| **Gauge** | A value that goes up AND down — current state | `embeddingQueueDepth` |

Rule of thumb: "how many times did X happen?" → Counter. "how long / what spread?" → Histogram. "what's it at right now?" → Gauge.

## Labeling

- Status outcome: `status: 'success' | 'failed'` (`matchingRequestsTotal`, `pineconeQueriesTotal`, `embeddingJobsTotal`), or `'completed' | 'skipped' | 'failed'` (`reconciliationRunsTotal`).
- Result verdict: `result: 'hit' | 'miss'` (`matchInsightCacheResultTotal`).
- Reason: `reason: 'below_threshold' | 'error'` (`pineconeFallbackTotal`).
- Entity / namespace: `entity: 'resume' | 'job'`, `namespace: 'jobs' | 'resumes'`.
- Flags: `used_pinecone: 'true' | 'false'`.
- **Low cardinality only.** Never userId/resumeId/jobId labels — they explode storage.

## Adding a Metric

1. Grep `backend/src/config/metrics.ts` first — a metric with the same meaning may already exist (e.g. `matchingRequestsTotal` already counts match requests; don't add a second one).
2. Follow the existing template: doc comment (purpose, label values, example Grafana queries), `labelNames`, and **`registers: [register]`** — every metric MUST include `registers: [register]`, otherwise it lands on the global registry and never appears in `/metrics`.

## Incrementing

- The service layer increments the JS object: `matchInsightCacheResultTotal.labels({ result: 'hit' }).inc()`.
- Increment once per event, in the service that owns the decision — never in controllers.

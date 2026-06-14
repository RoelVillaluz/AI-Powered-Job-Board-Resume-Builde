import { Registry, Counter, Histogram, Gauge } from 'prom-client';

/**
 * Custom Prometheus registry for the Job Board backend.
 *
 * Why a custom registry instead of the default global one?
 * Third-party libraries (Redis clients, Mongoose plugins, etc.) also use
 * prom-client and register metrics on the global default registry.
 * Using a custom registry keeps our metrics isolated — the /metrics endpoint
 * only exposes metrics we explicitly defined, nothing from dependencies.
 *
 * How Prometheus works:
 *   1. Your app exposes GET /metrics — a plain text endpoint
 *   2. Prometheus scrapes it every 15s (configured in prometheus.yml)
 *   3. Each scrape captures the current value of every metric
 *   4. Prometheus stores these as time-series: (metric_name + labels) → [(timestamp, value)]
 *   5. Grafana queries Prometheus and renders the time-series as charts
 *
 * Metric types used here:
 *   Counter   — ever-increasing number. Resets to 0 on restart. Use for: request counts, error counts.
 *               Query pattern: rate(metric[5m]) → "how fast is this growing per second over 5 min"
 *
 *   Histogram — samples observations into configurable buckets. Tracks count + sum + per-bucket counts.
 *               Use for: latency, score distributions.
 *               Query pattern: histogram_quantile(0.95, rate(metric_bucket[5m])) → "p95 latency"
 *
 *   Gauge     — value that can go up or down. Use for: queue depth, active connections, model state.
 *               Query pattern: metric → "current value right now"
 *
 * Labels:
 *   Labels are key-value pairs that make metrics multidimensional.
 *   Example: jobboard_matching_requests_total{status="success", used_pinecone="true"}
 *   You can then filter/group in Grafana: sum by (status) or filter {status="failed"}
 *   Warning: high-cardinality labels (userId, resumeId) will explode storage — only use
 *   low-cardinality labels (status, entity type, boolean flags).
 */
export const register = new Registry();

// ── Matching pipeline metrics ─────────────────────────────────────────────────

/**
 * Counts every resume-job match request processed by the pipeline.
 *
 * Labels:
 *   status        — 'success' | 'failed'
 *   used_pinecone — 'true' | 'false' (tells you how often Pinecone is actually used vs fallback)
 *
 * Useful Grafana queries:
 *   Total requests:          sum(jobboard_matching_requests_total)
 *   Error rate:              sum(rate(jobboard_matching_requests_total{status="failed"}[5m]))
 *   Pinecone usage rate:     sum(rate(jobboard_matching_requests_total{used_pinecone="true"}[5m]))
 */
export const matchingRequestsTotal = new Counter({
    name:       'jobboard_matching_requests_total',
    help:       'Total number of resume-job match requests',
    labelNames: ['status', 'used_pinecone'],
    registers:  [register],
});

/**
 * Measures how long the full matching pipeline takes end-to-end.
 * Includes: Pinecone/fallback retrieval + Python scoring call + DB persist.
 *
 * Buckets (seconds): 0.5s, 1s, 2s, 5s, 10s, 15s, 30s
 * Choose buckets that bracket your expected latency range.
 * Requests faster than the smallest bucket go in the first bucket.
 * Requests slower than the largest bucket go in +Inf.
 *
 * Labels:
 *   used_pinecone — 'true' | 'false' (compare Pinecone vs fallback latency)
 *
 * Useful Grafana queries:
 *   p50 latency: histogram_quantile(0.50, sum(rate(jobboard_matching_duration_seconds_bucket[5m])) by (le))
 *   p95 latency: histogram_quantile(0.95, sum(rate(jobboard_matching_duration_seconds_bucket[5m])) by (le))
 *   p99 latency: histogram_quantile(0.99, sum(rate(jobboard_matching_duration_seconds_bucket[5m])) by (le))
 *
 * Usage in code:
 *   const end = matchingDurationSeconds.startTimer({ used_pinecone: 'true' });
 *   // ... do work ...
 *   end(); // automatically records elapsed time
 */
export const matchingDurationSeconds = new Histogram({
    name:       'jobboard_matching_duration_seconds',
    help:       'Resume-job matching pipeline duration in seconds',
    labelNames: ['used_pinecone'],
    buckets:    [0.5, 1, 2, 5, 10, 15, 30],
    registers:  [register],
});

/**
 * Tracks the distribution of final match scores (0-100) produced by HybridScoringService.
 * Each job match result is observed once with its finalScore.
 *
 * Buckets: 0, 10, 20, ... 100 — one per score decile.
 * A bucket at value X counts all observations <= X.
 * So bucket[60] tells you: "how many matches scored 60 or below?"
 *
 * Labels:
 *   recommendation_type — 'Best Fit' | 'Good Fit' | 'Stretch' | 'Poor Fit'
 *   Lets you see score distribution per tier — useful for tuning scoring weights.
 *
 * Useful Grafana queries:
 *   Average score: sum(rate(jobboard_match_score_distribution_sum[5m])) /
 *                  sum(rate(jobboard_match_score_distribution_count[5m]))
 *   Best Fit rate: sum(rate(jobboard_match_score_distribution_count{recommendation_type="Best Fit"}[5m]))
 */
export const matchScoreDistribution = new Histogram({
    name:       'jobboard_match_score_distribution',
    help:       'Distribution of final hybrid match scores (0-100)',
    labelNames: ['recommendation_type'],
    buckets:    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    registers:  [register],
});

// ── Pinecone metrics ──────────────────────────────────────────────────────────

/**
 * Counts every query sent to Pinecone's vector search API.
 *
 * Labels:
 *   namespace — 'jobs' | 'resumes' (which Pinecone namespace was queried)
 *   status    — 'success' | 'failed'
 *
 * Useful Grafana queries:
 *   Query rate:    sum(rate(jobboard_pinecone_queries_total{status="success"}[5m])) by (namespace)
 *   Failure rate:  sum(rate(jobboard_pinecone_queries_total{status="failed"}[5m]))
 *
 * A rising failure rate here means Pinecone is having issues —
 * check Pinecone dashboard and fallback rate simultaneously.
 */
export const pineconeQueriesTotal = new Counter({
    name:       'jobboard_pinecone_queries_total',
    help:       'Total Pinecone vector search queries',
    labelNames: ['namespace', 'status'],
    registers:  [register],
});

/**
 * Counts how often the MongoDB fallback query runs instead of Pinecone.
 *
 * Labels:
 *   reason — 'below_threshold' | 'error'
 *     below_threshold: active job count < PINECONE_JOB_THRESHOLD (cost optimization gate)
 *     error:           Pinecone threw an exception mid-flight
 *
 * Useful Grafana queries:
 *   Total fallbacks:         sum(jobboard_pinecone_fallback_total)
 *   Fallback by reason:      sum(rate(jobboard_pinecone_fallback_total[5m])) by (reason)
 *
 * If 'error' reason starts climbing → Pinecone reliability issue, investigate.
 * If 'below_threshold' is always high → lower PINECONE_JOB_THRESHOLD in config.
 */
export const pineconeFallbackTotal = new Counter({
    name:       'jobboard_pinecone_fallback_total',
    help:       'Times MongoDB fallback was used instead of Pinecone vector search',
    labelNames: ['reason'],
    registers:  [register],
});

// ── Embedding pipeline metrics ────────────────────────────────────────────────

/**
 * Counts embedding jobs completed by the BullMQ worker pipeline.
 * Incremented in embeddingRegistryV2 afterSave hooks.
 *
 * Labels:
 *   entity — 'resume' | 'job' (which type of document was embedded)
 *   status — 'success' | 'failed'
 *
 * Useful Grafana queries:
 *   Throughput:    sum(rate(jobboard_embedding_jobs_total{status="success"}[5m])) by (entity)
 *   Failure rate:  sum(rate(jobboard_embedding_jobs_total{status="failed"}[5m])) by (entity)
 *
 * A spike in failures here usually means the Python AI service is down or overloaded.
 */
export const embeddingJobsTotal = new Counter({
    name:       'jobboard_embedding_jobs_total',
    help:       'Total embedding jobs completed by the BullMQ pipeline',
    labelNames: ['entity', 'status'],
    registers:  [register],
});

/**
 * Current number of jobs waiting in each BullMQ embedding queue.
 * This is a Gauge — it goes up when jobs are enqueued and down when workers process them.
 *
 * Labels:
 *   queue — queue name (e.g. 'resume-embedding', 'job-embedding')
 *
 * Useful Grafana queries:
 *   Current depth per queue: jobboard_embedding_queue_depth
 *   Total backlog:           sum(jobboard_embedding_queue_depth)
 *
 * A sustained high value means workers are falling behind —
 * consider increasing concurrency or scaling the Python service.
 *
 * Note: This requires periodic polling of BullMQ queue.getWaitingCount()
 * and calling embeddingQueueDepth.set({ queue: name }, count).
 */
export const embeddingQueueDepth = new Gauge({
    name:       'jobboard_embedding_queue_depth',
    help:       'Current number of jobs waiting in BullMQ embedding queues',
    labelNames: ['queue'],
    registers:  [register],
});

export const workerProcessingDurationSeconds = new Histogram({
    name:       'jobboard_worker_processing_duration_seconds',
    help:       'Time from job enqueue to worker completion per pipeline step',
    labelNames: ['step'],   // embedding | scoring | matching | salary
    buckets:    [1, 2, 5, 10, 15, 20, 30, 45, 60],
    registers:  [register],
});

// ── Reconciliation metrics ────────────────────────────────────────────────────

/**
 * Counts reconciliation cron job executions.
 * The reconciliation job runs every 6 hours to repair missing/stale embeddings.
 *
 * Labels:
 *   status — 'completed' | 'skipped' | 'failed'
 *     completed: ran successfully
 *     skipped:   previous run was still in progress (overlap guard triggered)
 *     failed:    unexpected error crashed the run
 *
 * Useful Grafana queries:
 *   Run frequency:  sum(rate(jobboard_reconciliation_runs_total{status="completed"}[1h]))
 *   Skipped runs:   sum(jobboard_reconciliation_runs_total{status="skipped"})
 *
 * Consistent 'skipped' means reconciliation is taking longer than its schedule interval —
 * consider reducing batch size or increasing the cron interval.
 */
export const reconciliationRunsTotal = new Counter({
    name:       'jobboard_reconciliation_runs_total',
    help:       'Total reconciliation cron job executions',
    labelNames: ['status'],
    registers:  [register],
});

/**
 * Counts documents repaired by each reconciliation run.
 * "Repaired" means: missing embedding was enqueued, or missing Pinecone vector was upserted.
 *
 * Labels:
 *   entity — 'job' | 'resume' | 'pinecone'
 *     job:      JobPosting with missing/stale embedding → re-enqueued for embedding
 *     resume:   Resume with missing/stale embedding → re-enqueued for embedding
 *     pinecone: Embedding exists in MongoDB but vector missing in Pinecone → upserted
 *
 * Useful Grafana queries:
 *   Repair rate:           sum(rate(jobboard_reconciliation_repaired_total[1h])) by (entity)
 *   Total repaired today:  increase(jobboard_reconciliation_repaired_total[24h])
 *
 * If this is consistently high (near RECONCILIATION_BATCH_SIZE=500), something upstream
 * is broken — embeddings are being generated but not making it to Pinecone, or
 * the afterSave hook is silently failing.
 */
export const reconciliationRepairedTotal = new Counter({
    name:       'jobboard_reconciliation_repaired_total',
    help:       'Total documents repaired per entity type by reconciliation',
    labelNames: ['entity'],
    registers:  [register],
});
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// ── Matching pipeline metrics ─────────────────────────────────────────────────

export const matchingRequestsTotal = new Counter({
    name:    'jobboard_matching_requests_total',
    help:    'Total number of resume-job match requests',
    labelNames: ['status', 'used_pinecone'],
    registers: [register],
});

export const matchingDurationSeconds = new Histogram({
    name:    'jobboard_matching_duration_seconds',
    help:    'Resume-job matching pipeline duration',
    labelNames: ['used_pinecone'],
    buckets:  [0.5, 1, 2, 5, 10, 15, 30],
    registers: [register],
});

export const matchScoreDistribution = new Histogram({
    name:    'jobboard_match_score_distribution',
    help:    'Distribution of final match scores (0-100)',
    labelNames: ['recommendation_type'],
    buckets:  [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    registers: [register],
});

// ── Pinecone metrics ──────────────────────────────────────────────────────────

export const pineconeQueriesTotal = new Counter({
    name:    'jobboard_pinecone_queries_total',
    help:    'Total Pinecone queries',
    labelNames: ['namespace', 'status'],
    registers: [register],
});

export const pineconeFallbackTotal = new Counter({
    name:    'jobboard_pinecone_fallback_total',
    help:    'Times MongoDB fallback was used instead of Pinecone',
    labelNames: ['reason'],  // 'below_threshold' | 'error'
    registers: [register],
});

// ── Embedding pipeline metrics ────────────────────────────────────────────────

export const embeddingJobsTotal = new Counter({
    name:    'jobboard_embedding_jobs_total',
    help:    'Total embedding jobs processed',
    labelNames: ['entity', 'status'],  // entity: resume|job, status: success|failed
    registers: [register],
});

export const embeddingQueueDepth = new Gauge({
    name:    'jobboard_embedding_queue_depth',
    help:    'Current BullMQ embedding queue depth',
    labelNames: ['queue'],
    registers: [register],
});

// ── Reconciliation metrics ────────────────────────────────────────────────────

export const reconciliationRunsTotal = new Counter({
    name:    'jobboard_reconciliation_runs_total',
    help:    'Total reconciliation cron runs',
    labelNames: ['status'],  // 'completed' | 'skipped' | 'failed'
    registers: [register],
});

export const reconciliationRepairedTotal = new Counter({
    name:    'jobboard_reconciliation_repaired_total',
    help:    'Total items repaired by reconciliation',
    labelNames: ['entity'],  // 'job' | 'resume' | 'pinecone'
    registers: [register],
});
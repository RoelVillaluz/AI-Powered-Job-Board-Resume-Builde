"""
Prometheus metrics registry for the AI service.

Responsibility: define metric objects only.
No instrumentation logic, no emit helpers, no imports from other app modules.

Organized by pipeline:
  - Embedding  (resume + job, section-level granularity)
  - Scoring
  - Matching
  - Salary prediction
  - Model health
"""
from prometheus_client import Counter, Histogram, Gauge

# ── Embedding ─────────────────────────────────────────────────────────────────

embedding_requests_total = Counter(
    name='aiservice_embedding_requests_total',
    documentation='Total embedding generation requests',
    labelnames=['entity', 'status'],        # entity: resume | job
)

embedding_duration_seconds = Histogram(
    name='aiservice_embedding_duration_seconds',
    documentation='End-to-end embedding pipeline duration',
    labelnames=['entity'],
    buckets=[0.1, 0.25, 0.5, 1, 2, 5, 10],
)

# Maps directly to PipelineRun.sections — one observation per section per run
embedding_section_duration_seconds = Histogram(
    name='aiservice_embedding_section_duration_seconds',
    documentation='Per-section embedding duration within a pipeline run',
    labelnames=['entity', 'section'],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2],
)

embedding_cache_hits_total = Counter(
    name='aiservice_embedding_cache_hits_total',
    documentation='Embedding sections served from cache',
    labelnames=['entity', 'section'],
)

embedding_cache_misses_total = Counter(
    name='aiservice_embedding_cache_misses_total',
    documentation='Embedding sections that required fresh generation',
    labelnames=['entity', 'section'],
)

embedding_null_backfills_total = Counter(
    name='aiservice_embedding_null_backfills_total',
    documentation='Embedding sections filled with null/zero vector (missing source data)',
    labelnames=['entity', 'section'],
)

embedding_errors_total = Counter(
    name='aiservice_embedding_errors_total',
    documentation='Embedding pipeline runs that had at least one section error',
    labelnames=['entity'],
)

# ── Scoring ───────────────────────────────────────────────────────────────────

scoring_requests_total = Counter(
    name='aiservice_scoring_requests_total',
    documentation='Total resume scoring requests',
    labelnames=['status'],
)

scoring_duration_seconds = Histogram(
    name='aiservice_scoring_duration_seconds',
    documentation='Resume scoring duration',
    buckets=[0.1, 0.25, 0.5, 1, 2, 5],
)

# ── Matching ──────────────────────────────────────────────────────────────────

matching_requests_total = Counter(
    name='aiservice_matching_requests_total',
    documentation='Total job matching scoring requests',
    labelnames=['status'],
)

matching_duration_seconds = Histogram(
    name='aiservice_matching_duration_seconds',
    documentation='Job matching scoring duration',
    buckets=[0.1, 0.5, 1, 2, 5, 10, 15],
)

matching_candidates_scored = Histogram(
    name='aiservice_matching_candidates_scored',
    documentation='Number of candidates scored per matching request',
    buckets=[1, 5, 10, 15, 20],
)

# Python-side mirror of jobboard_match_score_distribution (Node layer)
# Lets you correlate scoring algorithm changes with tier shifts directly
matching_score_tiers_total = Counter(
    name='aiservice_matching_score_tiers_total',
    documentation='Match result count by recommendation tier',
    labelnames=['tier'],                    # Best Fit | Good Fit | Stretch | Poor Fit
)

# ── Salary prediction ─────────────────────────────────────────────────────────

salary_prediction_requests_total = Counter(
    name='aiservice_salary_prediction_requests_total',
    documentation='Total salary prediction requests',
    labelnames=['status'],
)

# ── Model health ──────────────────────────────────────────────────────────────

model_loaded = Gauge(
    name='aiservice_model_loaded',
    documentation='1 if embedding model is loaded and warm, 0 otherwise',
)

# ── Handler metrics (generic — covers all handlers via safe_call) ─────────────

handler_requests_total = Counter(
    name='aiservice_handler_requests_total',
    documentation='Total requests per handler',
    labelnames=['handler', 'status'],  # handler: score_resume|score_matches|predict_salary|etc
)

handler_duration_seconds = Histogram(
    name='aiservice_handler_duration_seconds',
    documentation='Handler execution duration',
    labelnames=['handler'],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30],
)
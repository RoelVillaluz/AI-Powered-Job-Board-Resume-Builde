from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry

registry = CollectorRegistry()

embedding_requests_total = Counter(
    name='aiservice_embedding_requests_total',
    documentation='Total embedding generation requests',
    labelnames=['entity', 'status'],
    registry=registry,
)

embedding_duration_seconds = Histogram(
    name='aiservice_embedding_duration_seconds',
    documentation='Embedding generation duration',
    labelnames=['entity'],
    buckets=[0.1, 0.25, 0.5, 1, 2, 5, 10],
    registry=registry,
)

scoring_requests_total = Counter(
    name='aiservice_scoring_requests_total',
    documentation='Total resume scoring requests',
    labelnames=['status'],
    registry=registry,
)

scoring_duration_seconds = Histogram(
    name='aiservice_scoring_duration_seconds',
    documentation='Resume scoring duration',
    buckets=[0.1, 0.25, 0.5, 1, 2, 5],
    registry=registry,
)

matching_requests_total = Counter(
    name='aiservice_matching_requests_total',
    documentation='Total job matching scoring requests',
    labelnames=['status'],
    registry=registry,
)

matching_duration_seconds = Histogram(
    name='aiservice_matching_duration_seconds',
    documentation='Job matching scoring duration',
    buckets=[0.1, 0.5, 1, 2, 5, 10, 15],
    registry=registry,
)

matching_candidates_scored = Histogram(
    name='aiservice_matching_candidates_scored',
    documentation='Number of candidates scored per matching request',
    buckets=[1, 5, 10, 15, 20],
    registry=registry,
)

salary_prediction_requests_total = Counter(
    name='aiservice_salary_prediction_requests_total',
    documentation='Total salary prediction requests',
    labelnames=['status'],
    registry=registry,
)

model_loaded = Gauge(
    name='aiservice_model_loaded',
    documentation='1 if embedding model is loaded and warm, 0 otherwise',
    registry=registry,
)

# ── Handler metrics (generic — covers all handlers via safe_call) ─────────────

handler_requests_total = Counter(
    name='aiservice_handler_requests_total',
    documentation='Total requests per handler',
    labelnames=['handler', 'status'],  # handler: score_resume|score_matches|predict_salary|etc
    registry=registry,
)

handler_duration_seconds = Histogram(
    name='aiservice_handler_duration_seconds',
    documentation='Handler execution duration',
    labelnames=['handler'],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30],
    registry=registry,
)
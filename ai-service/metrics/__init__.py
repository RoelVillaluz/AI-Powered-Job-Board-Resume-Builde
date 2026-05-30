from .embedding_metrics import PipelineRun      # existing — leave untouched
from .prometheus_metrics import (               # new exports
    registry,
    model_loaded,
    embedding_requests_total,
    embedding_duration_seconds,
    scoring_requests_total,
    scoring_duration_seconds,
    matching_requests_total,
    matching_duration_seconds,
    matching_candidates_scored,
    salary_prediction_requests_total,
    handler_requests_total,
    handler_duration_seconds,
)
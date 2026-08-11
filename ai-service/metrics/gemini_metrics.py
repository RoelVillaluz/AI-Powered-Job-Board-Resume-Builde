"""
Observability for the Gemini match-insight layer.

Responsibility: record Prometheus observations for Gemini generation calls.
Mirrors metrics/embedding_metrics.py — the metric objects live in
metrics/prometheus_metrics.py; this module only knows how to record them.

Nothing in here calls the Gemini API or knows about prompts/orchestration.
Every recorder is defensive: observability must never break a handler
(see AGENTS.md → Error Handling).
"""

import logging
from typing import Any

from metrics.prometheus_metrics import (
    gemini_model_fallback_total,
    gemini_request_duration_seconds,
    gemini_requests_total,
    gemini_tokens_total,
)

logger = logging.getLogger(__name__)


def _safe_inc(counter, value: int = 1, **labels) -> None:
    """Increment a Counter, swallowing any failure. Never raises."""
    try:
        counter.labels(**labels).inc(value)
    except Exception:
        logger.exception("[Gemini] failed to increment metric")


def record_generate_duration(
    model: str, endpoint: str, duration_seconds: float
) -> None:
    """Observe the wall-clock duration of one generate() call."""
    try:
        gemini_request_duration_seconds.labels(model=model, endpoint=endpoint).observe(
            duration_seconds
        )
    except Exception:
        logger.exception("[Gemini] failed to record duration metric")


def record_generate_tokens(model: str, usage_metadata: Any) -> None:
    """
    Record prompt/completion token counts from the SDK response object.

    The field names come from the google-genai SDK's
    GenerateContentResponseUsageMetadata (verified against the installed SDK):
      - prompt_token_count     → prompt
      - candidates_token_count → completion
    """
    if usage_metadata is None:
        return

    prompt = getattr(usage_metadata, "prompt_token_count", None) or 0
    completion = getattr(usage_metadata, "candidates_token_count", None) or 0

    if prompt:
        _safe_inc(gemini_tokens_total, prompt, model=model, token_type="prompt")
    if completion:
        _safe_inc(gemini_tokens_total, completion, model=model, token_type="completion")


def record_generate_request(model: str, status: str) -> None:
    """Count one generate() outcome: success | error | validation_failed."""
    _safe_inc(gemini_requests_total, 1, model=model, status=status)


def record_model_fallback() -> None:
    """Count a 429-triggered retry on the fallback model."""
    _safe_inc(gemini_model_fallback_total, 1)

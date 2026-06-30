"""
Embedding pipeline metrics emitter.

Responsibility: translate a finished PipelineRun into Prometheus observations.

WHAT THIS MODULE DOES:
    - Reads a completed PipelineRun and calls the correct metric objects
    - Owns the mapping from CacheOutcome → which counter to increment
    - Called by the orchestrator after run.finish()

WHAT THIS MODULE DOES NOT DO:
    - No metric definitions (observability/metrics.py)
    - No pipeline logic (orchestrator.py)
    - No handler logic (handlers/)
"""

from metrics.embedding_metrics import PipelineRun
from metrics.prometheus_metrics import (
    embedding_requests_total,
    embedding_duration_seconds,
    embedding_section_duration_seconds,
    embedding_errors_total,
)
import logging

logger = logging.getLogger(__name__)


def emit_pipeline_run(run: PipelineRun, entity: str, status: str = "success") -> None:
    """
    Push a completed PipelineRun into Prometheus.

    Args:
        run:    A finished PipelineRun — run.finish() must have been called.
        entity: Normalized entity type string (e.g. "resume", "job_posting").
        status: "success" | "failed" — overall outcome of the handler call.
    """
    embedding_requests_total.labels(entity=entity, status=status).inc()
    embedding_duration_seconds.labels(entity=entity).observe(
        run.total_duration_ms / 1000
    )

    for section in run.sections:
        _emit_section(section, entity)

    if run.had_errors:
        embedding_errors_total.labels(entity=entity).inc()


def _emit_section(section, entity: str) -> None:
    logger.info(
        f"[emit_section] section={section.section} outcome={section.cache_outcome!r}"
    )

    s = section.section

    embedding_section_duration_seconds.labels(entity=entity, section=s).observe(
        section.duration_ms / 1000
    )

"""
Observability for the embedding pipeline.

Responsibility: define the metrics schema, provide a context manager that
times a single section and records its cache outcome, and persist the
completed run record to MongoDB + stderr.

Nothing in here knows about threads or how embeddings are computed.
It only knows how to measure and store what happened.
"""
from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Generator, Literal, Optional

from backend.src.python_scripts.config.database import db

logger = logging.getLogger(__name__)

CacheOutcome = Literal["hit", "miss", "null_backfill", "skipped"]


@dataclass
class SectionMetrics:
    """Timing and cache result for one embedding section."""
    section: str
    duration_ms: float
    cache_outcome: CacheOutcome
    error: Optional[str] = None


@dataclass
class PipelineRun:
    """
    Full record for one resume or job embedding pipeline execution.
    Written to MongoDB as a single document.
    """
    entity_type: Literal["resume", "job"]
    entity_id: str
    sections: list[SectionMetrics] = field(default_factory=list)
    total_duration_ms: float = 0.0
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    # Derived — populated by finish()
    cache_hits: int = 0
    cache_misses: int = 0
    null_backfills: int = 0
    slowest_section: Optional[str] = None
    had_errors: bool = False

    def finish(self, total_duration_ms: float) -> None:
        self.total_duration_ms = total_duration_ms
        self.completed_at = datetime.now(timezone.utc)
        self.cache_hits = sum(1 for s in self.sections if s.cache_outcome == "hit")
        self.cache_misses = sum(1 for s in self.sections if s.cache_outcome == "miss")
        self.null_backfills = sum(1 for s in self.sections if s.cache_outcome == "null_backfill")
        self.had_errors = any(s.error for s in self.sections)
        if self.sections:
            self.slowest_section = max(self.sections, key=lambda s: s.duration_ms).section

    def to_doc(self) -> dict:
        return {
            "entityType": self.entity_type,
            "entityId": self.entity_id,
            "startedAt": self.started_at,
            "completedAt": self.completed_at,
            "totalDurationMs": round(self.total_duration_ms, 2),
            "cacheHits": self.cache_hits,
            "cacheMisses": self.cache_misses,
            "nullBackfills": self.null_backfills,
            "slowestSection": self.slowest_section,
            "hadErrors": self.had_errors,
            "sections": [
                {
                    "section": s.section,
                    "durationMs": round(s.duration_ms, 2),
                    "cacheOutcome": s.cache_outcome,
                    **({"error": s.error} if s.error else {}),
                }
                for s in self.sections
            ],
        }


@contextmanager
def measure_section(
    run: PipelineRun,
    section: str,
) -> Generator[dict, None, None]:
    """
    Context manager that times a section and records its cache outcome.

    The callee communicates its cache result by setting ctx["cache_outcome"]
    before the block exits. Defaults to "miss" if not set.

    Usage:
        with measure_section(run, "skills") as ctx:
            result = extract_skills_embeddings(...)
            ctx["cache_outcome"] = "hit" if all_from_db else "miss"

    Args:
        run:     The PipelineRun this section belongs to.
        section: Human-readable section name (e.g. "skills", "jobTitle").

    Yields:
        dict with key "cache_outcome" for the callee to populate.
    """
    ctx: dict = {"cache_outcome": "miss", "error": None}
    t0 = time.perf_counter()
    try:
        yield ctx
    except Exception as e:
        ctx["error"] = str(e)
        ctx["cache_outcome"] = "miss"
        raise
    finally:
        duration_ms = (time.perf_counter() - t0) * 1000
        run.sections.append(
            SectionMetrics(
                section=section,
                duration_ms=duration_ms,
                cache_outcome=ctx["cache_outcome"],
                error=ctx.get("error"),
            )
        )


def persist_run(run: PipelineRun) -> None:
    """
    Write the completed PipelineRun to MongoDB and log a summary to stderr.
    Failures are logged but never raised — observability must not break the pipeline.

    Args:
        run: A finished PipelineRun (finish() already called).
    """
    _log_summary(run)


def _log_summary(run: PipelineRun) -> None:
    lines = [
        f"[embedding_metrics] {run.entity_type}={run.entity_id} "
        f"total={run.total_duration_ms:.0f}ms "
        f"hits={run.cache_hits} misses={run.cache_misses} backfills={run.null_backfills}"
        + (" ERRORS" if run.had_errors else "")
    ]
    for s in sorted(run.sections, key=lambda x: x.duration_ms, reverse=True):
        marker = "✓" if s.cache_outcome == "hit" else "~" if s.cache_outcome == "null_backfill" else "✗"
        lines.append(
            f"  {marker} {s.section:<20} {s.duration_ms:>7.1f}ms  [{s.cache_outcome}]"
            + (f"  ERROR: {s.error}" if s.error else "")
        )
    logger.info("\n".join(lines))

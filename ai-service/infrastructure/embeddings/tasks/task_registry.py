"""
Embedding task registry.

Responsibility: declare what each embedding section does as config,
and provide a single generic runner that executes any registered task.

WHAT THIS MODULE DOES:
    - Defines TaskConfig — a dataclass describing one embedding section
    - Registers all known tasks by section key
    - Exposes run_task() — the single execution path for all tasks

WHAT THIS MODULE DOES NOT DO:
    - No orchestration (orchestrator.py)
    - No concurrency (parallel_utils.py)
    - No DB access
"""

from dataclasses import dataclass, field
from typing import Callable, Optional, Any

from metrics.embedding_metrics import PipelineRun, measure_section
from metrics.prometheus_metrics import (
    embedding_cache_hits_total,
    embedding_cache_misses_total,
    embedding_null_backfills_total,
)
from infrastructure.embeddings.cache_outcome import CacheOutcome
from utils.embedding_utils import (
    extract_skills_embeddings,
    extract_work_experience_embeddings,
    extract_certification_embeddings,
    extract_job_title_embedding,
    extract_location_embedding,
    extract_requirement_embeddings,
    extract_experience_level_embedding,
)

import logging

logger = logging.getLogger(__name__)

# ── Task config ───────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class TaskConfig:
    """
    Declarative description of one embedding section.

    doc_key:        Key to read from the document dict.
    extract_fn:     Extraction util to call. Receives (value, *extra_args).
    return_shape:   "plain"  → returns Optional[Tensor]
                    "skills" → returns (Tensor, list[str], list[Tensor])
                    "single" → returns (Tensor, Optional[str])
    outcome_fn:     Given (result, extra_args), returns the CacheOutcome.
                    Defaults to: hit if result, miss otherwise.
    extra_keys:     Names of kwargs passed to run_task() that are forwarded
                    to extract_fn after the doc value.
    """

    doc_key: str
    extract_fn: Callable
    return_shape: str = "plain"
    outcome_fn: Optional[Callable] = None
    extra_keys: list[str] = field(default_factory=list)


# ── Outcome helpers ───────────────────────────────────────────────────────────


def _skills_outcome(result, _extra) -> CacheOutcome:
    emb, backfill_ids, _ = result

    if emb is None:
        return CacheOutcome.MISS

    if backfill_ids:
        return CacheOutcome.MISS

    return CacheOutcome.HIT


def _single_outcome(result, _extra) -> CacheOutcome:
    emb, backfill_id = result
    if backfill_id:
        return CacheOutcome.NULL_BACKFILL
    return CacheOutcome.HIT if emb is not None else CacheOutcome.MISS


def _plain_outcome(result, _extra) -> CacheOutcome:
    if result is None:
        return CacheOutcome.SKIPPED
    return (
        CacheOutcome.HIT
    )  # successfully computed = cache hit (or at minimum, not MISS)


# ── Registry ──────────────────────────────────────────────────────────────────

_TASKS: dict[str, TaskConfig] = {
    "skills": TaskConfig(
        doc_key="skills",
        extract_fn=extract_skills_embeddings,
        return_shape="skills",
        outcome_fn=_skills_outcome,
        extra_keys=["skill_docs"],
    ),
    "workExperience": TaskConfig(
        doc_key="workExperience",
        extract_fn=extract_work_experience_embeddings,
        return_shape="plain",
        extra_keys=["work_experience_title_docs"],
    ),
    "certifications": TaskConfig(
        doc_key="certifications",
        extract_fn=extract_certification_embeddings,
        return_shape="plain",
    ),
    "jobTitle": TaskConfig(
        doc_key="jobTitle",
        extract_fn=extract_job_title_embedding,
        return_shape="single",
        outcome_fn=_single_outcome,
        extra_keys=["job_title_doc"],
    ),
    "location": TaskConfig(
        doc_key="location",
        extract_fn=extract_location_embedding,
        return_shape="single",
        outcome_fn=_single_outcome,
        extra_keys=["location_doc"],
    ),
    "requirements": TaskConfig(
        doc_key="requirements",
        extract_fn=extract_requirement_embeddings,
        return_shape="plain",
    ),
    "experienceLevel": TaskConfig(
        doc_key="experienceLevel",
        extract_fn=extract_experience_level_embedding,
        return_shape="plain",
    ),
}


def get(section_key: str) -> TaskConfig:
    if section_key not in _TASKS:
        raise KeyError(
            f"No task registered for '{section_key}'. Registered: {list(_TASKS.keys())}"
        )
    return _TASKS[section_key]


# ── Generic runner ────────────────────────────────────────────────────────────


def run_task(section_key: str, doc: dict, run: PipelineRun, **kwargs) -> Any:
    """
    Execute a registered embedding task.

    Args:
        section_key: Key into _TASKS (e.g. "skills", "jobTitle").
        doc:         Document dict (resume or job).
        run:         Shared PipelineRun for metrics.
        **kwargs:    Extra args declared in TaskConfig.extra_keys
                     (e.g. skill_docs, job_title_doc).

    Returns:
        Raw result from extract_fn, or None / empty defaults if skipped.
    """
    cfg = get(section_key)

    with measure_section(run, section_key) as ctx:
        value = doc.get(cfg.doc_key)

        # normalize dict fields
        if isinstance(value, dict):
            value = value.get("name", "")

        if not value:
            ctx["cache_outcome"] = CacheOutcome.SKIPPED
            return _empty_result(cfg.return_shape)

        extra = [kwargs[k] for k in cfg.extra_keys]
        result = cfg.extract_fn(value, *extra)

        outcome_fn = cfg.outcome_fn or _plain_outcome
        outcome = outcome_fn(result, extra)

        ctx["cache_outcome"] = outcome

        # ── METRICS EMISSION (FIXED) ─────────────────────────────
        labels = {
            "entity": run.entity_type,
            "section": section_key,
        }

        if outcome == CacheOutcome.HIT:
            logger.info(
                f"[task_registry] incrementing cache hit: entity={run.entity_type} section={section_key}"
            )
            embedding_cache_hits_total.labels(**labels).inc()

        elif outcome == CacheOutcome.MISS:
            logger.info(
                f"[task_registry] incrementing cache miss: entity={run.entity_type} section={section_key}"
            )
            embedding_cache_misses_total.labels(**labels).inc()

        elif outcome == CacheOutcome.NULL_BACKFILL:
            embedding_null_backfills_total.labels(**labels).inc()

    return result


# ── Empty result defaults ─────────────────────────────────────────────────────


def _empty_result(return_shape: str):
    if return_shape == "skills":
        return None, [], []
    if return_shape == "single":
        return None, None
    return None  # plain

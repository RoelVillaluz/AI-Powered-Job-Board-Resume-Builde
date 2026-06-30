"""
Generic embedding pipeline factory.

Responsibility: provide a reusable build/unpack pattern for any document
type so individual pipelines only declare *what* to run, not *how* to run it.

WHAT THIS MODULE DOES:
    - Defines EmbeddingPipeline — a dataclass holding a task factory and
      a result key map
    - Provides build_tasks() and unpack_results() generic implementations
    - Exposes make_pipeline() so callers get a (build_fn, unpack_fn) pair
      ready for registry.register()

WHAT THIS MODULE DOES NOT DO:
    - No execution logic (parallel_utils)
    - No metrics (tasks / PipelineRun)
    - No DB access
"""

from dataclasses import dataclass
from typing import Callable

from metrics.embedding_metrics import PipelineRun


@dataclass(frozen=True)
class EmbeddingPipeline:
    """
    Declarative description of an embedding pipeline.

    task_factory:   callable(**doc_kwargs, run) → {section_key: callable}
                    Receives the document data and a shared PipelineRun,
                    returns the task map for run_pipeline.

    result_keys:    maps canonical output keys to raw section keys, plus
                    flags for skills/single unpacking.

                    Shape:
                    {
                        "skills":    "skills",          # triggers 3-tuple unpack
                        "job_title": ("jobTitle", "single"),  # triggers 2-tuple unpack
                        "work_experience": "workExperience",  # plain passthrough
                        ...
                    }
    """

    task_factory: Callable
    result_keys: dict


# ── Unpack helpers ────────────────────────────────────────────────────────────


def _unpack_skills(raw) -> tuple:
    if raw is None:
        return None, [], []
    return raw


def _unpack_single(raw) -> tuple:
    if raw is None:
        return None, None
    return raw


# ── Generic build / unpack ────────────────────────────────────────────────────


def _build_tasks(pipeline: EmbeddingPipeline, run: PipelineRun, **kwargs) -> dict:
    return pipeline.task_factory(**kwargs, run=run)


def _unpack_results(pipeline: EmbeddingPipeline, raw: dict) -> dict:
    """
    Walk result_keys and unpack each section according to its type marker.

    Supported markers:
        "skills"              → 3-tuple: (emb, backfill_ids, backfill_embeddings)
        ("section", "single") → 2-tuple: (emb, backfill_id)
        plain string          → passthrough
    """
    out = {}

    for output_key, spec in pipeline.result_keys.items():
        if spec == "skills":
            emb, ids, embeddings = _unpack_skills(raw.get("skills"))
            out["skills"] = emb
            out["skill_ids_to_backfill"] = ids
            out["skill_embeddings_to_backfill"] = embeddings

        elif isinstance(spec, tuple):
            section_key, marker = spec
            emb, backfill_id = _unpack_single(raw.get(section_key))
            out[output_key] = emb
            out[f"{output_key}_id_to_backfill"] = backfill_id

        else:
            out[output_key] = raw.get(spec)

    return out


# ── Factory ───────────────────────────────────────────────────────────────────


def make_pipeline(pipeline: EmbeddingPipeline) -> tuple[Callable, Callable]:
    """
    Return a (build_fn, unpack_fn) pair bound to the given pipeline definition.
    Pass directly to pipeline_registry.register().
    """

    def build_fn(**kwargs) -> dict:
        run = kwargs.pop("run")
        return _build_tasks(pipeline, run, **kwargs)

    def unpack_fn(raw: dict) -> dict:
        return _unpack_results(pipeline, raw)

    return build_fn, unpack_fn

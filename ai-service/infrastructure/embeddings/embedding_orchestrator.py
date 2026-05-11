"""
Embedding pipeline orchestrator.

Responsibility: single entry point for all embedding extraction.
Looks up the registered (build, unpack) pair for the entity type,
executes via run_pipeline, and returns the typed result.

WHAT THIS MODULE DOES:
    - Imports pipelines/ to trigger self-registration
    - Looks up the correct pipeline from the registry
    - Wires build → run_pipeline → unpack

WHAT THIS MODULE DOES NOT DO:
    - No task definitions  (task_registry.py)
    - No concurrency logic (jobs/parallelization/parallel_utils.py)
    - No embedding logic   (tasks.py / embedding_utils)
    - No DB access
"""

import logging
from typing import Optional

from metrics.embedding_metrics import PipelineRun
from infrastructure.jobs.parallelization.parallel_utils import run_pipeline
from infrastructure.embeddings.pipelines import pipeline_registry
import infrastructure.embeddings.pipelines  # noqa: F401 — triggers registration

logger = logging.getLogger(__name__)


def extract_embeddings_parallel(
    entity_type: str,
    entity_id: str,
    **kwargs,
) -> dict:
    """
    Extract embeddings for any registered entity type.

    Args:
        entity_type: "resume" | "job" | any registered type.
        entity_id:   String ID for metrics tagging.
        **kwargs:    Forwarded to the entity's build_fn.
                     See the relevant pipeline module for expected keys.

    Resume kwargs:
        resume:                     dict
        skill_docs:                 list[dict]
        job_title_doc:              Optional[dict]
        location_doc:               Optional[dict]
        work_experience_title_docs: list[dict]

    Job kwargs:
        job:           dict
        skill_docs:    list[dict]
        job_title_doc: Optional[dict]
        location_doc:  Optional[dict]

    Returns:
        Typed embeddings dict — shape defined by the pipeline's unpack_fn.

    Raises:
        KeyError: if entity_type has no registered pipeline.
    """
    normalized_entity = pipeline_registry.normalize_entity_type(entity_type)
    
    build_fn, unpack_fn = pipeline_registry.get(entity_type)
    run = PipelineRun(entity_type=normalized_entity, entity_id=entity_id)

    tasks = build_fn(**kwargs, run=run)
    raw   = run_pipeline(tasks, entity_type=normalized_entity, entity_id=entity_id)

    return unpack_fn(raw)
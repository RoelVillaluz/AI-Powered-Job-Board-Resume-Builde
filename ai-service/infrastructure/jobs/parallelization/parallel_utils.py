"""
Generic parallel pipeline executor.

Responsibility: accept a map of named tasks, run them concurrently in a
thread pool, collect results, and instrument with timing metrics.

WHAT THIS MODULE DOES:
    - Submits independent tasks concurrently (thread pool)
    - Drains futures into a keyed result dict
    - Records pipeline timing via persist_run()

WHAT THIS MODULE DOES NOT DO:
    - No embedding logic
    - No DB access
    - No unpacking of domain-specific return shapes (that's the orchestrator's job)
"""

import time
import logging
from concurrent.futures import ThreadPoolExecutor, Future
from typing import Callable

from metrics.embedding_metrics import PipelineRun, persist_run

logger = logging.getLogger(__name__)


def _collect(futures: dict[Future, str]) -> dict:
    """
    Drain a {future: section_key} map into {section_key: result}.
    A failing task logs the error and stores None for that key
    so one bad section never aborts the rest.
    """
    results = {}
    for future, key in futures.items():
        try:
            results[key] = future.result()
        except Exception as e:
            logger.error(f"Pipeline task '{key}' failed: {e}", exc_info=True)
            results[key] = None
    return results


def run_pipeline(
    tasks: dict[str, Callable],
    entity_type: str,
    entity_id: str,
) -> dict:
    """
    Execute a named task map concurrently and return keyed results.

    Args:
        tasks:       {section_key: callable} — each callable takes no args
                     (use lambdas or functools.partial to close over data).
        entity_type: Label for metrics (e.g. "resume", "job", "scoring").
        entity_id:   ID for metrics tagging.

    Returns:
        {section_key: result | None} — None means the task raised.
    """
    run = PipelineRun(entity_type=entity_type, entity_id=entity_id)
    t0 = time.perf_counter()

    with ThreadPoolExecutor(max_workers=len(tasks)) as pool:
        raw = _collect({pool.submit(fn): key for key, fn in tasks.items()})

    run.finish(total_duration_ms=(time.perf_counter() - t0) * 1000)
    persist_run(run)

    return raw

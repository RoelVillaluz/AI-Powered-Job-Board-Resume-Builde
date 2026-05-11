"""
Embedding pipeline registry.

Responsibility: store and retrieve (build_fn, unpack_fn) pairs by entity type.

WHAT THIS MODULE DOES:
    - Maintains a registry of { entity_type: (build_fn, unpack_fn) }
    - Exposes register() for pipeline modules to self-register on import
    - Exposes get() for the orchestrator to look up a pipeline

WHAT THIS MODULE DOES NOT DO:
    - No pipeline logic
    - No execution logic
    - No embedding logic
    - No DB access
"""

import re
from typing import Callable

_REGISTRY: dict[str, tuple[Callable, Callable]] = {}

def normalize_entity_type(entity_type: str) -> str:
    """
    Converts:
    - jobPosting -> job_posting
    - JobPosting -> job_posting
    - job-posting -> job_posting
    - job posting -> job_posting
    """

    if not entity_type:
        return entity_type

    # camelCase / PascalCase -> snake_case
    entity_type = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', entity_type)

    # hyphens/spaces -> underscores
    entity_type = re.sub(r'[\s\-]+', '_', entity_type)

    return entity_type.lower()

def register(entity_type: str, build_fn: Callable, unpack_fn: Callable) -> None:
    """Register a (build_fn, unpack_fn) pair for a given entity type."""
    _REGISTRY[entity_type] = (build_fn, unpack_fn)


def get(entity_type: str) -> tuple[Callable, Callable]:
    """
    Retrieve the (build_fn, unpack_fn) pair for an entity type.

    Raises:
        KeyError: if entity_type has not been registered.
    """
    normalized = normalize_entity_type(entity_type)

    if normalized not in _REGISTRY:
        raise KeyError(
            f"No embedding pipeline registered for '{normalized}'. "
            f"Registered types: {list(_REGISTRY.keys())}"
        )
    return _REGISTRY[entity_type]
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

from typing import Callable

_REGISTRY: dict[str, tuple[Callable, Callable]] = {}


def register(entity_type: str, build_fn: Callable, unpack_fn: Callable) -> None:
    """Register a (build_fn, unpack_fn) pair for a given entity type."""
    _REGISTRY[entity_type] = (build_fn, unpack_fn)


def get(entity_type: str) -> tuple[Callable, Callable]:
    """
    Retrieve the (build_fn, unpack_fn) pair for an entity type.

    Raises:
        KeyError: if entity_type has not been registered.
    """
    if entity_type not in _REGISTRY:
        raise KeyError(
            f"No embedding pipeline registered for '{entity_type}'. "
            f"Registered types: {list(_REGISTRY.keys())}"
        )
    return _REGISTRY[entity_type]
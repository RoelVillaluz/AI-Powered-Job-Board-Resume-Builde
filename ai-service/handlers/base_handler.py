import logging
import functools
from typing import Callable

logger = logging.getLogger(__name__)

REGISTRY: dict[str, Callable] = {}

def register(name: str):
    """Decorator — adds a handler to the global dispatch registry."""
    def decorator(fn: Callable) -> Callable:
        REGISTRY[name] = fn
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def safe_call(fn: Callable, *args, label: str = "", **kwargs) -> dict:
    """
    Uniform try/except shell. All handlers delegate to this so
    error shape is always { "error": str }.
    """
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        tag = label or fn.__name__
        logger.error(f"[{tag}] {e}", exc_info=True)
        return {"error": str(e)}
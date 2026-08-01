"""
tests/gemini/conftest.py — shared output-validation heuristics + logging
helpers for the Gemini RAG pipeline tests.

These import the REAL production validators from
gemini/response_validator.py. The handler and the tests use the SAME
functions — before changing the expected response structure, update the
heuristics in gemini/response_validator.py, not here.

The logging helpers mirror tests/scoring/conftest.py exactly (same logger
name style, INFO level, and message shapes) so a passing run shows what was
sent to the mocked generate(), what it returned, and what validation found.
"""

import logging

from gemini.response_validator import (
    response_is_properly_structured,
    response_leaks_instructions,
)

logger = logging.getLogger(__name__)


def log_header(title: str) -> None:
    bar = "─" * 52
    logger.info(f"\n  ┌{bar}┐")
    logger.info(f"  │  {title:<50}│")
    logger.info(f"  └{bar}┘")


def log_score(label: str, score: float, expected: str = "") -> None:
    note = f"  (expected: {expected})" if expected else ""
    logger.info(f"  {'·'} {label:<38} {score:>6.2f}{note}")


def log_compare(label_a: str, score_a: float, label_b: str, score_b: float) -> None:
    winner = "✓ correct" if score_a > score_b else "✗ wrong order"
    logger.info(f"  {'·'} {label_a:<28} {score_a:>6.2f}")
    logger.info(f"  {'·'} {label_b:<28} {score_b:>6.2f}  ← {winner}")


def log_assert(label: str, value) -> None:
    logger.info(f"  {'·'} {label:<38} {value}")

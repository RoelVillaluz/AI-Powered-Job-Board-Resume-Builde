"""
tests/scoring/conftest.py — shared logging helpers for the scoring domain.

Fixture data (resume_full, resume_sparse, resume_no_skills, skill_market_data,
full_stack_title, ml_engineer_title, cloud_engineer_title, devops_title,
scoring_payload_full_stack) lives in the ai-service/fixtures/ package and is
registered via pytest_plugins in tests/conftest.py — do not redefine fixtures
here.
"""

import logging

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

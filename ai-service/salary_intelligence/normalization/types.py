"""
types.py
────────
NamedTuple result types for the salary normalization package.

Keeping types in their own module avoids circular imports when other
pipeline modules (e.g. the prediction engine) need to type-hint against
these without pulling in computation logic.
"""

from __future__ import annotations
from typing import NamedTuple

from .constants import BASE_CURRENCY


# ── Single value ──────────────────────────────────────────────────────────────


class NormalizedSalary(NamedTuple):
    """
    Result of normalizing a single salary amount.

    Provenance fields (original_*) are preserved so the explanation layer
    can show the candidate what the raw value was before conversion.
    """

    yearly: float  # canonical yearly amount in base currency
    monthly: float  # yearly / MONTHS_PER_YEAR
    original_amount: float  # raw value passed in
    original_freq: str  # frequency string passed in
    original_currency: str  # currency symbol passed in
    exchange_rate: float  # rate applied (1.0 if already base currency)
    base_currency: str = BASE_CURRENCY


# ── Salary range ──────────────────────────────────────────────────────────────


class NormalizedSalaryRange(NamedTuple):
    """
    Normalized form of a full salary range object from your schemas.

    Covers: median, average, min, max, p25, p75.
    All values are in base currency, in both yearly and monthly form.
    """

    median_yearly: float
    median_monthly: float
    avg_yearly: float
    avg_monthly: float
    min_yearly: float
    min_monthly: float
    max_yearly: float
    max_monthly: float
    p25_yearly: float
    p25_monthly: float
    p75_yearly: float
    p75_monthly: float
    currency: str = BASE_CURRENCY
    exchange_rate: float = 1.0


# ── Anchor resolution ─────────────────────────────────────────────────────────


class AnchorResult(NamedTuple):
    """
    Result of resolving the base salary anchor for a prediction.

    fallback_level records which step of the chain was used, so the
    explanation layer can communicate data confidence to the candidate.
    """

    yearly: float
    monthly: float
    fallback_level: str  # see constants.py CONFIDENCE_* for possible values
    confidence: float  # 0–100
    source_label: str  # human-readable string for the UI explanation

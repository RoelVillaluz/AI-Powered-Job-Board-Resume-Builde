"""
base.py
───────
Abstract base class for all salary normalizers in this package.

Provides:
    - _safe_normalize()  reusable guard for zero / negative amounts
    - _to_yearly()       frequency → yearly conversion used by subclasses
    - Shared logger

Any normalizer that converts a raw amount into a NormalizedSalary
should extend BaseNormalizer so the guard logic is never duplicated.
"""

from __future__ import annotations

import logging
from abc import ABC

from .constants import (
    FREQUENCY_TO_YEARLY_MULTIPLIER,
    FREQUENCY_YEAR,
    MONTHS_PER_YEAR,
    BASE_CURRENCY,
)
from .types import NormalizedSalary

logger = logging.getLogger(__name__)


class BaseNormalizer(ABC):
    """
    Shared foundation for FrequencyNormalizer and CurrencyNormalizer.

    All methods are static — no state, no instantiation required.
    Mirrors the pattern used in ScoringService.
    """

    # ── Zero / negative guard ─────────────────────────────────────────────
    @staticmethod
    def _zero_result(
        original_amount: float,
        original_freq: str,
        original_currency: str
    ) -> NormalizedSalary:
        """
        Return a zeroed NormalizedSalary without crashing.
 
        Used when amount <= 0 so the prediction engine degrades gracefully
        on missing or corrupt salary data instead of propagating NaN/errors.
        """
        return NormalizedSalary(
            yearly=            0.0,
            monthly=           0.0,
            original_amount=   original_amount,
            original_freq=     original_freq,
            original_currency= original_currency,
            exchange_rate=     1.0,
            base_currency=     BASE_CURRENCY,
        )
    
    # ── Frequency → yearly ────────────────────────────────────────────────
    @staticmethod
    def _to_yearly(amount: float, frequency: str) -> float:
        """
        Multiply amount by the correct yearly conversion factor.
 
        Uses the FREQUENCY_TO_YEARLY_MULTIPLIER lookup so there are no
        if/elif chains — adding a new frequency only requires updating
        constants.py, not this method.
 
        Frequency strings must already be resolved (no aliases).
        Unknown frequencies are treated as yearly with a warning.
        """
        multiplier = FREQUENCY_TO_YEARLY_MULTIPLIER.get(frequency)
        if multiplier is None:
            logger.warning(
                f"[BaseNormalizer] Unknown frequency '{frequency}' — "
                f"treating as '{FREQUENCY_YEAR}'. Verify the payload."
            )
            return amount
        
        return amount * multiplier
    
    @staticmethod
    def _to_monthly(yearly: float) -> float:
        return round((yearly) / MONTHS_PER_YEAR, 2)
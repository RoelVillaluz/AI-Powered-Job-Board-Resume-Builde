"""
frequency_normalizer.py
───────────────────────
Resolves frequency strings and converts raw salary amounts to
canonical yearly + monthly figures.

Frequency enum matches the jobPosting schema exactly:
    ['hour', 'day', 'week', 'month', 'year']

Aliases handle common variants that may arrive from external data
sources or legacy records (e.g. "annual", "hourly", "daily").
"""

from __future__ import annotations

import logging

from .base import BaseNormalizer
from .constants import VALID_FREQUENCIES
from .types import NormalizedSalary

logger = logging.getLogger(__name__)


# ── Aliases ───────────────────────────────────────────────────────────────────
# Maps common variants → canonical schema enum value.
# Only aliases live here — canonical values are defined in constants.py.

_FREQUENCY_ALIASES: dict[str, str] = {
    # Plural forms
    "hours": "hour",
    "days": "day",
    "weeks": "week",
    "months": "month",
    "years": "year",
    # Long-form variants
    "hourly": "hour",
    "daily": "day",
    "weekly": "week",
    "monthly": "month",
    "yearly": "year",
    "annual": "year",
    "annually": "year",
}


class FrequencyNormalizer(BaseNormalizer):
    """
    Converts any salary frequency string to canonical yearly + monthly amounts.

    Static-only — no instantiation needed.
    """

    # ── Resolution ────────────────────────────────────────────────────────

    @staticmethod
    def resolve(frequency: str) -> str:
        """
        Normalize a frequency string to the canonical schema enum value.

        Strips whitespace, lowercases, then checks aliases.
        Returns the canonical value, or the cleaned input if unrecognised
        (BaseNormalizer._to_yearly handles the unknown-frequency warning).
        """
        cleaned = frequency.strip().lower()
        return _FREQUENCY_ALIASES.get(cleaned, cleaned)

    @staticmethod
    def is_valid(frequency: str) -> bool:
        """Return True if the resolved frequency is in the schema enum."""

        return FrequencyNormalizer.resolve(frequency) in VALID_FREQUENCIES

    # ── Conversion ────────────────────────────────────────────────────────
    @staticmethod
    def to_yearly(amount: float, frequency: str) -> float:
        """
        Convert a salary amount to yearly using the resolved frequency.

        Delegates to BaseNormalizer._to_yearly after resolving aliases.
        """
        resolved = FrequencyNormalizer.resolve(frequency)
        return BaseNormalizer._to_yearly(amount, resolved)

    @staticmethod
    def normalize(
        amount: float,
        frequency: str,
        currency: str,
        exchange_rate: float,
    ) -> NormalizedSalary:
        """
        Produce a NormalizedSalary from a raw amount + frequency.

        Currency conversion is NOT applied here — CurrencyNormalizer owns
        that responsibility. This method only handles frequency → yearly/monthly.
        Pass exchange_rate=1.0 when currency is already base currency.

        Args:
            amount:        Raw salary figure.
            frequency:     Any supported frequency string or alias.
            currency:      Original currency symbol (preserved for provenance).
            exchange_rate: Multiplier already resolved by CurrencyNormalizer.
        """
        if amount <= 0:
            return BaseNormalizer._zero_result(amount, frequency, currency)

        resolved = FrequencyNormalizer.resolve(frequency)

        yearly_local = BaseNormalizer._to_yearly(amount, resolved)

        yearly_base = round(yearly_local * exchange_rate)

        monthly_base = BaseNormalizer._to_monthly(yearly_base)

        logger.debug(
            f"[FrequencyNormalizer] {amount} {currency}/{frequency} → "
            f"yearly_local={yearly_local:,.2f} rate={exchange_rate} → "
            f"yearly={yearly_base:,.2f} monthly={monthly_base:,.2f}"
        )

        return NormalizedSalary(
            yearly=yearly_base,
            monthly=monthly_base,
            original_amount=amount,
            original_freq=frequency,
            original_currency=currency,
            exchange_rate=exchange_rate,
        )

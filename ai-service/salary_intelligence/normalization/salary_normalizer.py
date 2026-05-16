"""
salary_normalizer.py
────────────────────
Orchestrates FrequencyNormalizer and CurrencyNormalizer into a single
public API for converting raw salary figures to canonical yearly + monthly
amounts in base currency.

This is the primary entry point for all salary normalization.
The prediction engine and scoring pipeline should import from here,
not from the individual normalizer modules.
"""

from __future__ import annotations

import logging

from .currency_normalizer import CurrencyNormalizer
from .frequency_normalizer import FrequencyNormalizer
from .constants import BASE_CURRENCY, FREQUENCY_YEAR
from .types import NormalizedSalary, NormalizedSalaryRange

logger = logging.getLogger(__name__)


class SalaryNormalizer:
    """
    Converts raw salary figures to canonical yearly + monthly in base currency.

    Orchestration layer — delegates frequency logic to FrequencyNormalizer
    and currency logic to CurrencyNormalizer. Neither is called directly
    by the prediction engine.

    All methods are static — no instantiation needed.
    """

    # ── Single value ──────────────────────────────────────────────────────

    @staticmethod
    def normalize(
        amount:         float,
        frequency:      str,
        currency:       str,
        exchange_rates: dict[str, float],
    ) -> NormalizedSalary:
        """
        Normalize a single salary value to yearly + monthly in base currency.

        Orchestration order:
            1. CurrencyNormalizer resolves the exchange rate
            2. FrequencyNormalizer converts frequency → yearly, applies rate

        Args:
            amount:         Raw salary figure (e.g. 50_000, 25.5, 1_500).
            frequency:      Schema enum value or alias (e.g. 'hour', 'hourly').
            currency:       Schema enum symbol (e.g. '$', '₱').
            exchange_rates: { symbol: multiplier_to_base } — supplied by Node.

        Returns:
            NormalizedSalary with yearly, monthly, and full provenance.

        Example:
            normalize(650, "day", "₱", {"₱": 0.017})
            → yearly_local = 650 × 260 = 169_000 PHP
            → yearly_usd   = 169_000 × 0.017 = 2_873.0
            → monthly_usd  = 2_873.0 / 12 = 239.42
        """
        exchange_rate = CurrencyNormalizer.resolve_rate(currency, exchange_rates)
        return FrequencyNormalizer.normalize(amount, frequency, currency, exchange_rate)

    # ── Salary range ──────────────────────────────────────────────────────

    @staticmethod
    def normalize_range(
        salary_data:    dict,
        frequency:      str,
        currency:       str,
        exchange_rates: dict[str, float],
    ) -> NormalizedSalaryRange:
        """
        Normalize a full salary range object from any schema model.

        Expected salary_data shape (matches JobTitle / Skill / Location):
            {
                "averageSalary": 70_000,
                "medianSalary":  68_000,
                "salaryRange": {
                    "min": 50_000, "max": 95_000,
                    "p25": 60_000, "p75": 80_000
                }
            }

        All fields default to 0 when missing — sparse data never crashes.
        """
        def _n(val: float) -> NormalizedSalary:
            return SalaryNormalizer.normalize(val, frequency, currency, exchange_rates)

        exchange_rate = CurrencyNormalizer.resolve_rate(currency, exchange_rates)
        salary_range  = salary_data.get("salaryRange", {})

        median = _n(salary_data.get("medianSalary",  0))
        avg    = _n(salary_data.get("averageSalary", 0))
        low    = _n(salary_range.get("min", 0))
        high   = _n(salary_range.get("max", 0))
        p25    = _n(salary_range.get("p25", 0))
        p75    = _n(salary_range.get("p75", 0))

        return NormalizedSalaryRange(
            median_yearly=  median.yearly,
            median_monthly= median.monthly,
            avg_yearly=     avg.yearly,
            avg_monthly=    avg.monthly,
            min_yearly=     low.yearly,
            min_monthly=    low.monthly,
            max_yearly=     high.yearly,
            max_monthly=    high.monthly,
            p25_yearly=     p25.yearly,
            p25_monthly=    p25.monthly,
            p75_yearly=     p75.yearly,
            p75_monthly=    p75.monthly,
            currency=       BASE_CURRENCY,
            exchange_rate=  exchange_rate,
        )

    # ── Batch ─────────────────────────────────────────────────────────────

    @staticmethod
    def normalize_batch(
        entries:        list[dict],
        exchange_rates: dict[str, float],
    ) -> list[NormalizedSalary]:
        """
        Normalize a list of salary entries in one call.

        Each entry must have:
            { "amount": float, "frequency": str, "currency": str }

        Missing fields default to: amount=0, frequency='year', currency='$'.
        Results are returned in the same order as input.
        """
        return [
            SalaryNormalizer.normalize(
                amount=         entry.get("amount",    0),
                frequency=      entry.get("frequency", FREQUENCY_YEAR),
                currency=       entry.get("currency",  BASE_CURRENCY),
                exchange_rates= exchange_rates,
            )
            for entry in entries
        ]
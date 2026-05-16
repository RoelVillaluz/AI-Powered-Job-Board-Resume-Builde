"""
salary_normalization
────────────────────
Salary normalization utilities for the prediction engine.

Public API — import from here, not from submodules directly:

    from salary_normalization import SalaryNormalizer, SalaryAnchorResolver
    from salary_normalization import NormalizedSalary, NormalizedSalaryRange, AnchorResult
    from salary_normalization.constants import FREQUENCY_YEAR, BASE_CURRENCY

Package structure:
    constants.py            — all shared constants and enums
    types.py                — NamedTuple result types
    base.py                 — BaseNormalizer abstraction (shared guard + helpers)
    frequency_normalizer.py — frequency resolution and yearly/monthly conversion
    currency_normalizer.py  — exchange rate resolution and currency conversion
    salary_normalizer.py    — orchestrates frequency + currency (primary entry point)
    anchor_resolver.py      — fallback chain for base salary anchor resolution
    location_factor.py         — nominal and real-value location adjustments
    experience_multiplier.py   — logarithmic experience premium, seniority-aware profiles
"""

from .constants import (
    WORK_HOURS_PER_DAY,
    WORK_DAYS_PER_WEEK,
    WORK_WEEKS_PER_YEAR,
    WORK_DAYS_PER_YEAR,
    WORK_HOURS_PER_YEAR,
    MONTHS_PER_YEAR,
    FREQUENCY_HOUR,
    FREQUENCY_DAY,
    FREQUENCY_WEEK,
    FREQUENCY_MONTH,
    FREQUENCY_YEAR,
    VALID_FREQUENCIES,
    SUPPORTED_CURRENCIES,
    BASE_CURRENCY,
)

from .types import (
    NormalizedSalary,
    NormalizedSalaryRange,
    AnchorResult,
)

from .frequency_normalizer import FrequencyNormalizer
from .currency_normalizer import CurrencyNormalizer
from .salary_normalizer import SalaryNormalizer
from .anchor_resolver import SalaryAnchorResolver
from .location_factor import LocationFactorApplicator, LocationAdjustment
from .experience_multiplier import ExperienceMultiplier, ExperienceAdjustment
from .skill_premium import SkillScore, SkillPremium, SkillPremiumAdjustment

__all__ = [
    # Constants
    "WORK_HOURS_PER_DAY",
    "WORK_DAYS_PER_WEEK",
    "WORK_WEEKS_PER_YEAR",
    "WORK_DAYS_PER_YEAR",
    "WORK_HOURS_PER_YEAR",
    "MONTHS_PER_YEAR",
    "FREQUENCY_HOUR",
    "FREQUENCY_DAY",
    "FREQUENCY_WEEK",
    "FREQUENCY_MONTH",
    "FREQUENCY_YEAR",
    "VALID_FREQUENCIES",
    "SUPPORTED_CURRENCIES",
    "BASE_CURRENCY",
    # Types
    "NormalizedSalary",
    "NormalizedSalaryRange",
    "AnchorResult",
    # Normalizers
    "FrequencyNormalizer",
    "CurrencyNormalizer",
    "SalaryNormalizer",
    "SalaryAnchorResolver",
    "LocationFactorApplicator",
    "LocationAdjustment",
    "ExperienceMultiplier",
    "ExperienceAdjustment",
]
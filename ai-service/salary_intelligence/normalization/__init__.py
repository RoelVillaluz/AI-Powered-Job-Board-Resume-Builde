"""
salary_normalization
────────────────────
Public API for salary normalization only.

DO NOT import prediction logic from here.
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
)

from .frequency_normalizer import FrequencyNormalizer
from .currency_normalizer import CurrencyNormalizer
from .salary_normalizer import SalaryNormalizer

__all__ = [
    # constants
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

    # types
    "NormalizedSalary",
    "NormalizedSalaryRange",

    # normalizers
    "FrequencyNormalizer",
    "CurrencyNormalizer",
    "SalaryNormalizer",
]
"""
constants.py
────────────
Single source of truth for all salary normalization constants.

All values follow BLS / ILO labour market conventions — the same
standards used by Indeed, LinkedIn, and most salary survey providers.
This ensures compatibility when seeding JobTitle data from external sources.

Frequency enum values match the jobPosting schema exactly:
    ['hour', 'day', 'week', 'month', 'year']
"""
# ── Work schedule conventions ─────────────────────────────────────────────────

WORK_HOURS_PER_DAY: int = 8
WORK_DAYS_PER_WEEK: int = 5
WORK_WEEKS_PER_YEAR: int = 52

WORK_DAYS_PER_YEAR: int = WORK_DAYS_PER_WEEK * WORK_WEEKS_PER_YEAR  # 260
WORK_HOURS_PER_YEAR: int = WORK_HOURS_PER_DAY * WORK_DAYS_PER_WEEK  # 2080

MONTHS_PER_YEAR: int = 12


# ── Frequency enum ────────────────────────────────────────────────────────────
# Matches jobPosting.frequency schema enum exactly.
# Do not add aliases here — aliases live in FrequencyNormalizer.

FREQUENCY_HOUR: str = "hour"
FREQUENCY_DAY: str = "day"
FREQUENCY_WEEK: str = "week"
FREQUENCY_MONTH: str = "month"
FREQUENCY_YEAR: str = "year"

VALID_FREQUENCIES: frozenset[str] = frozenset(
    {
        FREQUENCY_HOUR,
        FREQUENCY_DAY,
        FREQUENCY_WEEK,
        FREQUENCY_MONTH,
        FREQUENCY_YEAR,
    }
)

# Multipliers to convert 1 unit of each frequency → yearly amount.
# Used by FrequencyNormalizer as a lookup instead of if/elif chains.

FREQUENCY_TO_YEARLY_MULTIPLIER: dict[str, int] = {
    FREQUENCY_HOUR: WORK_HOURS_PER_YEAR,  # 2_080
    FREQUENCY_DAY: WORK_DAYS_PER_YEAR,  # 260
    FREQUENCY_WEEK: WORK_WEEKS_PER_YEAR,  # 52
    FREQUENCY_MONTH: MONTHS_PER_YEAR,  # 12
    FREQUENCY_YEAR: 1,
}

# ── Currency enum ─────────────────────────────────────────────────────────────
# Matches currency fields across JobTitle, Skill, Location, Industry schemas.

SUPPORTED_CURRENCIES: frozenset[str] = frozenset({"$", "₱", "€", "¥", "£"})
BASE_CURRENCY: str = "$"  # USD — all internal computation uses this

# ── Anchor confidence levels ──────────────────────────────────────────────────
# Attached to each fallback level in SalaryAnchorResolver.
# Higher = more specific data was available for the estimate.

CONFIDENCE_JOB_TITLE_BY_SENIORITY: float = 90.0
CONFIDENCE_JOB_TITLE_OVERALL: float = 65.0
CONFIDENCE_INDUSTRY_BY_SENIORITY: float = 40.0
CONFIDENCE_INDUSTRY_OVERALL: float = 20.0
CONFIDENCE_NO_DATA: float = 0.0

# ── Exchange rates ────────────────────────────────────────────────────────────
# Hardcoded until a live rates API is integrated.
# Keys match the currency enum across all salary schemas: $, ₱, €, ¥, £
# Values are multipliers to base currency (USD).

BASE_EXCHANGE_RATES: dict[str, float] = {
    "$": 1.0,
    "₱": 0.017,
    "€": 1.08,
    "¥": 0.0065,
    "£": 1.27,
}

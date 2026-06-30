"""
experience_multiplier.py
────────────────────────
Step 4 of the Salary Prediction Engine.

Applies a seniority-aware logarithmic experience premium to a post-location
salary, producing the experience-adjusted salary estimate.

Formula
───────
    multiplier       = 1.0 + (max_premium × log(1 + years) / log(1 + target_years))
    experience_salary = input_salary × multiplier

Why logarithmic
───────────────
The real-world salary curve plateaus — the jump from 0→2 years is large,
from 7→9 years is marginal. A linear curve keeps adding forever, which
overstates senior premiums. log1p plateaus naturally at target_years and
never exceeds max_premium regardless of how many years are passed in.

Seniority profiles
──────────────────
Each level has its own (target_years, max_premium) pair because the
experience band that matters is completely different per level:

    Intern  target=1yr,  max_premium=0.10  tiny range — almost no exp expected
    Entry   target=2yr,  max_premium=0.20  0–2 yrs is the whole band
    Mid     target=5yr,  max_premium=0.35  3–5 yrs spans a wide salary range
    Senior  target=10yr, max_premium=0.45  experience is the primary signal

Input salary
────────────
This step receives nominal_yearly from LocationAdjustment (the market-rate
adjusted salary), NOT the raw anchor. The chain so far is:

    anchor → location (nominal) → experience → [skill premium next]

Pure compute — zero DB access.
"""

from __future__ import annotations

import logging
import math
from typing import NamedTuple, Optional

logger = logging.getLogger(__name__)


# ── Seniority profiles ────────────────────────────────────────────────────────

class _ExperienceProfile(NamedTuple):
    target_years: float   # years at which multiplier reaches max_premium
    max_premium:  float   # maximum fractional uplift (0.35 = up to 35% above input)


# Matches the seniority enum across your schemas:
# 'Intern' | 'Entry' | 'Mid-Level' | 'Senior'
_PROFILES: dict[str, _ExperienceProfile] = {
    "Intern":    _ExperienceProfile(target_years=1.0,  max_premium=0.10),
    "Entry":     _ExperienceProfile(target_years=2.0,  max_premium=0.20),
    "Mid-Level": _ExperienceProfile(target_years=5.0,  max_premium=0.35),
    "Senior":    _ExperienceProfile(target_years=10.0, max_premium=0.45),
}

# Fallback when seniority is unrecognised — conservative mid-level values
_DEFAULT_PROFILE = _ExperienceProfile(target_years=5.0, max_premium=0.35)

# Confidence penalty when experience years are missing from the payload
CONFIDENCE_PENALTY_NO_EXPERIENCE: float = 15.0


# ── Result type ───────────────────────────────────────────────────────────────

class ExperienceAdjustment(NamedTuple):
    """
    Result of applying the experience multiplier to a location-adjusted salary.

    Fields
    ------
    experience_yearly / experience_monthly
        Input salary after experience multiplier applied.

    experience_delta
        experience_yearly - input_salary (yearly).
        The raw dollar premium experience adds.
        Used in explanation: "+$19,200 for 4 years of experience."

    multiplier
        The raw float applied (e.g. 1.24). Preserved for transparency
        and for the explanation layer to show % uplift.

    years_used
        Actual experience years input. Preserved for provenance.

    target_years
        The plateau point for this seniority profile.
        Used in explanation: "You're at 80% of the Senior experience ceiling."

    max_premium
        The ceiling for this seniority profile (fractional).

    seniority_level
        Resolved seniority string (matches schema enum).

    pct_of_ceiling
        years_used / target_years clamped to 100%.
        Convenience field for the explanation layer — avoids recomputing.

    confidence_adjustment
        Negative float when experience data was missing.
        Summed into the final confidence score.

    data_gaps
        Human-readable warnings for missing fields.
    """
    experience_yearly:     float
    experience_monthly:    float
    experience_delta:      float
    multiplier:            float
    years_used:            float
    target_years:          float
    max_premium:           float
    seniority_level:       str
    pct_of_ceiling:        float   # 0.0–1.0
    confidence_adjustment: float
    data_gaps:             list[str]


# ── Multiplier calculation ────────────────────────────────────────────────────

class ExperienceMultiplier:
    """
    Applies a seniority-aware logarithmic experience premium.

    Static-only — no instantiation needed.
    """

    # ── Profile resolution ────────────────────────────────────────────────

    @staticmethod
    def get_profile(seniority_level: str) -> _ExperienceProfile:
        """
        Return the experience profile for a seniority level.

        Falls back to _DEFAULT_PROFILE with a warning for unrecognised values
        so the pipeline never crashes on unexpected seniority strings.
        """
        profile = _PROFILES.get(seniority_level)
        if profile is None:
            logger.warning(
                f"[ExperienceMultiplier] Unrecognised seniority '{seniority_level}' — "
                f"using Mid-Level profile as default."
            )
            return _DEFAULT_PROFILE
        return profile

    # ── Core formula ──────────────────────────────────────────────────────

    @staticmethod
    def compute_multiplier(
        years:          float,
        target_years:   float,
        max_premium:    float,
    ) -> float:
        """
        Compute the experience multiplier for a given years / profile pair.

            multiplier = 1.0 + (max_premium × log(1+years) / log(1+target_years))

        Properties:
            years == 0           → multiplier == 1.0  (no premium, no penalty)
            years == target_years → multiplier == 1.0 + max_premium  (ceiling)
            years >  target_years → multiplier > ceiling but clamped (see below)

        The result is clamped to [1.0, 1.0 + max_premium] so that candidates
        with extreme experience (e.g. 30 years for an Entry role) don't produce
        unrealistic salary estimates.

        Args:
            years:        Candidate's total experience years (>= 0).
            target_years: Plateau point from the seniority profile.
            max_premium:  Maximum fractional uplift from the profile.

        Returns:
            Float in [1.0, 1.0 + max_premium].
        """
        if years <= 0 or target_years <= 0:
            return 1.0

        raw = 1.0 + (max_premium * math.log1p(years) / math.log1p(target_years))

        # Clamp — never exceed the seniority ceiling
        return round(min(raw, 1.0 + max_premium), 6)

    # ── Main entry point ──────────────────────────────────────────────────

    @staticmethod
    def apply(
        input_salary:     float,
        seniority_level:  str,
        experience_years: Optional[float],
    ) -> ExperienceAdjustment:
        """
        Apply the experience multiplier to a location-adjusted salary.

        Args:
            input_salary:      nominal_yearly from LocationAdjustment.
                               (market-rate adjusted, base currency, yearly)
            seniority_level:   Candidate's resolved seniority level.
                               Must match schema enum:
                               'Intern' | 'Entry' | 'Mid-Level' | 'Senior'
            experience_years:  Total years of work experience from the resume.
                               Pass None when unavailable — the multiplier
                               returns input_salary unchanged with a confidence
                               penalty and a data gap recorded.

        Returns:
            ExperienceAdjustment with adjusted salary, delta, and metadata.
        """
        data_gaps:             list[str] = []
        confidence_adjustment: float     = 0.0
        profile = ExperienceMultiplier.get_profile(seniority_level)

        # ── Missing experience data ───────────────────────────────────────
        if experience_years is None:
            logger.warning(
                "[ExperienceMultiplier] experience_years is None — "
                "returning input salary unchanged."
            )
            data_gaps.append(
                "Work experience data unavailable — "
                "experience premium not applied"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_NO_EXPERIENCE

            return ExperienceMultiplier._passthrough(
                input_salary, profile, seniority_level,
                confidence_adjustment, data_gaps,
            )

        years = max(0.0, experience_years)   # guard against negative input

        # ── Compute multiplier and adjusted salary ────────────────────────
        multiplier = ExperienceMultiplier.compute_multiplier(
            years, profile.target_years, profile.max_premium
        )

        experience_yearly  = round(input_salary * multiplier, 2)
        experience_monthly = round(experience_yearly / 12, 2)
        experience_delta   = round(experience_yearly - input_salary, 2)
        pct_of_ceiling     = round(min(1.0, years / profile.target_years), 4)

        logger.info(
            f"[ExperienceMultiplier] seniority={seniority_level} "
            f"years={years} target={profile.target_years} "
            f"max_premium={profile.max_premium} "
            f"multiplier={multiplier:.4f} "
            f"input={input_salary:,.0f} → "
            f"experience_salary={experience_yearly:,.0f} "
            f"delta={experience_delta:+,.0f} "
            f"pct_ceiling={pct_of_ceiling:.1%}"
        )

        return ExperienceAdjustment(
            experience_yearly=     experience_yearly,
            experience_monthly=    experience_monthly,
            experience_delta=      experience_delta,
            multiplier=            multiplier,
            years_used=            years,
            target_years=          profile.target_years,
            max_premium=           profile.max_premium,
            seniority_level=       seniority_level,
            pct_of_ceiling=        pct_of_ceiling,
            confidence_adjustment= confidence_adjustment,
            data_gaps=             data_gaps,
        )

    # ── Internal helpers ──────────────────────────────────────────────────

    @staticmethod
    def _passthrough(
        input_salary:          float,
        profile:               _ExperienceProfile,
        seniority_level:       str,
        confidence_adjustment: float,
        data_gaps:             list[str],
    ) -> ExperienceAdjustment:
        """Return input salary unchanged — used when years data is missing."""
        monthly = round(input_salary / 12, 2)
        return ExperienceAdjustment(
            experience_yearly=     input_salary,
            experience_monthly=    monthly,
            experience_delta=      0.0,
            multiplier=            1.0,
            years_used=            0.0,
            target_years=          profile.target_years,
            max_premium=           profile.max_premium,
            seniority_level=       seniority_level,
            pct_of_ceiling=        0.0,
            confidence_adjustment= confidence_adjustment,
            data_gaps=             data_gaps,
        )

    # ── Explanation helpers ───────────────────────────────────────────────

    @staticmethod
    def build_explanation(adjustment: ExperienceAdjustment) -> list[str]:
        """
        Generate human-readable explanation bullets for the experience step.

        Called by the explanation layer in SalaryPredictionOrchestrator.
        """
        lines: list[str] = []

        if adjustment.experience_delta == 0.0:
            return lines

        pct_uplift    = (adjustment.multiplier - 1.0) * 100
        pct_ceiling   = adjustment.pct_of_ceiling * 100
        years_display = (
            f"{adjustment.years_used:.0f} year"
            if adjustment.years_used == 1
            else f"{adjustment.years_used:.1f} years"
        )

        lines.append(
            f"{years_display} of experience adds "
            f"${adjustment.experience_delta:,.0f}/year "
            f"({pct_uplift:.1f}% above the location-adjusted baseline)."
        )

        if adjustment.pct_of_ceiling >= 1.0:
            lines.append(
                f"You've reached the experience ceiling for "
                f"{adjustment.seniority_level} level — "
                f"further salary growth will come from skills and title progression."
            )
        else:
            lines.append(
                f"You're at {pct_ceiling:.0f}% of the {adjustment.seniority_level} "
                f"experience ceiling ({adjustment.target_years:.0f} years). "
                f"Additional experience can add up to "
                f"${ExperienceMultiplier.input_premium_remaining(adjustment):,.0f}/year more."
            )

        return lines

    @staticmethod
    def input_premium_remaining(adjustment: ExperienceAdjustment) -> float:
        """
        Dollar amount still available between current experience and the ceiling.

        Used by build_explanation to show the candidate their remaining upside.
        """
        # Salary at ceiling = input × (1 + max_premium)
        # Remaining         = salary_at_ceiling - experience_yearly
        input_salary       = adjustment.experience_yearly - adjustment.experience_delta
        salary_at_ceiling  = input_salary * (1.0 + adjustment.max_premium)
        return round(max(0.0, salary_at_ceiling - adjustment.experience_yearly), 2)
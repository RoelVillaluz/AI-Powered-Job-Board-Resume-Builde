"""
talent_deviation.py
────────────────────
Step 5 of the Salary Prediction Engine (inserted before confidence + range).

Maps a candidate's multi-signal strength to a position within the local
market salary distribution, producing the final predicted salary.

Why this step exists
────────────────────
The previous pipeline applied experience and skill premiums as multipliers
on top of a location-capped anchor. This caused catastrophic compression:
the location cap (at median) fires before premiums, so both weak and strong
candidates enter the skill/experience steps with the same capped input.
The maximum possible spread between any two candidates was $1,530
(25% of $6,120) regardless of how different their skills were.

New architecture (when location.salaryData exists)
───────────────────────────────────────────────────
The local market salary range (p25 → p75) is used as the distribution
the candidate is placed within, not as a cap on top of the global anchor.

    talent_signal  = alignment × 0.45 + portfolio × 0.40 + exp_pct × 0.15
    percentile     = signal ^ 0.75              (nonlinear — top performers gain disproportionately)
    predicted      = p25_usd + (p75_usd - p25_usd) × percentile

This produces real spread:
    Weak candidate (irrelevant beginner skills, 0yr) → near p25
    Strong candidate (expert relevant skills, 5yr)   → near p75

Signal weights
──────────────
    alignment   0.45  — skill-title match is the strongest signal
                        A resume claiming ML Engineer with HTML/CSS skills
                        should land near p25 regardless of skill count.
    portfolio   0.40  — demand-weighted skill quality (already computed
                        by SkillPremium, reused here)
    exp_pct     0.15  — experience as fraction of seniority ceiling
                        (already computed by ExperienceMultiplier)

Fallback (when location.salaryData is absent)
──────────────────────────────────────────────
When the location document has no salary range data, talent_deviation
applies as a ±15% modifier on top of the existing anchor → experience →
skill chain output. This preserves the signal without double-amplifying.

    modifier = 0.85 + (percentile × 0.30)   → [0.85x, 1.15x]

Pure compute — zero DB access.
"""

from __future__ import annotations

import logging
import math
from typing import NamedTuple, Optional

from ...normalization.salary_normalizer import SalaryNormalizer
from ...normalization.constants import FREQUENCY_YEAR

logger = logging.getLogger(__name__)


# ── Signal weights (used only when resume_score is unavailable) ───────────────

_ALIGNMENT_WEIGHT:   float = 0.45
_PORTFOLIO_WEIGHT:   float = 0.40
_EXPERIENCE_WEIGHT:  float = 0.15
_PERCENTILE_EXPONENT: float = 0.75  # only applied in fallback signal mode

# Nonlinear exponent — rewards top performers disproportionately.
# 0.75 means the curve is convex: easy to get from 0→0.5, harder from 0.5→1.0.
_PERCENTILE_EXPONENT: float = 0.75

# Fallback modifier range when no local salary range is available
_FALLBACK_MODIFIER_MIN: float = 0.85
_FALLBACK_MODIFIER_RANGE: float = 0.30   # 0.85 → 1.15


# ── Result type ───────────────────────────────────────────────────────────────

class TalentDeviationResult(NamedTuple):
    """
    Result of applying talent deviation to produce the final salary.

    Fields
    ------
    predicted_yearly / predicted_monthly
        Final salary after talent deviation applied.

    percentile
        0.0–1.0. Where the candidate sits within the local market distribution.
        0.0 = bottom of range (p25), 1.0 = top (p75).

    talent_signal
        Raw weighted signal before nonlinear transformation.
        Preserved for explanation and transparency.

    mode
        'local_range' — p25→p75 interpolation (location.salaryData existed)
        'fallback'    — ±15% modifier on pre-deviation salary

    p25_usd / p75_usd
        Local market bounds used for interpolation.
        Both 0.0 in fallback mode.

    modifier
        The ±15% multiplier applied in fallback mode.
        1.0 in local_range mode.
    """
    predicted_yearly:  float
    predicted_monthly: float
    percentile:        float
    talent_signal:     float
    mode:              str    # 'local_range' | 'fallback'
    p25_usd:           float
    p75_usd:           float
    modifier:          float  # 1.0 in local_range mode


# ── Talent deviation ──────────────────────────────────────────────────────────

class TalentDeviation:
    """
    Maps candidate signal strength to a position within the local market range.
    Static-only — no instantiation needed.
    """

    @staticmethod
    def _compute_signal(
        alignment_score: float,
        portfolio_score: float,
        exp_pct:         float,
    ) -> tuple[float, float]:
        """
        Fallback signal — used only when ResumeScore is unavailable.
        Preserved so the pipeline degrades gracefully rather than crashing.
        """
        signal = (
            alignment_score * _ALIGNMENT_WEIGHT +
            portfolio_score * _PORTFOLIO_WEIGHT +
            exp_pct         * _EXPERIENCE_WEIGHT
        )
        signal     = min(1.0, max(0.0, signal))
        percentile = round(math.pow(signal, _PERCENTILE_EXPONENT), 4)
        return round(signal, 4), percentile

    @staticmethod
    def apply(
        pre_deviation_salary:  float,
        location_data:         Optional[dict],
        exchange_rates:        Optional[dict[str, float]],
        resume_score:          Optional[float],      # 0–100 from ResumeScore.totalScore
        skill_count:           int   = 0,
        alignment_score:       float = 0.0,          # fallback only
        portfolio_score:       float = 0.0,          # fallback only
        exp_pct_of_ceiling:    float = 0.0,          # fallback only
    ) -> TalentDeviationResult:

        # ── Percentile resolution ─────────────────────────────────────────────
        if resume_score is not None:
            # Penalize thin skill portfolios — high-value skills on a 3-skill resume
            # don't warrant the same confidence as the same skills in a fuller profile.
            # Penalty fades out completely at MIN_SKILLS_FOR_NO_PENALTY.
            MIN_SKILLS_FOR_NO_PENALTY = 8
            skill_breadth_factor = min(1.0, skill_count / MIN_SKILLS_FOR_NO_PENALTY)
            
            adjusted_score = resume_score * skill_breadth_factor
            talent_signal  = round(adjusted_score / 100, 4)
            percentile     = talent_signal
            signal_source  = "resume_score"
        else:
            # Scorer hasn't run yet — degrade gracefully using pipeline signals.
            # Confidence penalty should be applied upstream when resume_score is None.
            talent_signal, percentile = TalentDeviation._compute_signal(
                alignment_score, portfolio_score, exp_pct_of_ceiling
            )
            signal_source = "pipeline_signal"

        # ── Local range mode ──────────────────────────────────────────────────
        salary_data = (location_data or {}).get("salaryData")

        if salary_data and exchange_rates:
            salary_range = salary_data.get("salaryRange", {})
            p25_local    = salary_range.get("p25", 0)
            p75_local    = salary_range.get("p75", 0)
            currency     = salary_data.get("currency", "$")

            if p25_local > 0 and p75_local > 0:
                p25_usd = SalaryNormalizer.normalize(
                    p25_local, FREQUENCY_YEAR, currency, exchange_rates
                ).yearly
                p75_usd = SalaryNormalizer.normalize(
                    p75_local, FREQUENCY_YEAR, currency, exchange_rates
                ).yearly

                predicted_yearly  = round(p25_usd + (p75_usd - p25_usd) * percentile, 2)
                predicted_monthly = round(predicted_yearly / 12, 2)

                logger.info(
                    f"[TalentDeviation] LOCAL RANGE mode ({signal_source}) — "
                    f"signal={talent_signal:.4f} percentile={percentile:.4f} "
                    f"p25=${p25_usd:,.0f} p75=${p75_usd:,.0f} "
                    f"→ predicted=${predicted_yearly:,.2f}"
                )

                return TalentDeviationResult(
                    predicted_yearly=  predicted_yearly,
                    predicted_monthly= predicted_monthly,
                    percentile=        percentile,
                    talent_signal=     talent_signal,
                    mode=              "local_range",
                    p25_usd=           p25_usd,
                    p75_usd=           p75_usd,
                    modifier=          1.0,
                )

        # ── Fallback mode ─────────────────────────────────────────────────────
        modifier          = round(_FALLBACK_MODIFIER_MIN + percentile * _FALLBACK_MODIFIER_RANGE, 4)
        predicted_yearly  = round(pre_deviation_salary * modifier, 2)
        predicted_monthly = round(predicted_yearly / 12, 2)

        logger.info(
            f"[TalentDeviation] FALLBACK mode ({signal_source}) — "
            f"signal={talent_signal:.4f} percentile={percentile:.4f} "
            f"modifier={modifier:.4f} "
            f"input=${pre_deviation_salary:,.0f} → predicted=${predicted_yearly:,.2f}"
        )

        return TalentDeviationResult(
            predicted_yearly=  predicted_yearly,
            predicted_monthly= predicted_monthly,
            percentile=        percentile,
            talent_signal=     talent_signal,
            mode=              "fallback",
            p25_usd=           0.0,
            p75_usd=           0.0,
            modifier=          modifier,
        )

    @staticmethod
    def build_explanation(result: TalentDeviationResult) -> list[str]:
        """
        Generate human-readable explanation bullets for the talent deviation step.
        Called by the explanation layer in SalaryPredictionOrchestrator.
        """
        lines: list[str] = []
        pct_display = round(result.percentile * 100, 0)

        if result.mode == "local_range":
            lines.append(
                f"Based on your skills, experience, and role alignment, you rank "
                f"at approximately the {pct_display:.0f}th percentile "
                f"of the local market for this role."
            )
            if result.percentile >= 0.80:
                lines.append(
                    "Your profile places you in the top 20% of candidates "
                    "in this market — near the upper end of the local salary range."
                )
            elif result.percentile <= 0.20:
                lines.append(
                    "Improving skill relevance or depth would move you significantly "
                    "higher within the local market range."
                )
        else:
            if result.modifier >= 1.10:
                lines.append(
                    f"Your strong candidate profile adds a {(result.modifier - 1.0) * 100:.0f}% "
                    f"premium above the market baseline."
                )
            elif result.modifier <= 0.90:
                lines.append(
                    f"Skill and experience gaps reduce the estimate "
                    f"by {(1.0 - result.modifier) * 100:.0f}% from the market baseline."
                )

        return lines
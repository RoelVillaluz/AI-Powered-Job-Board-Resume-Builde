"""
salary_prediction_orchestrator.py
────────────────────────────
Orchestrator for the Salary Prediction Engine.

Pipeline order:
    0.   effective_seniority   — validate claimed level vs observed data
    0.5  skill_title_alignment — measure skill-title overlap, compute blend_weight
    1.   anchor                — blended anchor (job title × blend + industry × (1-blend))
    2.   location              — nominal market rate + COL real value + salary_data passthrough
    3.   experience            — logarithmic seniority-aware premium (produces pct_of_ceiling)
    4.   skill_premium         — level-weighted demand portfolio premium (produces portfolio_score)
    5.   talent_deviation      — maps [alignment, portfolio, exp_pct] → local market percentile → salary
    6.   confidence + range    — accumulate penalties, compute band width

Architecture
────────────
Steps 3 and 4 (experience, skill) still run and produce their full
typed results. However their DOLLAR output is only used in fallback mode
(when location.salaryData is absent). Their signal outputs (pct_of_ceiling,
portfolio_score) always feed into TalentDeviation as inputs.

When location.salaryData exists (primary path):
    TalentDeviation uses location.p25→p75 as the distribution range.
    The candidate is placed within that range by their talent signal.
    Experience and skill dollar values are intermediate — not the prediction.

When location.salaryData is absent (fallback):
    TalentDeviation applies a ±15% modifier on top of the skill premium output.
    Behavior is close to the previous pipeline but with meaningful spread.

This eliminates the compression problem where the location median cap
applied before premiums, collapsing weak and strong candidates to the
same salary within a $1,530 window.

Pure compute — zero DB access.
"""

from __future__ import annotations

import logging
from typing import NamedTuple, Optional

from salary_intelligence.pipeline.anchor.anchor_resolver import (
    SalaryAnchorResolver,
    AnchorResult,
)
from salary_intelligence.pipeline.adjustments.location_factor import (
    LocationFactorApplicator,
    LocationAdjustment,
)
from salary_intelligence.pipeline.adjustments.experience_multiplier import (
    ExperienceMultiplier,
    ExperienceAdjustment,
)
from salary_intelligence.pipeline.adjustments.skill_premium import (
    SkillPremium,
    SkillPremiumAdjustment,
)
from salary_intelligence.pipeline.distribution.talent_deviation import (
    TalentDeviation,
    TalentDeviationResult,
)
from salary_intelligence.pipeline.identity.effective_seniority import (
    resolve_effective_seniority,
)
from salary_intelligence.pipeline.identity.skill_title_alignment import (
    SkillTitleAlignment,
    AlignmentResult,
)
from metrics.prometheus_metrics import salary_prediction_requests_total

logger = logging.getLogger(__name__)


# ── Range width thresholds ────────────────────────────────────────────────────

_RANGE_BANDS: list[tuple[float, float]] = [
    (90.0, 0.05),
    (70.0, 0.10),
    (50.0, 0.15),
    (0.0, 0.25),
]


# ── Result type ───────────────────────────────────────────────────────────────


class SalaryPrediction(NamedTuple):
    """
    Full numerical output of the salary prediction pipeline.

    Fields
    ------
    predicted_yearly / predicted_monthly
        Final salary from TalentDeviation. Primary UI output.

    range_min / range_max
        Confidence-driven salary band around the point estimate.

    confidence_score
        0–100. Anchor confidence minus accumulated step penalties.

    anchor / alignment / location / experience / skill_premium / talent_deviation
        Full typed result from each step. Consumed by explanation layer.

    claimed_seniority / effective_seniority / seniority_downgraded
        Seniority metadata for explanation layer.

    skill_title_alignment_score
        Convenience float — alignment.alignment_score.

    total_experience_years
        Passed through from ResumeEmbedding.metrics.
    """

    predicted_yearly: float
    predicted_monthly: float
    range_min: float
    range_max: float
    confidence_score: float

    anchor: AnchorResult
    alignment: AlignmentResult
    location: LocationAdjustment
    experience: ExperienceAdjustment
    skill_premium: SkillPremiumAdjustment
    talent_deviation: TalentDeviationResult

    claimed_seniority: str
    effective_seniority: str
    seniority_downgraded: bool
    skill_title_alignment_score: float
    total_experience_years: Optional[float]


# ── Service ───────────────────────────────────────────────────────────────────


class SalaryPredictionOrchestrator:
    """
    Orchestrates the salary prediction pipeline.
    Static-only — no instantiation needed.
    """

    @staticmethod
    def _compute_range(
        predicted_yearly: float,
        confidence_score: float,
    ) -> tuple[float, float]:
        half_width = 0.25
        for threshold, width in _RANGE_BANDS:
            if confidence_score >= threshold:
                half_width = width
                break
        return (
            round(predicted_yearly * (1.0 - half_width), 2),
            round(predicted_yearly * (1.0 + half_width), 2),
        )

    @staticmethod
    def _accumulate_confidence(
        anchor: AnchorResult,
        alignment: AlignmentResult,
        location: LocationAdjustment,
        experience: ExperienceAdjustment,
        skill: SkillPremiumAdjustment,
    ) -> float:
        score = (
            anchor.confidence
            + alignment.confidence_adjustment
            + location.confidence_adjustment
            + experience.confidence_adjustment
            + skill.confidence_adjustment
        )
        return round(max(0.0, min(100.0, score)), 2)

    @staticmethod
    def predict(
        seniority_level: str,
        resume_score: int,
        total_experience_years: Optional[float],
        job_title_data: Optional[dict],
        industry_data: Optional[dict],
        location_data: Optional[dict],
        skill_market_data: Optional[list[dict]],
        exchange_rates: dict[str, float],
    ) -> SalaryPrediction:

        try:
            skill_count = len(skill_market_data) if skill_market_data else 0

            # ── Step 0: Effective seniority ───────────────────────────────────
            effective_seniority, seniority_downgraded = resolve_effective_seniority(
                claimed_seniority=seniority_level,
                total_experience_years=total_experience_years,
                skill_count=skill_count,
            )
            if seniority_downgraded:
                logger.info(
                    f"[SalaryPredictionOrchestrator] Step 0 — Seniority: "
                    f"{seniority_level} → {effective_seniority} "
                    f"(years={total_experience_years}, skills={skill_count})"
                )

            # ── Step 0.5: Skill-title alignment ───────────────────────────────
            job_title_top_skills = (
                job_title_data.get("topSkills", []) if job_title_data else []
            )
            alignment = SkillTitleAlignment.compute(
                resume_skill_market_data=skill_market_data,
                job_title_top_skills=job_title_top_skills,
            )
            logger.info(
                f"[SalaryPredictionOrchestrator] Step 0.5 — Alignment: "
                f"score={alignment.alignment_score:.3f} "
                f"label={alignment.alignment_label} "
                f"blend={alignment.blend_weight:.3f}"
            )

            # ── Step 1: Anchor (blended) ──────────────────────────────────────
            anchor = SalaryAnchorResolver.resolve(
                seniority_level=effective_seniority,
                job_title_data=job_title_data,
                industry_data=industry_data,
                exchange_rates=exchange_rates,
                blend_weight=alignment.blend_weight,
            )
            logger.info(
                f"[SalaryPredictionOrchestrator] Step 1 — Anchor: "
                f"level={anchor.fallback_level} "
                f"yearly={anchor.yearly:,.0f} "
                f"confidence={anchor.confidence:.0f}"
            )

            # ── Step 2: Location ──────────────────────────────────────────────
            # salary_data is passed through on LocationAdjustment for TalentDeviation.
            # No hard cap applied here — compression bug removed.
            location = LocationFactorApplicator.apply(
                anchor_yearly=anchor.yearly,
                location_data=location_data,
                exchange_rates=exchange_rates,
            )
            logger.info(
                f"[SalaryPredictionOrchestrator] Step 2 — Location: "
                f"'{location.location_name}' "
                f"nominal={location.nominal_yearly:,.0f} "
                f"salary_data={'present' if location.salary_data else 'absent'}"
            )

            # ── Step 3: Experience ────────────────────────────────────────────
            # pct_of_ceiling feeds into TalentDeviation signal.
            # Dollar output used only in fallback mode.
            experience = ExperienceMultiplier.apply(
                input_salary=location.nominal_yearly,
                seniority_level=effective_seniority,
                experience_years=total_experience_years,
            )
            logger.info(
                f"[SalaryPredictionOrchestrator] Step 3 — Experience: "
                f"years={experience.years_used} "
                f"multiplier={experience.multiplier:.4f} "
                f"pct_of_ceiling={experience.pct_of_ceiling:.3f}"
            )

            # ── Step 4: Skill premium ─────────────────────────────────────────
            # portfolio_score feeds into TalentDeviation signal.
            # Dollar output used only in fallback mode.
            skill = SkillPremium.apply(
                input_salary=experience.experience_yearly,
                seniority_level=effective_seniority,
                skill_market_data=skill_market_data,
            )
            logger.info(
                f"[SalaryPredictionOrchestrator] Step 4 — Skill premium: "
                f"portfolio={skill.portfolio_score:.4f} "
                f"multiplier={skill.multiplier:.4f}"
            )

            # ── Step 5: Talent deviation ──────────────────────────────────────
            # Primary path: places candidate within location p25→p75 range.
            # Fallback: applies ±15% modifier on skill.skill_yearly.
            talent = TalentDeviation.apply(
                alignment_score=alignment.alignment_score,
                portfolio_score=skill.portfolio_score,
                exp_pct_of_ceiling=experience.pct_of_ceiling,
                resume_score=resume_score,
                skill_count=len(skill_market_data),
                pre_deviation_salary=skill.skill_yearly,
                location_data=location_data,
                exchange_rates=exchange_rates,
            )
            logger.info(
                f"[SalaryPredictionOrchestrator] Step 5 — TalentDeviation: "
                f"mode={talent.mode} "
                f"signal={talent.talent_signal:.4f} "
                f"percentile={talent.percentile:.4f} "
                f"→ predicted={talent.predicted_yearly:,.0f}"
            )

            # ── Step 6: Confidence + range ────────────────────────────────────
            confidence_score = SalaryPredictionOrchestrator._accumulate_confidence(
                anchor, alignment, location, experience, skill
            )

            predicted_yearly = talent.predicted_yearly
            predicted_monthly = talent.predicted_monthly
            range_min, range_max = SalaryPredictionOrchestrator._compute_range(
                predicted_yearly, confidence_score
            )

            logger.info(
                f"[SalaryPredictionOrchestrator] Final: "
                f"predicted={predicted_yearly:,.0f}/yr "
                f"({predicted_monthly:,.0f}/mo) "
                f"range=[{range_min:,.0f}, {range_max:,.0f}] "
                f"confidence={confidence_score:.1f}"
            )

            salary_prediction_requests_total.labels(status="success").inc()

            return SalaryPrediction(
                predicted_yearly=predicted_yearly,
                predicted_monthly=predicted_monthly,
                range_min=range_min,
                range_max=range_max,
                confidence_score=confidence_score,
                anchor=anchor,
                alignment=alignment,
                location=location,
                experience=experience,
                skill_premium=skill,
                talent_deviation=talent,
                claimed_seniority=seniority_level,
                effective_seniority=effective_seniority,
                seniority_downgraded=seniority_downgraded,
                skill_title_alignment_score=alignment.alignment_score,
                total_experience_years=total_experience_years,
            )
        except Exception:
            salary_prediction_requests_total.labels(status="failed").inc()
            raise

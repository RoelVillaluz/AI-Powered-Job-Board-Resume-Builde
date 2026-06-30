"""
main_v2.py  (salary prediction entry point)
────────────────────────────────────────────
Top-level function consumed by the /compute/predict_salary router.

Mirrors the pattern established by generate_resume_embeddings_v2:
    - Receives a flat dict unpacked from ComputeRequest
    - Delegates all computation to salary_intelligence
    - Returns { "error": str } on failure or a plain dict on success
    - wrap() in the router normalises either shape for Node

Exchange rates
──────────────
Hardcoded constants for now — BASE_EXCHANGE_RATES is the single source
of truth. Replace with an API call once a live rates feed is wired up.
All values are multipliers TO base currency (USD):
    { "₱": 0.017 } means 1 PHP = 0.017 USD

Payload shape expected from Node
─────────────────────────────────
{
    "seniority_level":        str,           # 'Intern'|'Entry'|'Mid-Level'|'Senior'
    "total_experience_years": float | null,  # from ResumeEmbedding.metrics
    "job_title_data":         dict | null,   # { salaryData: { bySeniority, medianSalary, currency } }
    "industry_data":          dict | null,   # { salaryBenchmarks: { bySeniority, overallMedian, currency } }
    "location_data":          dict | null,   # { name, baselineFactor, costOfLivingIndex }
    "skill_market_data":      list | null,   # [{ name, demandScore, growthRate, seniorityMultiplier }]
}
"""

from __future__ import annotations

import logging
from typing import Optional

from salary_intelligence.pipeline.salary_prediction_orchestrator import (
    SalaryPredictionOrchestrator,
    SalaryPrediction,
)

logger = logging.getLogger(__name__)


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


# ── Serialisation ─────────────────────────────────────────────────────────────


def _serialise_prediction(prediction: SalaryPrediction) -> dict:
    return {
        # ── Point estimate ────────────────────────────────────────────────
        "predicted_yearly": prediction.predicted_yearly,
        "predicted_monthly": prediction.predicted_monthly,
        # ── Confidence-driven range ───────────────────────────────────────
        "range_min": prediction.range_min,
        "range_max": prediction.range_max,
        "confidence_score": prediction.confidence_score,
        # ── Seniority metadata ────────────────────────────────────────────
        "claimed_seniority": prediction.claimed_seniority,
        "effective_seniority": prediction.effective_seniority,
        "seniority_downgraded": prediction.seniority_downgraded,
        "total_experience_years": prediction.total_experience_years,
        # ── Step summaries ────────────────────────────────────────────────
        "anchor": {
            "yearly": prediction.anchor.yearly,
            "monthly": prediction.anchor.monthly,
            "fallback_level": prediction.anchor.fallback_level,
            "confidence": prediction.anchor.confidence,
            "source_label": prediction.anchor.source_label,
        },
        "alignment": {
            "alignment_score": prediction.alignment.alignment_score,
            "alignment_label": prediction.alignment.alignment_label,
            "blend_weight": prediction.alignment.blend_weight,
            "matched_skills": prediction.alignment.matched_skills,
            "missing_required_skills": prediction.alignment.missing_required_skills,
        },
        "location": {
            "location_name": prediction.location.location_name,
            "nominal_yearly": prediction.location.nominal_yearly,
            "nominal_monthly": prediction.location.nominal_monthly,
            "real_value_yearly": prediction.location.real_value_yearly,
            "real_value_monthly": prediction.location.real_value_monthly,
            "location_delta": prediction.location.location_delta,
            "col_delta": prediction.location.col_delta,
            "baseline_factor": prediction.location.baseline_factor,
            "col_index": prediction.location.col_index,
        },
        "experience": {
            "experience_yearly": prediction.experience.experience_yearly,
            "experience_monthly": prediction.experience.experience_monthly,
            "experience_delta": prediction.experience.experience_delta,
            "multiplier": prediction.experience.multiplier,
            "years_used": prediction.experience.years_used,
            "pct_of_ceiling": prediction.experience.pct_of_ceiling,
        },
        "skill_premium": {
            "skill_yearly": prediction.skill_premium.skill_yearly,
            "skill_monthly": prediction.skill_premium.skill_monthly,
            "skill_delta": prediction.skill_premium.skill_delta,
            "multiplier": prediction.skill_premium.multiplier,
            "portfolio_score": prediction.skill_premium.portfolio_score,
            "top_skills": [
                {
                    "name": s.name,
                    "demand_score": s.demand_score,
                    "weighted_score": s.weighted_score,
                    "seniority_multiplier": s.seniority_multiplier,
                    "level": s.level,
                    "level_weight": s.level_weight,
                }
                for s in prediction.skill_premium.top_skills
            ],
        },
        "talent_deviation": {
            "percentile": prediction.talent_deviation.percentile,
            "talent_signal": prediction.talent_deviation.talent_signal,
            "mode": prediction.talent_deviation.mode,
            "p25_usd": prediction.talent_deviation.p25_usd,
            "p75_usd": prediction.talent_deviation.p75_usd,
            "modifier": prediction.talent_deviation.modifier,
        },
    }


# ── Entry point ───────────────────────────────────────────────────────────────


def predict_salary(
    seniority_level: str,
    total_experience_years: Optional[float],
    job_title_data: Optional[dict],
    industry_data: Optional[dict],
    location_data: Optional[dict],
    skill_market_data: Optional[list[dict]],
    exchange_rates: dict[str, float] = BASE_EXCHANGE_RATES,
) -> dict:
    """
    Run the salary prediction pipeline and return a JSON-serialisable dict.

    Args
    ────
    seniority_level
        Resolved seniority level from Node.
        Must match schema enum: 'Intern' | 'Entry' | 'Mid-Level' | 'Senior'

    total_experience_years
        From ResumeEmbedding.metrics.totalExperienceYears.
        Pass None when the embedding hasn't been generated yet — the
        experience step degrades gracefully with a confidence penalty.

    job_title_data
        Subset of the JobTitle document. Pass None when unavailable.

    industry_data
        Subset of the Industry document. Pass None when unavailable.

    location_data
        Subset of the Location document. Pass None when unavailable.

    skill_market_data
        List of skill market entries. Pass None or [] when unavailable.

    exchange_rates
        Defaults to BASE_EXCHANGE_RATES (hardcoded constants).
        Override with live rates once a rates API is integrated.

    Returns
    ───────
    dict — either { "error": str } on failure, or the serialised
    SalaryPrediction on success. wrap() in the router normalises both.
    """
    try:
        prediction = SalaryPredictionOrchestrator.predict(
            seniority_level=seniority_level,
            total_experience_years=total_experience_years,
            job_title_data=job_title_data,
            industry_data=industry_data,
            location_data=location_data,
            skill_market_data=skill_market_data,
            exchange_rates=exchange_rates,
        )

        return _serialise_prediction(prediction)

    except Exception as e:
        logger.error(f"[predict_salary] Pipeline error: {e}", exc_info=True)
        return {"error": str(e)}

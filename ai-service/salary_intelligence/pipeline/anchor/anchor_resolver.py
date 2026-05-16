"""
anchor_resolver.py
──────────────────
Resolves the base salary anchor for a prediction by walking a fallback
chain from most-specific to least-specific data source, then blending
the result with the industry anchor based on skill-title alignment.

Why blending exists
───────────────────
Without alignment blending, a resume claiming "Senior ML Engineer" with
HTML/CSS skills gets an ML Engineer anchor even after seniority downgrade —
because the anchor is still pulled from that job title's salary data.
The blend_weight from SkillTitleAlignment corrects this:

    blend_weight = 1.0  → full job title anchor (skills match the role)
    blend_weight = 0.0  → full industry anchor  (skills don't match at all)
    between             → linear blend

Both the job title anchor and the industry anchor are resolved independently,
then blended. The fallback chain runs for both when blend_weight is
between 0 and 1.

Fallback chain (priority order):
    1. JobTitle.salaryData.bySeniority[level].median   ← 90% confidence
    2. JobTitle.salaryData.medianSalary                ← 65% confidence
    3. Industry.salaryBenchmarks.bySeniority[level]    ← 40% confidence
    4. Industry.salaryBenchmarks.overallMedian         ← 20% confidence
    5. No data                                         ←  0% confidence

Node is responsible for fetching and passing job_title_data and
industry_data. This module never touches the DB.
"""

from __future__ import annotations

import logging
from typing import Optional

from ...normalization.salary_normalizer import SalaryNormalizer
from ...normalization.constants import (
    BASE_CURRENCY,
    FREQUENCY_YEAR,
    CONFIDENCE_JOB_TITLE_BY_SENIORITY,
    CONFIDENCE_JOB_TITLE_OVERALL,
    CONFIDENCE_INDUSTRY_BY_SENIORITY,
    CONFIDENCE_INDUSTRY_OVERALL,
    CONFIDENCE_NO_DATA,
)
from ...normalization.types import AnchorResult

logger = logging.getLogger(__name__)


class SalaryAnchorResolver:
    """
    Resolves the best available salary anchor for a prediction.

    Static-only — no instantiation needed.
    """

    # ── Internal helpers ──────────────────────────────────────────────────

    @staticmethod
    def _normalize_pair(
        amount:         float,
        frequency:      str,
        currency:       str,
        exchange_rates: dict[str, float],
    ) -> tuple[float, float]:
        """Normalize and return (yearly, monthly)."""
        result = SalaryNormalizer.normalize(amount, frequency, currency, exchange_rates)
        return result.yearly, result.monthly

    @staticmethod
    def _make_result(
        yearly:         float,
        monthly:        float,
        fallback_level: str,
        confidence:     float,
        source_label:   str,
    ) -> AnchorResult:
        return AnchorResult(
            yearly=         yearly,
            monthly=        monthly,
            fallback_level= fallback_level,
            confidence=     confidence,
            source_label=   source_label,
        )

    # ── Job title anchor ──────────────────────────────────────────────────

    @staticmethod
    def _resolve_job_title_anchor(
        seniority_level: str,
        job_title_data:  dict,
        exchange_rates:  dict[str, float],
        frequency:       str,
    ) -> Optional[AnchorResult]:
        """
        Resolve the anchor from job title data only (L1 and L2).
        Returns None when no usable salary data is found.
        """
        salary_data = job_title_data.get("salaryData", {})
        currency    = salary_data.get("currency", BASE_CURRENCY)

        # L1 — bySeniority median
        level_data   = salary_data.get("bySeniority", {}).get(seniority_level, {})
        level_median = level_data.get("median", 0) if level_data else 0
        if level_median > 0:
            yearly, monthly = SalaryAnchorResolver._normalize_pair(
                level_median, frequency, currency, exchange_rates
            )
            return SalaryAnchorResolver._make_result(
                yearly, monthly,
                fallback_level= "job_title_by_seniority",
                confidence=     CONFIDENCE_JOB_TITLE_BY_SENIORITY,
                source_label=   f"Market median for {seniority_level} level in this role",
            )

        # L2 — overall median
        overall_median = salary_data.get("medianSalary", 0)
        if overall_median > 0:
            yearly, monthly = SalaryAnchorResolver._normalize_pair(
                overall_median, frequency, currency, exchange_rates
            )
            return SalaryAnchorResolver._make_result(
                yearly, monthly,
                fallback_level= "job_title_overall",
                confidence=     CONFIDENCE_JOB_TITLE_OVERALL,
                source_label=   "Overall market median for this role (seniority data unavailable)",
            )

        return None

    # ── Industry anchor ───────────────────────────────────────────────────

    @staticmethod
    def _resolve_industry_anchor(
        seniority_level: str,
        industry_data:   dict,
        exchange_rates:  dict[str, float],
        frequency:       str,
    ) -> Optional[AnchorResult]:
        """
        Resolve the anchor from industry data only (L3 and L4).
        Returns None when no usable salary data is found.
        """
        benchmarks = industry_data.get("salaryBenchmarks", {})
        currency   = benchmarks.get("currency", BASE_CURRENCY)

        # L3 — industry bySeniority median
        level_data   = benchmarks.get("bySeniority", {}).get(seniority_level, {})
        level_median = level_data.get("median", 0) if level_data else 0
        if level_median > 0:
            yearly, monthly = SalaryAnchorResolver._normalize_pair(
                level_median, frequency, currency, exchange_rates
            )
            return SalaryAnchorResolver._make_result(
                yearly, monthly,
                fallback_level= "industry_by_seniority",
                confidence=     CONFIDENCE_INDUSTRY_BY_SENIORITY,
                source_label=   f"Industry median for {seniority_level} level (role-specific data unavailable)",
            )

        # L4 — industry overall median
        overall_median = benchmarks.get("overallMedian", 0)
        if overall_median > 0:
            yearly, monthly = SalaryAnchorResolver._normalize_pair(
                overall_median, frequency, currency, exchange_rates
            )
            return SalaryAnchorResolver._make_result(
                yearly, monthly,
                fallback_level= "industry_overall",
                confidence=     CONFIDENCE_INDUSTRY_OVERALL,
                source_label=   "Industry-wide median (insufficient role-specific data)",
            )

        return None

    @staticmethod
    def _blend_anchors(
        jt_yearly: float,
        ind_yearly: float,
        blend_weight: float,
    ) -> float:
        return round(
            jt_yearly * blend_weight + ind_yearly * (1.0 - blend_weight),
            2
        )

    # ── Main entry point ──────────────────────────────────────────────────

    @staticmethod
    def resolve(
        seniority_level:  str,
        job_title_data:   Optional[dict],
        industry_data:    Optional[dict],
        exchange_rates:   dict[str, float],
        frequency:        str = FREQUENCY_YEAR,
        blend_weight:     float = 1.0,
    ) -> AnchorResult:
        """
        Walk the fallback chain and return the best available anchor,
        blended with the industry anchor according to alignment score.

        Args:
            seniority_level:  Candidate's resolved seniority.
                              Must match schema enum:
                              'Intern' | 'Entry' | 'Mid-Level' | 'Senior'
            job_title_data:   Subset of the JobTitle document:
                              { salaryData: { bySeniority, medianSalary, currency },
                                topSkills: [...] }
            industry_data:    Subset of the Industry document:
                              { salaryBenchmarks: { bySeniority, overallMedian, currency } }
            exchange_rates:   { symbol: multiplier_to_base } — supplied by Node.
            frequency:        Frequency of the raw values in the source data.
                              Almost always 'year' for stored schema values.
            blend_weight:     From AlignmentResult.blend_weight (default 1.0 = no blending).
                              1.0 → full job title anchor
                              0.0 → full industry anchor
                              between → linear blend

        Returns:
            AnchorResult with the best available normalized anchor + confidence.
            When blending occurs, fallback_level is 'blended' and confidence
            reflects the weighted average of both anchors' confidence scores.
        """
        # ── Resolve job title anchor (L1 / L2) ───────────────────────────
        jt_anchor: Optional[AnchorResult] = None
        if job_title_data:
            jt_anchor = SalaryAnchorResolver._resolve_job_title_anchor(
                seniority_level, job_title_data, exchange_rates, frequency
            )
            if jt_anchor:
                logger.info(
                    f"[AnchorResolver] JobTitle anchor — "
                    f"level={jt_anchor.fallback_level} "
                    f"yearly={jt_anchor.yearly:,.0f} "
                    f"confidence={jt_anchor.confidence:.0f}"
                )

        # ── Resolve industry anchor (L3 / L4) ────────────────────────────
        ind_anchor: Optional[AnchorResult] = None
        if industry_data:
            ind_anchor = SalaryAnchorResolver._resolve_industry_anchor(
                seniority_level, industry_data, exchange_rates, frequency
            )
            if ind_anchor:
                logger.info(
                    f"[AnchorResolver] Industry anchor — "
                    f"level={ind_anchor.fallback_level} "
                    f"yearly={ind_anchor.yearly:,.0f} "
                    f"confidence={ind_anchor.confidence:.0f}"
                )

        # ── Blend ─────────────────────────────────────────────────────────
        # blend_weight = 1.0 → no blending needed, return job title anchor directly
        if blend_weight >= 1.0 or ind_anchor is None:
            if jt_anchor:
                return jt_anchor
            if ind_anchor:
                return ind_anchor
            # L5 — no data at all
            logger.warning(
                "[AnchorResolver] No anchor found — returning zero. "
                "Ensure job_title_data or industry_data is populated."
            )
            return SalaryAnchorResolver._make_result(
                0.0, 0.0,
                fallback_level= "no_data",
                confidence=     CONFIDENCE_NO_DATA,
                source_label=   "No salary data available for this role or industry",
            )

        # blend_weight = 0.0 → skills don't match title at all, use industry only
        if blend_weight <= 0.0 or jt_anchor is None:
            if ind_anchor:
                return ind_anchor
            if jt_anchor:
                return jt_anchor
            return SalaryAnchorResolver._make_result(
                0.0, 0.0,
                fallback_level= "no_data",
                confidence=     CONFIDENCE_NO_DATA,
                source_label=   "No salary data available for this role or industry",
            )

        # Partial blend — linear interpolation between both anchors
        blended_yearly = SalaryAnchorResolver._blend_anchors(
            jt_anchor.yearly,
            ind_anchor.yearly,
            blend_weight
        )
        blended_monthly = round(blended_yearly / 12, 2)

        # Confidence: weighted average of both, then penalised for uncertainty
        blended_confidence = (
            jt_anchor.confidence * (blend_weight ** 1.5) +
            ind_anchor.confidence * ((1 - blend_weight) ** 1.5)
        )

        logger.info(
            f"[AnchorResolver] Blended anchor — "
            f"blend_weight={blend_weight:.2f} "
            f"jt={jt_anchor.yearly:,.0f} × {blend_weight:.2f} + "
            f"ind={ind_anchor.yearly:,.0f} × {1 - blend_weight:.2f} "
            f"= {blended_yearly:,.0f} "
            f"confidence={blended_confidence:.1f}"
        )

        return SalaryAnchorResolver._make_result(
            blended_yearly,
            blended_monthly,
            fallback_level= "blended",
            confidence=     blended_confidence,
            source_label=   (
                f"Blended estimate: {blend_weight*100:.0f}% role benchmark + "
                f"{(1-blend_weight)*100:.0f}% industry baseline "
                f"(partial skill match for this role)"
            ),
        )
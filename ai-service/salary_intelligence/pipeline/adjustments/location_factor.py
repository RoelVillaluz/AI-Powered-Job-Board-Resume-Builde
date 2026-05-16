"""
location_factor.py
──────────────────
Step 2 of the Salary Prediction Engine.

Applies location-based adjustments to a base salary anchor, producing:
    - nominal_salary:    what the job actually pays in that market
    - real_value_salary: purchasing power equivalent (cost-of-living adjusted)
    - location_delta:    nominal - anchor
    - col_delta:         real_value - nominal

Architecture change (v3)
────────────────────────
The previous version applied a hard median cap on nominal salary here.
This caused compression: the cap fired before experience and skill premiums,
so both weak and strong candidates entered downstream steps at the same
capped input — producing near-zero spread between candidates.

The cap is now removed. Instead:
    - location_data.salaryData (p25, p75, median) is passed through on the
      result so TalentDeviation (step 5) can use it as the distribution
      the candidate is placed within.
    - nominal_yearly is still computed (anchor × (1 + baselineFactor))
      for the experience and skill premium steps.
    - TalentDeviation produces the final salary — the nominal is an
      intermediate value, not the prediction.

For markets with local salary data, TalentDeviation uses the p25→p75
range directly and ignores the nominal entirely. For markets without
local salary data, nominal flows through to skill/experience steps
and TalentDeviation applies as a ±15% modifier.

Formulas
────────
    nominal    = anchor × (1 + baselineFactor)
    real_value = nominal × (100 / costOfLivingIndex)   ← purchasing power context

Pure compute — zero DB access. Location data is passed in via payload.
"""

from __future__ import annotations

import logging
from typing import NamedTuple, Optional

logger = logging.getLogger(__name__)


# ── Constants ─────────────────────────────────────────────────────────────────

COL_INDEX_BASELINE: float = 100.0

CONFIDENCE_PENALTY_NO_LOCATION:        float = 20.0
CONFIDENCE_PENALTY_NO_BASELINE_FACTOR: float = 10.0
CONFIDENCE_PENALTY_NO_COL_INDEX:       float = 5.0


# ── Result type ───────────────────────────────────────────────────────────────

class LocationAdjustment(NamedTuple):
    """
    Result of applying a location factor to a base anchor salary.

    Fields
    ------
    nominal_yearly / nominal_monthly
        anchor × (1 + baselineFactor). Used as input to experience and
        skill premium steps. Not the final predicted salary.

    real_value_yearly / real_value_monthly
        Purchasing power equivalent in a baseline-cost market.
        Surfaced in the explanation for context; not used in the prediction.

    location_delta
        Nominal minus anchor (yearly).

    col_delta
        Real value minus nominal (yearly).

    baseline_factor / col_index / location_name
        Raw values preserved for provenance and explanation.

    salary_data
        Raw salaryData from the Location document, passed through so
        TalentDeviation can use p25/p75 as the local distribution range.
        None when the location document has no salary data.

    confidence_adjustment
        Negative float — how much this step reduced confidence.

    data_gaps
        Human-readable warnings for missing fields.
    """
    nominal_yearly:        float
    nominal_monthly:       float
    real_value_yearly:     float
    real_value_monthly:    float
    location_delta:        float
    col_delta:             float
    baseline_factor:       float
    col_index:             float
    location_name:         str
    salary_data:           Optional[dict]   # passed through to TalentDeviation
    confidence_adjustment: float
    data_gaps:             list[str]


# ── Location factor application ───────────────────────────────────────────────

class LocationFactorApplicator:
    """
    Applies location-based salary adjustments to a normalized anchor.
    Static-only — no instantiation needed.
    """

    @staticmethod
    def apply(
        anchor_yearly:  float,
        location_data:  Optional[dict],
        exchange_rates: Optional[dict[str, float]] = None,
    ) -> LocationAdjustment:
        """
        Apply location factors to a base anchor salary.

        Args:
            anchor_yearly:  Normalized yearly anchor (base currency).
            location_data:  Subset of the Location document:
                            {
                                "name": str,
                                "baselineFactor": float,
                                "costOfLivingIndex": float,
                                "salaryData": {
                                    "medianSalary": float,
                                    "p25": float,
                                    "p75": float,
                                    "currency": str,
                                }
                            }
            exchange_rates: Passed through — stored on result for TalentDeviation.

        Returns:
            LocationAdjustment. salaryData is passed through for downstream use.
        """
        data_gaps:             list[str] = []
        confidence_adjustment: float     = 0.0

        # ── No location data ──────────────────────────────────────────────
        if not location_data:
            logger.warning(
                "[LocationFactorApplicator] No location data — "
                "returning anchor unchanged."
            )
            data_gaps.append(
                "Location data unavailable — salary reflects role baseline only"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_NO_LOCATION
            return LocationFactorApplicator._passthrough(
                anchor_yearly, confidence_adjustment, data_gaps,
                location_name="Unknown",
            )

        location_name   = location_data.get("name", "Unknown")
        baseline_factor = location_data.get("baselineFactor")
        col_index       = location_data.get("costOfLivingIndex")
        salary_data     = location_data.get("salaryData")

        # ── Missing baselineFactor ────────────────────────────────────────
        if baseline_factor is None:
            logger.warning(
                f"[LocationFactorApplicator] '{location_name}' has no "
                f"baselineFactor — treating as 0."
            )
            data_gaps.append(
                f"Market rate data unavailable for {location_name} — "
                f"salary reflects role baseline only"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_NO_BASELINE_FACTOR
            baseline_factor = 0.0

        # ── Missing costOfLivingIndex ─────────────────────────────────────
        if col_index is None:
            logger.warning(
                f"[LocationFactorApplicator] '{location_name}' has no "
                f"costOfLivingIndex — treating as 100."
            )
            data_gaps.append(
                f"Cost-of-living data unavailable for {location_name} — "
                f"purchasing power estimate omitted"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_NO_COL_INDEX
            col_index = COL_INDEX_BASELINE

        # ── Nominal and real value ────────────────────────────────────────
        nominal_yearly  = round(anchor_yearly * (1.0 + baseline_factor), 2)
        nominal_monthly = round(nominal_yearly / 12, 2)

        real_value_yearly  = round(nominal_yearly * (COL_INDEX_BASELINE / col_index), 2)
        real_value_monthly = round(real_value_yearly / 12, 2)

        location_delta = round(nominal_yearly  - anchor_yearly,   2)
        col_delta      = round(real_value_yearly - nominal_yearly, 2)

        logger.info(
            f"[LocationFactorApplicator] '{location_name}' "
            f"baselineFactor={baseline_factor:+.2f} COL={col_index:.1f} "
            f"salary_data={'present' if salary_data else 'absent'} | "
            f"anchor={anchor_yearly:,.0f} → "
            f"nominal={nominal_yearly:,.0f} "
            f"real_value={real_value_yearly:,.0f}"
        )

        return LocationAdjustment(
            nominal_yearly=        nominal_yearly,
            nominal_monthly=       nominal_monthly,
            real_value_yearly=     real_value_yearly,
            real_value_monthly=    real_value_monthly,
            location_delta=        location_delta,
            col_delta=             col_delta,
            baseline_factor=       baseline_factor,
            col_index=             col_index,
            location_name=         location_name,
            salary_data=           salary_data,
            confidence_adjustment= confidence_adjustment,
            data_gaps=             data_gaps,
        )

    # ── Internal helpers ──────────────────────────────────────────────────

    @staticmethod
    def _passthrough(
        anchor_yearly:         float,
        confidence_adjustment: float,
        data_gaps:             list[str],
        location_name:         str,
    ) -> LocationAdjustment:
        monthly = round(anchor_yearly / 12, 2)
        return LocationAdjustment(
            nominal_yearly=        anchor_yearly,
            nominal_monthly=       monthly,
            real_value_yearly=     anchor_yearly,
            real_value_monthly=    monthly,
            location_delta=        0.0,
            col_delta=             0.0,
            baseline_factor=       0.0,
            col_index=             COL_INDEX_BASELINE,
            location_name=         location_name,
            salary_data=           None,
            confidence_adjustment= confidence_adjustment,
            data_gaps=             data_gaps,
        )

    # ── Explanation helpers ───────────────────────────────────────────────

    @staticmethod
    def build_explanation(adjustment: LocationAdjustment) -> list[str]:
        lines: list[str] = []

        if adjustment.baseline_factor == 0.0 and not adjustment.location_name:
            return lines

        if adjustment.baseline_factor > 0:
            lines.append(
                f"{adjustment.location_name} is a high-demand market — "
                f"salaries run {adjustment.baseline_factor * 100:.0f}% above the "
                f"global baseline."
            )
        elif adjustment.baseline_factor < 0:
            lines.append(
                f"{adjustment.location_name} is a below-baseline market — "
                f"salaries run {abs(adjustment.baseline_factor) * 100:.0f}% below the "
                f"global baseline."
            )
        else:
            lines.append(
                f"{adjustment.location_name} is at the global salary baseline."
            )

        if adjustment.col_index != COL_INDEX_BASELINE and adjustment.col_delta != 0.0:
            if adjustment.col_delta < 0:
                lines.append(
                    f"Cost of living in {adjustment.location_name} is "
                    f"{adjustment.col_index - COL_INDEX_BASELINE:.0f}% above baseline — "
                    f"your purchasing power is equivalent to "
                    f"${adjustment.real_value_yearly:,.0f}/year in a baseline market."
                )
            else:
                lines.append(
                    f"Cost of living in {adjustment.location_name} is "
                    f"{COL_INDEX_BASELINE - adjustment.col_index:.0f}% below baseline — "
                    f"your purchasing power is equivalent to "
                    f"${adjustment.real_value_yearly:,.0f}/year in a baseline market."
                )

        return lines
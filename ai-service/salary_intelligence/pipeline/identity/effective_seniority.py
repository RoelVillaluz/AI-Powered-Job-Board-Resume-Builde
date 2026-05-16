"""
effective_seniority.py
──────────────────────
Derives the *effective* seniority level used by the salary prediction
pipeline — which may differ from the seniority claimed on the resume's
job title.

Problem
───────
Seniority level is read from the job title on the resume and used as-is
to select experience and skill premium profiles. This means a resume
claiming "Senior AI Engineer" with 0 YOE and no skills gets the Senior
profile (exp_max=45%, skill_max=60%) — producing up to $41k more than
a genuine Mid-Level candidate with identical data.

Fix
───
Effective seniority is the *minimum* of:
    1. The claimed seniority (from the job title)
    2. The seniority the data actually supports (experience + skill count)

Thresholds
──────────
    Claimed Senior    + yrs >= 6 and skills >= 4  → Senior
    Claimed Senior    + yrs >= 3 and skills >= 3  → Mid-Level
    Claimed Senior    + below partial threshold    → Entry
    Claimed Mid-Level + yrs >= 1 and skills >= 2  → Mid-Level
    Claimed Mid-Level + below threshold            → Entry
    Claimed Entry / Intern                         → no downgrade

Pure compute — zero DB access.
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ── Thresholds ────────────────────────────────────────────────────────────────

_SENIOR_FULL_THRESHOLD    = (6.0, 12)   # meets both → Senior
_SENIOR_PARTIAL_THRESHOLD = (3.0, 8)   # meets both → Mid-Level; below → Entry

_MID_LEVEL_THRESHOLD = (1.0, 6)        # meets both → Mid-Level; below → Entry


def resolve_effective_seniority(
    claimed_seniority:      str,
    total_experience_years: Optional[float],
    skill_count:            int,
) -> tuple[str, bool]:
    """
    Derive the effective seniority the pipeline should use.

    Args:
        claimed_seniority:      Seniority from the resume job title.
        total_experience_years: From ResumeEmbedding.metrics. None treated as 0.
        skill_count:            Number of skills in skill_market_data payload.

    Returns:
        (effective_seniority, was_downgraded)
        was_downgraded is True when the claimed level was reduced.
        Used by the explanation layer to surface a note to the candidate.
    """
    years = total_experience_years if total_experience_years is not None else 0.0

    if claimed_seniority == "Senior":
        if years >= _SENIOR_FULL_THRESHOLD[0] and skill_count >= _SENIOR_FULL_THRESHOLD[1]:
            return "Senior", False

        if years >= _SENIOR_PARTIAL_THRESHOLD[0] and skill_count >= _SENIOR_PARTIAL_THRESHOLD[1]:
            logger.info(
                f"[EffectiveSeniority] Senior → Mid-Level "
                f"(years={years:.1f} need {_SENIOR_FULL_THRESHOLD[0]}, "
                f"skills={skill_count} need {_SENIOR_FULL_THRESHOLD[1]})"
            )
            return "Mid-Level", True

        logger.info(
            f"[EffectiveSeniority] Senior → Entry "
            f"(years={years:.1f} need {_SENIOR_PARTIAL_THRESHOLD[0]}, "
            f"skills={skill_count} need {_SENIOR_PARTIAL_THRESHOLD[1]})"
        )
        return "Entry", True

    if claimed_seniority == "Mid-Level":
        if years >= _MID_LEVEL_THRESHOLD[0] and skill_count >= _MID_LEVEL_THRESHOLD[1]:
            return "Mid-Level", False

        logger.info(
            f"[EffectiveSeniority] Mid-Level → Entry "
            f"(years={years:.1f} need {_MID_LEVEL_THRESHOLD[0]}, "
            f"skills={skill_count} need {_MID_LEVEL_THRESHOLD[1]})"
        )
        return "Entry", True

    # Intern and Entry are not downgraded
    return claimed_seniority, False
"""
skill_premium.py  (updated)
───────────────────────────
Changes from previous version
──────────────────────────────
1. score_skill() now applies a level_weight multiplier based on the
   candidate's self-reported proficiency (Expert/Intermediate/Beginner).
   Previously, skill level was received in the payload but silently ignored.

   Impact:
     - Two resumes with the same job title and same skills but different
       proficiency levels now produce different portfolio scores.
     - A Beginner with 17 skills no longer beats an Intermediate with 5
       relevant skills — breadth without depth is correctly discounted.

2. _SKILL_LEVEL_WEIGHT dict added as a module-level constant so it can
   be updated in one place (mirrors _IMPORTANCE_WEIGHT in skill_title_alignment).

Everything else — profiles, power curve formula, apply(), passthrough,
explanation helpers — is unchanged.
"""

from __future__ import annotations

import logging
from typing import NamedTuple, Optional

logger = logging.getLogger(__name__)


# ── Seniority profiles ────────────────────────────────────────────────────────

class _SkillProfile(NamedTuple):
    max_premium:   float
    acceleration:  float


_PROFILES: dict[str, _SkillProfile] = {
    "Intern":    _SkillProfile(max_premium=0.12, acceleration=1.00),
    "Entry":     _SkillProfile(max_premium=0.25, acceleration=0.85),
    "Mid-Level": _SkillProfile(max_premium=0.45, acceleration=0.70),
    "Senior":    _SkillProfile(max_premium=0.60, acceleration=0.55),
}

_DEFAULT_PROFILE = _SkillProfile(max_premium=0.45, acceleration=0.70)

_DEMAND_WEIGHT: float = 0.6
_GROWTH_WEIGHT: float = 0.4

# ── NEW: Skill level weight ───────────────────────────────────────────────────
# Matches Resume.skills[].level enum, passed through skill_market_data["level"].
# Mirrors _LEVEL_WEIGHT in skill_title_alignment.py — keep in sync.
#
# Why these values:
#   Beginner     (0.40) — awareness only; not production-ready
#   Intermediate (0.75) — can work independently, not fully optimized
#   Expert       (1.00) — full signal; commands premium
#
# A Beginner gets 40% of the demand signal — so breadth without depth
# is correctly discounted. 17 Beginner skills ≠ 5 Intermediate skills.

_SKILL_LEVEL_WEIGHT: dict[str, float] = {
    "Beginner":     0.40,
    "Intermediate": 0.75,
    "Expert":       1.00,
}
_DEFAULT_LEVEL_WEIGHT: float = 0.40   # Beginner — assume least when unknown

CONFIDENCE_PENALTY_NO_SKILLS:     float = 20.0
CONFIDENCE_PENALTY_SPARSE_SKILLS: float = 10.0
MIN_SKILLS_FOR_FULL_CONFIDENCE:   int   = 6

# ── Result types ──────────────────────────────────────────────────────────────

class SkillScore(NamedTuple):
    """
    Per-skill demand score — preserved for explanation and transparency.

    Fields
    ------
    name
        Skill name from payload.

    demand_score
        Raw demand signal before level weight:
        (demandScore × 0.6 + growthRate × 0.4) / 100.

    weighted_score
        demand_score × seniorityMultiplier × level_weight.
        This is what the portfolio average is computed from.
        Level weight discounts Beginner skills so breadth ≠ depth.

    seniority_multiplier
        Raw seniorityMultiplier from the Skill document.

    level
        Self-reported proficiency level from the resume.

    level_weight
        The multiplier applied for this level (0.40 / 0.75 / 1.00).
        Preserved so explanation layer can show: "React (Beginner, 0.40×)".
    """
    name:                 str
    demand_score:         float
    weighted_score:       float
    seniority_multiplier: float
    level:                str
    level_weight:         float


class SkillPremiumAdjustment(NamedTuple):
    skill_yearly:          float
    skill_monthly:         float
    skill_delta:           float
    multiplier:            float
    portfolio_score:       float
    skill_scores:          list[SkillScore]
    top_skills:            list[SkillScore]
    seniority_level:       str
    max_premium:           float
    confidence_adjustment: float
    data_gaps:             list[str]


# ── Skill premium calculation ─────────────────────────────────────────────────

class SkillPremium:

    @staticmethod
    def get_profile(seniority_level: str) -> _SkillProfile:
        profile = _PROFILES.get(seniority_level)
        if profile is None:
            logger.warning(
                f"[SkillPremium] Unrecognised seniority '{seniority_level}' — "
                f"using Mid-Level profile as default."
            )
            return _DEFAULT_PROFILE
        return profile

    @staticmethod
    def score_skill(skill: dict) -> SkillScore:
        """
        Compute the demand signal for a single skill.

        Formula (updated):
            demand_score   = (demandScore/100 × 0.6) + (growthRate/100 × 0.4)
            level_weight   = _SKILL_LEVEL_WEIGHT[skill["level"]]   ← NEW
            weighted_score = demand_score × seniorityMultiplier × level_weight

        Previously level was ignored — this meant 17 Beginner skills produced
        nearly the same portfolio score as 17 Expert skills. Now Beginner
        skills contribute 40% of their demand signal.
        """
        demand_raw  = skill.get("demandScore", 0) / 100
        growth_raw  = skill.get("growthRate",  0) / 100
        seniority_m = skill.get("seniorityMultiplier", 1.0)
        level       = skill.get("level", "Beginner")

        demand_score  = (demand_raw * _DEMAND_WEIGHT) + (growth_raw * _GROWTH_WEIGHT)
        level_weight  = _SKILL_LEVEL_WEIGHT.get(level, _DEFAULT_LEVEL_WEIGHT)

        # Level weight applied here — the key change
        weighted_score = demand_score * seniority_m * level_weight

        return SkillScore(
            name=                 skill.get("name", "Unknown"),
            demand_score=         round(demand_score,   4),
            weighted_score=       round(weighted_score, 4),
            seniority_multiplier= seniority_m,
            level=                level,
            level_weight=         level_weight,
        )

    @staticmethod
    def compute_portfolio_score(skill_scores: list[SkillScore]) -> float:
        """
        Weighted average demand score across all skills.

        Weight = seniorityMultiplier × level_weight so role-critical skills
        at higher proficiency contribute more. A Beginner skill with
        seniorityMultiplier=1.0 has weight 0.40; an Expert skill with
        seniorityMultiplier=1.5 has weight 1.50.
        """
        if not skill_scores:
            return 0.0

        total_weight = sum(s.seniority_multiplier * s.level_weight for s in skill_scores)
        weighted_sum = sum(s.weighted_score for s in skill_scores)

        if total_weight == 0:
            return 0.0

        return round(weighted_sum / total_weight, 6)

    @staticmethod
    def compute_multiplier(
        portfolio_score: float,
        max_premium:     float,
        acceleration:    float,
    ) -> float:
        """
        Convert portfolio score → salary multiplier using a power curve.

            raw_premium = max_premium × portfolio_score ^ (1 / acceleration)
            multiplier  = 1.0 + raw_premium

        Clamped to [1.0, 1.0 + max_premium].
        """
        if portfolio_score <= 0 or max_premium <= 0:
            return 1.0

        import math
        score_clamped = min(1.0, portfolio_score)
        exponent      = 1.0 / acceleration
        raw_premium   = max_premium * (score_clamped ** exponent)
        multiplier    = 1.0 + raw_premium

        return round(min(multiplier, 1.0 + max_premium), 6)

    @staticmethod
    def apply(
        input_salary:      float,
        seniority_level:   str,
        skill_market_data: Optional[list[dict]],
    ) -> SkillPremiumAdjustment:
        """
        Apply the skill premium to an experience-adjusted salary.

        skill_market_data entries now expected to include 'level':
            { name, demandScore, growthRate, seniorityMultiplier, level }
        Falls back to 'Beginner' when level is absent.
        """
        data_gaps:             list[str] = []
        confidence_adjustment: float     = 0.0
        profile = SkillPremium.get_profile(seniority_level)

        if not skill_market_data:
            logger.warning("[SkillPremium] No skill market data.")
            data_gaps.append("Skill market data unavailable — skill premium not applied")
            confidence_adjustment -= CONFIDENCE_PENALTY_NO_SKILLS
            return SkillPremium._passthrough(
                input_salary, profile, seniority_level,
                confidence_adjustment, data_gaps,
            )

        skill_scores = [SkillPremium.score_skill(s) for s in skill_market_data]

        if len(skill_scores) < MIN_SKILLS_FOR_FULL_CONFIDENCE:
            logger.warning(
                f"[SkillPremium] Only {len(skill_scores)} skill(s) — confidence penalised."
            )
            data_gaps.append(
                f"Only {len(skill_scores)} skill(s) found — "
                f"skill premium based on limited data "
                f"({MIN_SKILLS_FOR_FULL_CONFIDENCE} needed for full confidence)"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_SPARSE_SKILLS

        portfolio_score = SkillPremium.compute_portfolio_score(skill_scores)
        multiplier      = SkillPremium.compute_multiplier(
            portfolio_score, profile.max_premium, profile.acceleration
        )

        skill_yearly  = round(input_salary * multiplier, 2)
        skill_monthly = round(skill_yearly / 12, 2)
        skill_delta   = round(skill_yearly - input_salary, 2)
        top_skills    = sorted(skill_scores, key=lambda s: s.weighted_score, reverse=True)[:3]

        logger.info(
            f"[SkillPremium] seniority={seniority_level} "
            f"skills={len(skill_scores)} "
            f"portfolio_score={portfolio_score:.4f} "
            f"multiplier={multiplier:.4f} "
            f"input={input_salary:,.0f} → "
            f"skill_salary={skill_yearly:,.0f} "
            f"delta={skill_delta:+,.0f} "
            f"top_skills={[s.name for s in top_skills]}"
        )

        return SkillPremiumAdjustment(
            skill_yearly=          skill_yearly,
            skill_monthly=         skill_monthly,
            skill_delta=           skill_delta,
            multiplier=            multiplier,
            portfolio_score=       portfolio_score,
            skill_scores=          skill_scores,
            top_skills=            top_skills,
            seniority_level=       seniority_level,
            max_premium=           profile.max_premium,
            confidence_adjustment= confidence_adjustment,
            data_gaps=             data_gaps,
        )

    @staticmethod
    def _passthrough(
        input_salary:          float,
        profile:               _SkillProfile,
        seniority_level:       str,
        confidence_adjustment: float,
        data_gaps:             list[str],
    ) -> SkillPremiumAdjustment:
        monthly = round(input_salary / 12, 2)
        return SkillPremiumAdjustment(
            skill_yearly=          input_salary,
            skill_monthly=         monthly,
            skill_delta=           0.0,
            multiplier=            1.0,
            portfolio_score=       0.0,
            skill_scores=          [],
            top_skills=            [],
            seniority_level=       seniority_level,
            max_premium=           profile.max_premium,
            confidence_adjustment= confidence_adjustment,
            data_gaps=             data_gaps,
        )

    @staticmethod
    def build_explanation(adjustment: SkillPremiumAdjustment) -> list[str]:
        lines: list[str] = []

        if adjustment.skill_delta == 0.0:
            return lines

        pct_uplift    = (adjustment.multiplier - 1.0) * 100
        portfolio_pct = adjustment.portfolio_score * 100

        lines.append(
            f"Your skill portfolio scores {portfolio_pct:.0f}/100 on market demand, "
            f"adding ${adjustment.skill_delta:,.0f}/year "
            f"({pct_uplift:.1f}% above the experience-adjusted baseline)."
        )

        if adjustment.top_skills:
            top_names = ", ".join(
                f"{s.name} ({s.level})" for s in adjustment.top_skills
            )
            lines.append(f"Highest-value skills: {top_names}.")

        pct_of_ceiling = (adjustment.multiplier - 1.0) / adjustment.max_premium
        if pct_of_ceiling >= 0.90:
            lines.append(
                f"You're near the skill premium ceiling for {adjustment.seniority_level} level. "
                f"Further salary growth will come from title progression or location."
            )
        else:
            remaining_pct = (1.0 - pct_of_ceiling) * 100
            lines.append(
                f"There's still {remaining_pct:.0f}% of the {adjustment.seniority_level} "
                f"skill ceiling available — higher proficiency or more in-demand skills "
                f"could increase your estimate further."
            )

        return lines

    @staticmethod
    def premium_remaining(adjustment: SkillPremiumAdjustment) -> float:
        input_salary      = adjustment.skill_yearly - adjustment.skill_delta
        salary_at_ceiling = input_salary * (1.0 + adjustment.max_premium)
        return round(max(0.0, salary_at_ceiling - adjustment.skill_yearly), 2)
"""
skill_title_alignment.py
────────────────────────
Step 0.5 of the Salary Prediction Engine.

Measures how well a resume's skills match the claimed job title's expected
skill set. The alignment score drives two downstream effects:

    1. Anchor blending — low alignment bypasses or dilutes the job title
       anchor in favour of the industry baseline, preventing title inflation
       from producing unrealistic predictions.

    2. Confidence penalty — low alignment tanks the confidence score,
       widening the salary range band and flagging the prediction as
       unreliable.

Why this step exists
────────────────────
Without alignment checking, a BSIT student who types "Senior Machine
Learning Engineer" on their resume gets an ML Engineer anchor ($150k+)
applied to their profile despite having HTML/CSS/TypeScript skills and
zero work experience. The effective_seniority step downgrades "Senior"
→ "Entry", but the anchor is still pulled from ML Engineer salary data —
which is high even at Entry level.

Alignment score
───────────────
    matched    = resume_skill_names ∩ job_title_top_skill_names
    raw_score  = len(matched) / len(job_title_top_skills)

    weighted_score accounts for skill importance (Required > Preferred >
    Nice-to-Have) and the candidate's self-reported proficiency level
    (Expert > Intermediate > Beginner).

    importance_weight = { Required: 1.0, Preferred: 0.7, Nice-to-Have: 0.4 }
    level_weight      = { Expert: 1.0, Intermediate: 0.7, Beginner: 0.4 }

    For each matched skill:
        contribution = importance_weight × level_weight

    alignment_score = sum(contributions) / sum(all importance_weights)

Anchor blending
───────────────
    alignment >= HIGH_THRESHOLD (0.60) → full job title anchor (trust the title)
    alignment <= LOW_THRESHOLD  (0.25) → full industry anchor (ignore the title)
    between                            → linear blend

    blended = job_title_anchor × blend_weight
            + industry_anchor  × (1 - blend_weight)

    blend_weight = (alignment - LOW_THRESHOLD) / (HIGH_THRESHOLD - LOW_THRESHOLD)
    blend_weight = clamp(blend_weight, 0.0, 1.0)

Pure compute — zero DB access.
"""

from __future__ import annotations

import logging
from typing import NamedTuple, Optional

logger = logging.getLogger(__name__)


# ── Thresholds ────────────────────────────────────────────────────────────────

# At or above HIGH_THRESHOLD: full job title anchor used (no blending)
ALIGNMENT_HIGH_THRESHOLD: float = 0.60

# At or below LOW_THRESHOLD: industry anchor used entirely (title bypassed)
ALIGNMENT_LOW_THRESHOLD:  float = 0.25

# Confidence penalties applied to the accumulated confidence score
CONFIDENCE_PENALTY_LOW_ALIGNMENT:      float = 30.0   # alignment < LOW_THRESHOLD
CONFIDENCE_PENALTY_PARTIAL_ALIGNMENT:  float = 15.0   # LOW < alignment < HIGH
CONFIDENCE_PENALTY_NO_TOP_SKILLS:      float = 10.0   # job_title_data has no topSkills


# ── Importance and level weights ──────────────────────────────────────────────

# Matches JobTitle.topSkills[].importance schema enum
_IMPORTANCE_WEIGHT: dict[str, float] = {
    "Required":     1.0,
    "Preferred":    0.7,
    "Nice-to-Have": 0.4,
}

# Matches Resume.skills[].level enum (passed through skill_market_data)
_LEVEL_WEIGHT: dict[str, float] = {
    "Expert":       1.0,
    "Intermediate": 0.7,
    "Beginner":     0.4,
}

_DEFAULT_IMPORTANCE_WEIGHT: float = 0.7   # Preferred — conservative default
_DEFAULT_LEVEL_WEIGHT:      float = 0.4   # Beginner  — assume least when unknown


# ── Result type ───────────────────────────────────────────────────────────────

class AlignmentResult(NamedTuple):
    """
    Result of measuring skill-title alignment.

    Fields
    ------
    alignment_score
        0.0–1.0. Weighted overlap between resume skills and job title topSkills.
        0.0 = no overlap at all (e.g. HTML/CSS vs ML Engineer role)
        1.0 = perfect match at Expert level for all Required skills

    blend_weight
        0.0–1.0. How much of the job title anchor to use in blending.
        Derived from alignment_score and the LOW/HIGH thresholds.
        0.0 = use industry anchor entirely
        1.0 = use job title anchor entirely

    matched_skills
        Names of resume skills that appear in job title topSkills.
        Used by explanation layer.

    missing_required_skills
        Required skills from job title topSkills that are absent from resume.
        Used by explanation layer to show gaps.

    confidence_adjustment
        Negative float — how much this step reduces accumulated confidence.

    data_gaps
        Human-readable warnings passed to explanation layer.

    alignment_label
        Human-readable label for the UI: 'Strong' | 'Partial' | 'Weak'
    """
    alignment_score:          float
    blend_weight:             float
    matched_skills:           list[str]
    missing_required_skills:  list[str]
    confidence_adjustment:    float
    data_gaps:                list[str]
    alignment_label:          str


# ── Alignment calculator ──────────────────────────────────────────────────────

class SkillTitleAlignment:
    """
    Measures overlap between resume skills and a job title's expected skill set.

    Static-only — no instantiation needed.
    """

    # ── Alignment score ───────────────────────────────────────────────────

    @staticmethod
    def compute(
        resume_skill_market_data: Optional[list[dict]],
        job_title_top_skills:     Optional[list[dict]],
    ) -> AlignmentResult:
        """
        Compute the weighted skill-title alignment score.

        Args:
            resume_skill_market_data:
                skill_market_data from the prediction payload. Each entry:
                { name, demandScore, growthRate, seniorityMultiplier, level }
                The 'level' field is the candidate's self-reported proficiency.

            job_title_top_skills:
                job_title_data["topSkills"] from the prediction payload. Each entry:
                { skillName, importance }
                Sourced from JobTitle.topSkills in the DB.

        Returns:
            AlignmentResult with score, blend weight, gaps, and metadata.
        """
        data_gaps:             list[str] = []
        confidence_adjustment: float     = 0.0

        # ── No job title top skills — can't measure alignment ─────────────
        if not job_title_top_skills:
            logger.warning(
                "[SkillTitleAlignment] No topSkills on job_title_data — "
                "alignment cannot be measured. Treating as neutral (blend_weight=1.0)."
            )
            data_gaps.append(
                "Job title skill requirements unavailable — "
                "salary based on title benchmark only"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_NO_TOP_SKILLS

            # No topSkills means we can't penalise the candidate — neutral
            return SkillTitleAlignment._neutral(confidence_adjustment, data_gaps)

        # ── No resume skills ──────────────────────────────────────────────
        if not resume_skill_market_data:
            logger.warning(
                "[SkillTitleAlignment] No resume skill data — alignment = 0.0."
            )
            data_gaps.append(
                "No skills on resume — salary heavily adjusted toward industry baseline"
            )
            confidence_adjustment -= CONFIDENCE_PENALTY_LOW_ALIGNMENT

            return SkillTitleAlignment._zero_alignment(
                job_title_top_skills, confidence_adjustment, data_gaps
            )

        # ── Build lookup maps ─────────────────────────────────────────────
        # Resume skills: name (lowered) → proficiency level
        resume_level_map: dict[str, str] = {
            s.get("name", "").lower(): s.get("level", "Beginner")
            for s in resume_skill_market_data
            if s.get("name")
        }

        # ── Score each job title skill ────────────────────────────────────
        total_importance_weight: float    = 0.0
        matched_weight:          float    = 0.0
        matched_skills:          list[str] = []
        missing_required:        list[str] = []

        for top_skill in job_title_top_skills:
            skill_name  = top_skill.get("skillName", "").lower()
            importance  = top_skill.get("importance", "Preferred")
            imp_weight  = _IMPORTANCE_WEIGHT.get(importance, _DEFAULT_IMPORTANCE_WEIGHT)

            total_importance_weight += imp_weight

            if skill_name in resume_level_map:
                level       = resume_level_map[skill_name]
                lvl_weight  = _LEVEL_WEIGHT.get(level, _DEFAULT_LEVEL_WEIGHT)
                contribution = imp_weight * lvl_weight

                matched_weight += contribution
                matched_skills.append(top_skill.get("skillName", skill_name))

                logger.debug(
                    f"[SkillTitleAlignment] MATCH '{skill_name}' "
                    f"importance={importance}({imp_weight}) "
                    f"level={level}({lvl_weight}) "
                    f"contribution={contribution:.3f}"
                )
            else:
                if importance == "Required":
                    missing_required.append(top_skill.get("skillName", skill_name))

                logger.debug(
                    f"[SkillTitleAlignment] MISS '{skill_name}' "
                    f"importance={importance}"
                )

        # ── Compute alignment score ───────────────────────────────────────
        if total_importance_weight == 0:
            alignment_score = 0.0
        else:
            alignment_score = round(matched_weight / total_importance_weight, 4)

        # ── Derive blend weight from thresholds ───────────────────────────
        blend_weight = SkillTitleAlignment._blend_weight(alignment_score)

        # ── Confidence penalty ────────────────────────────────────────────
        if alignment_score <= ALIGNMENT_LOW_THRESHOLD:
            confidence_adjustment -= CONFIDENCE_PENALTY_LOW_ALIGNMENT
            alignment_label = "Weak"
            if missing_required:
                data_gaps.append(
                    f"Skills don't match the claimed role — "
                    f"missing required: {', '.join(missing_required[:5])}. "
                    f"Salary adjusted toward industry baseline."
                )
            else:
                data_gaps.append(
                    "Skill set has low overlap with the claimed role — "
                    "salary adjusted toward industry baseline."
                )
        elif alignment_score < ALIGNMENT_HIGH_THRESHOLD:
            confidence_adjustment -= CONFIDENCE_PENALTY_PARTIAL_ALIGNMENT
            alignment_label = "Partial"
            if missing_required:
                data_gaps.append(
                    f"Partial skill match for this role — "
                    f"missing required: {', '.join(missing_required[:3])}."
                )
        else:
            alignment_label = "Strong"

        logger.info(
            f"[SkillTitleAlignment] "
            f"score={alignment_score:.3f} "
            f"blend={blend_weight:.3f} "
            f"label={alignment_label} "
            f"matched={len(matched_skills)}/{len(job_title_top_skills)} "
            f"missing_required={len(missing_required)}"
        )

        return AlignmentResult(
            alignment_score=         alignment_score,
            blend_weight=            blend_weight,
            matched_skills=          matched_skills,
            missing_required_skills= missing_required,
            confidence_adjustment=   confidence_adjustment,
            data_gaps=               data_gaps,
            alignment_label=         alignment_label,
        )

    # ── Anchor blending ───────────────────────────────────────────────────

    @staticmethod
    def blend_anchors(
        job_title_yearly:  float,
        industry_yearly:   float,
        blend_weight:      float,
    ) -> float:
        """
        Blend job title and industry anchors by alignment weight.

            blended = job_title × blend_weight + industry × (1 - blend_weight)

        blend_weight = 1.0 → full job title anchor (strong alignment)
        blend_weight = 0.0 → full industry anchor  (weak alignment / title inflation)

        Args:
            job_title_yearly: Normalized yearly from job title anchor resolution.
            industry_yearly:  Normalized yearly from industry anchor resolution.
            blend_weight:     From AlignmentResult.blend_weight.

        Returns:
            Blended yearly salary in base currency.
        """
        if blend_weight >= 1.0:
            return job_title_yearly
        if blend_weight <= 0.0:
            return industry_yearly

        blended = (job_title_yearly * blend_weight) + (industry_yearly * (1.0 - blend_weight))

        logger.info(
            f"[SkillTitleAlignment] Blend — "
            f"job_title={job_title_yearly:,.0f} × {blend_weight:.2f} + "
            f"industry={industry_yearly:,.0f} × {1 - blend_weight:.2f} "
            f"= {blended:,.0f}"
        )

        return round(blended, 2)

    # ── Internal helpers ──────────────────────────────────────────────────

    @staticmethod
    def _blend_weight(alignment_score: float) -> float:
        """
        Linear interpolation between LOW and HIGH thresholds.

            below LOW  → 0.0 (full industry)
            above HIGH → 1.0 (full job title)
            between    → linear interpolation
        """
        if alignment_score <= ALIGNMENT_LOW_THRESHOLD:
            return 0.0
        if alignment_score >= ALIGNMENT_HIGH_THRESHOLD:
            return 1.0
        span = ALIGNMENT_HIGH_THRESHOLD - ALIGNMENT_LOW_THRESHOLD
        return round((alignment_score - ALIGNMENT_LOW_THRESHOLD) / span, 4)

    @staticmethod
    def _neutral(
        confidence_adjustment: float,
        data_gaps: list[str],
    ) -> AlignmentResult:
        """No topSkills data — can't penalise, treat as neutral blend."""
        return AlignmentResult(
            alignment_score=         0.5,
            blend_weight=            1.0,   # no evidence to downgrade
            matched_skills=          [],
            missing_required_skills= [],
            confidence_adjustment=   confidence_adjustment,
            data_gaps=               data_gaps,
            alignment_label=         "Unknown",
        )

    @staticmethod
    def _zero_alignment(
        job_title_top_skills:  list[dict],
        confidence_adjustment: float,
        data_gaps:             list[str],
    ) -> AlignmentResult:
        """No resume skills — alignment is 0.0, full industry anchor."""
        missing_required = [
            s.get("skillName", "")
            for s in job_title_top_skills
            if s.get("importance") == "Required"
        ]
        return AlignmentResult(
            alignment_score=         0.0,
            blend_weight=            0.0,
            matched_skills=          [],
            missing_required_skills= missing_required,
            confidence_adjustment=   confidence_adjustment,
            data_gaps=               data_gaps,
            alignment_label=         "Weak",
        )

    # ── Explanation helpers ───────────────────────────────────────────────

    @staticmethod
    def build_explanation(result: AlignmentResult) -> list[str]:
        """
        Generate human-readable explanation bullets for the alignment step.
        Called by the explanation layer in SalaryPredictionOrchestrator.
        """
        lines: list[str] = []

        if result.alignment_label == "Unknown":
            return lines

        if result.alignment_label == "Strong":
            lines.append(
                f"Your skills strongly match the requirements for this role "
                f"({len(result.matched_skills)} matching skills found)."
            )

        elif result.alignment_label == "Partial":
            lines.append(
                f"Your skills partially match this role "
                f"({len(result.matched_skills)} matching skills). "
                f"A stronger match would increase your estimated salary."
            )
            if result.missing_required_skills:
                lines.append(
                    f"Missing required skills: "
                    f"{', '.join(result.missing_required_skills[:5])}."
                )

        else:  # Weak
            lines.append(
                "Your current skills have low overlap with this role's requirements. "
                "The salary estimate has been adjusted toward the industry baseline."
            )
            if result.missing_required_skills:
                lines.append(
                    f"Key missing skills for this role: "
                    f"{', '.join(result.missing_required_skills[:5])}."
                )

        return lines
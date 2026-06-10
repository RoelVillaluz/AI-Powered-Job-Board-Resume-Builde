"""
Service for scoring resumes and calculating match percentages.

Pure compute layer — zero DB access.
All data is pre-fetched by Node and passed in via ScoringPayload.
"""

from typing import NamedTuple, Optional
import logging
import time
from metrics.prometheus_metrics import (
    scoring_duration_seconds,
    scoring_requests_total
)

# ── Result types ──────────────────────────────────────────────────────────────

from bson import ObjectId
from config.database import db

logger = logging.getLogger(__name__)


# ── Result types ──────────────────────────────────────────────────────────────

class ResumeScore(NamedTuple):
    completeness_score:       float
    experience_score:         float
    skills_score:             float
    certification_score:      float
    career_progression_score: float   # bonus — skills unlocking higher-paying titles
    overall_score:            float
    grade:                    str     # A+, A, B+, B, C+, C, D, F
    seniority_profile:        str     # "junior" | "mid" | "senior" — weights applied


class MatchScore(NamedTuple):
    match_percentage:     float
    skill_match:          float
    experience_match:     float
    requirement_match:    float
    recommendation_level: str
    matched_skills:       list
    missing_skills:       list
    strengths:            list
    improvements:         list


# ── Grade thresholds ──────────────────────────────────────────────────────────

_GRADE_THRESHOLDS = [
    (95, "A+"), (90, "A"), (85, "B+"), (80, "B"),
    (75, "C+"), (65, "C"), (50, "D"),  (0,  "F"),
]


# ── Seniority-aware weight profiles ──────────────────────────────────────────
#
# Junior:  experience is near-zero by definition — skills and market demand
#          carry more weight. Completeness matters more since projects/education
#          are the primary signal.
#
# Mid:     balanced — experience starts to matter, skills still dominant.
#
# Senior:  experience is the primary differentiator. Skills assumed strong.
#          Certifications weighted higher since seniors are expected to hold them.
#
# All profiles sum to 1.0 on the base components.
# career_progression is always additive on top, never penalises.

_WEIGHTS_BY_SENIORITY = {
    "junior": {
        "completeness":   0.25,
        "experience":     0.05,   # near-zero — fresh grads are expected to have none
        "skills":         0.40,
        "market_demand":  0.25,
        "certifications": 0.05,
    },
    "mid": {
        "completeness":   0.20,
        "experience":     0.20,
        "skills":         0.35,
        "market_demand":  0.15,
        "certifications": 0.10,
    },
    "senior": {
        "completeness":   0.15,
        "experience":     0.35,   # experience is the primary signal at senior level
        "skills":         0.25,
        "market_demand":  0.10,
        "certifications": 0.15,
    },
}

_CAREER_PROGRESSION_MAX_BONUS = 10.0


# ── Seniority keywords ────────────────────────────────────────────────────────

_JUNIOR_KEYWORDS  = {"junior", "jr", "entry", "associate", "intern", "trainee", "graduate", "apprentice"}
_SENIOR_KEYWORDS  = {"senior", "sr", "lead", "principal", "staff", "head", "director", "architect"}


class ScoringService:
    """Handles scoring calculations for resumes and job matches. Pure compute."""

    # ── Seniority resolution ──────────────────────────────────────────────

    @staticmethod
    def _resolve_seniority(scoring_payload: dict) -> str:
        """
        Derive the seniority profile from currentTitle.seniorityLevel.

        Falls back to keyword matching on the title string if seniorityLevel
        is absent or unrecognised.

        Returns:
            "junior" | "mid" | "senior"
        """
        current_title = scoring_payload.get("currentTitle") or {}  # handles None explicitly
        
        level = current_title.get("seniorityLevel", "").lower()

        if any(kw in level for kw in _JUNIOR_KEYWORDS):
            return "junior"
        if any(kw in level for kw in _SENIOR_KEYWORDS):
            return "senior"

        title = current_title.get("title", "").lower()
        if any(kw in title for kw in _SENIOR_KEYWORDS):
            return "senior"
        if any(kw in title for kw in _JUNIOR_KEYWORDS):
            return "junior"

        return "mid"

    @staticmethod
    def _resolve_weights(scoring_payload: dict) -> dict:
        """Return the weight profile for this resume's seniority level."""
        return _WEIGHTS_BY_SENIORITY[ScoringService._resolve_seniority(scoring_payload)]
    
    # ── Completeness ──────────────────────────────────────────────────────

    @staticmethod
    def calculate_completeness_score(resume: dict) -> float:
        """
        Score how complete the resume is based on filled sections (0–100).

        Sections checked: firstName+lastName, email, phone, summary,
        skills, workExperience, education, certifications.
        """
        checks = [
            resume.get("firstName") and resume.get("lastName"),
            resume.get("email"),
            resume.get("phone"),
            resume.get("summary"),
            bool(resume.get("skills")),
            bool(resume.get("workExperience")),
            bool(resume.get("education")),
            bool(resume.get("certifications")),
        ]
        return (sum(bool(c) for c in checks) / len(checks)) * 100

    # ── Experience ────────────────────────────────────────────────────────

    @staticmethod
    def calculate_experience_score(
        total_years: float,
        target_years: float = 5.0,
    ) -> float:
        """
        Linear score up to target_years, capped at 100 (0–100).

        Args:
            total_years:  Total years of work experience.
            target_years: Years at which the score maxes out (default 5).
        """
        if total_years >= target_years:
            return 100.0
        return (total_years / target_years) * 100

    # ── Skills ────────────────────────────────────────────────────────────

    @staticmethod
    def calculate_skills_score(
        resume: dict,
        scoring_payload: dict,
    ) -> float:
        """
        Score skills against the resume's current job title top skills (0–100).

        Uses currentTitle.topSkills from the scoring payload so we compare
        against the right role, not the whole industry.

        Importance weighting:
            Required     → 1.0
            Preferred    → 0.7
            Nice-to-Have → 0.4
        """
        resume_skill_names = {
            s.get("name", "").lower()
            for s in resume.get("skills", [])
        }

        top_skills: list = (
            scoring_payload
            .get("currentTitle") or {}  # ← add `or {}`
        ).get("topSkills", [])

        if not top_skills:
            return min(100.0, (len(resume_skill_names) / 5) * 100)

        importance_weight = {"Required": 1.0, "Preferred": 0.7, "Nice-to-Have": 0.4}
        total_weight   = 0.0
        matched_weight = 0.0

        for skill in top_skills:
            w = importance_weight.get(skill.get("importance", "Nice-to-Have"), 0.4)
            total_weight += w
            if skill.get("skillName", "").lower() in resume_skill_names:
                matched_weight += w

        if total_weight == 0:
            return 0.0

        return round((matched_weight / total_weight) * 100, 2)

    # ── Market demand ─────────────────────────────────────────────────────

    @staticmethod
    def calculate_market_demand_score(scoring_payload: dict) -> float:
        """
        Score the resume's skills by current market demand (0–100).

        Each skill contributes:
            demand_score  (0–100) × 0.6
            growth_rate   (normalised) × 0.4
            × seniorityMultiplier
        """
        market_data: list = scoring_payload.get("skillMarketData", [])

        if not market_data:
            return 0.0

        total = 0.0
        for skill in market_data:
            demand    = skill.get("demandScore", 0) / 100
            growth    = skill.get("growthRate",  0) / 100
            seniority = skill.get("seniorityMultiplier", 1.0)
            total += ((demand * 0.6) + (growth * 0.4)) * seniority

        return round(min(100.0, (total / len(market_data)) * 100), 2)

    # ── Career progression bonus ──────────────────────────────────────────

    @staticmethod
    def calculate_career_progression_score(
        resume: dict,
        scoring_payload: dict,
    ) -> float:
        """
        Bonus for resume skills that appear in higher-paying titles but NOT
        in the current title's baseline (0–_CAREER_PROGRESSION_MAX_BONUS).

        Weighted by salary delta — a skill unlocking a 50% pay jump scores
        more than one unlocking a 16% jump.
        """
        resume_skill_names = {
            s.get("name", "").lower()
            for s in resume.get("skills", [])
        }

        current_title_data = scoring_payload.get("currentTitle") or {}

        higher_paying      = scoring_payload.get("higherPayingTitles", []) or []
        current_salary     = current_title_data.get("medianSalary", 0)

        baseline_skills = {
            s.get("skillName", "").lower()
            for s in current_title_data.get("topSkills", [])
        }

        if not higher_paying or not current_salary:
            return 0.0

        total_bonus  = 0.0
        max_possible = 0.0

        for title in higher_paying:
            salary_delta = title.get("medianSalary", 0) - current_salary
            if salary_delta <= 0:
                continue

            salary_weight = min(1.0, salary_delta / current_salary)

            progression_skills = [
                s for s in title.get("topSkills", [])
                if s.get("skillName", "").lower() not in baseline_skills
            ]

            if not progression_skills:
                continue

            matched = sum(
                1 for s in progression_skills
                if s.get("skillName", "").lower() in resume_skill_names
            )

            total_bonus  += (matched / len(progression_skills)) * salary_weight
            max_possible += salary_weight

        if max_possible == 0:
            return 0.0

        return round(
            min(_CAREER_PROGRESSION_MAX_BONUS,
                (total_bonus / max_possible) * _CAREER_PROGRESSION_MAX_BONUS),
            2,
        )

    # ── Certifications ────────────────────────────────────────────────────

    @staticmethod
    def calculate_certification_score(resume: dict) -> float:
        """Score certifications — maxes at 5 certs (0–100)."""
        num_certs = len(resume.get("certifications", []))
        if num_certs == 0:
            return 0.0
        return round(min(100.0, (num_certs / 5) * 100), 2)

    # ── Grade ─────────────────────────────────────────────────────────────

    @staticmethod
    def get_grade(score: float) -> str:
        """Convert numeric score (0–100) to letter grade."""
        for threshold, grade in _GRADE_THRESHOLDS:
            if score >= threshold:
                return grade
        return "F"

    # ── Overall ───────────────────────────────────────────────────────────

    @staticmethod
    def calculate_resume_score(
        resume: dict,
        total_experience_years: float,
        scoring_payload: dict,
    ) -> ResumeScore:
        """
        Calculate the full resume score using seniority-aware weights.
 
        Seniority profiles:
            junior  → skills 40%, market_demand 25%, experience 5%
                      Fresh grads are not penalised for having no work history.
            mid     → skills 35%, experience 20%, market_demand 15%
            senior  → experience 35%, skills 25%, certifications 15%
 
        Career progression bonus (additive, max +10):
            Skills on the resume that appear in higher-paying title skill sets
            but NOT in currentTitle.topSkills. Weighted by salary delta.
 
        Args:
            resume:                 Resume dict.
            total_experience_years: Pre-computed by Node or from workExperience.
            scoring_payload:        ScoringPayload dict from Node.
        """
        start     = time.perf_counter()
        seniority = ScoringService._resolve_seniority(scoring_payload)
        weights   = _WEIGHTS_BY_SENIORITY[seniority]
 
        try:
            completeness   = ScoringService.calculate_completeness_score(resume)
            experience     = ScoringService.calculate_experience_score(total_experience_years)
            skills         = ScoringService.calculate_skills_score(resume, scoring_payload)
            market_demand  = ScoringService.calculate_market_demand_score(scoring_payload)
            certifications = ScoringService.calculate_certification_score(resume)
            career_prog    = ScoringService.calculate_career_progression_score(resume, scoring_payload)
 
            base_score = (
                completeness   * weights["completeness"]   +
                experience     * weights["experience"]     +
                skills         * weights["skills"]         +
                market_demand  * weights["market_demand"]  +
                certifications * weights["certifications"]
            )
 
            overall = round(min(100.0, base_score + career_prog), 2)
 
            scoring_requests_total.labels(status="success").inc()
            scoring_duration_seconds.observe(time.perf_counter() - start)
 
        except Exception:
            scoring_requests_total.labels(status="failed").inc()
            raise
 
        logger.info(
            f"[ScoringService] seniority={seniority} "
            f"completeness={completeness:.1f} experience={experience:.1f} "
            f"skills={skills:.1f} market={market_demand:.1f} "
            f"certs={certifications:.1f} progression={career_prog:.1f} "
            f"overall={overall:.1f}"
        )
 
        return ResumeScore(
            completeness_score=       round(completeness,   2),
            experience_score=         round(experience,     2),
            skills_score=             round(skills,         2),
            certification_score=      round(certifications, 2),
            career_progression_score= career_prog,
            overall_score=            overall,
            grade=                    ScoringService.get_grade(overall),
            seniority_profile=        seniority,
        )

    # ── Match score ───────────────────────────────────────────────────────

    @staticmethod
    def get_recommendation_level(match_percentage: float) -> str:
        if match_percentage >= 80: return "Excellent Match"
        if match_percentage >= 65: return "Good Match"
        if match_percentage >= 50: return "Fair Match"
        return "Poor Match"

    @staticmethod
    def calculate_match_score(
        similarity_score,
        resume: Optional[dict] = None,
        job:    Optional[dict] = None,
    ) -> MatchScore:
        """
        Convert similarity scores to match percentages.

        Args:
            similarity_score: SimilarityScore with skill_similarity,
                              experience_similarity, requirement_similarity,
                              total_score (all 0–1).
            resume:           Optional resume dict for detailed skill analysis.
            job:              Optional job dict for detailed skill analysis.
        """
        skill_match       = similarity_score.skill_similarity      * 100
        experience_match  = similarity_score.experience_similarity  * 100
        requirement_match = similarity_score.requirement_similarity * 100
        overall_match     = similarity_score.total_score            * 100

        matched_skills: list = []
        missing_skills: list = []
        strengths:      list = []
        improvements:   list = []

        if resume and job:
            resume_skills = {s.get("name", "").lower() for s in resume.get("skills", [])}
            job_skills    = {s.get("name", "").lower() for s in job.get("skills",    [])}

            matched_skills = list(resume_skills & job_skills)
            missing_skills = list(job_skills - resume_skills)

            if skill_match       >= 70: strengths.append("Strong skills alignment")
            if experience_match  >= 70: strengths.append("Relevant work experience")
            if requirement_match >= 70: strengths.append("Meets certification requirements")

            if skill_match      < 50: improvements.append("Develop more relevant technical skills")
            if experience_match < 50: improvements.append("Gain more experience in similar roles")
            if missing_skills:
                improvements.append(f"Consider learning: {', '.join(missing_skills[:3])}")

        return MatchScore(
            match_percentage=     round(overall_match,     2),
            skill_match=          round(skill_match,       2),
            experience_match=     round(experience_match,  2),
            requirement_match=    round(requirement_match, 2),
            recommendation_level= ScoringService.get_recommendation_level(overall_match),
            matched_skills=       matched_skills,
            missing_skills=       missing_skills,
            strengths=            strengths,
            improvements=         improvements,
        )
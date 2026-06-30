"""
Job matching service — scores a resume against a list of job candidates.

Computes a 0-100 hybrid score per resume-job pair using:
  - Weighted component scores (skill overlap, experience fit, semantic similarity,
    seniority alignment, location fit, certification match)
  - Multiplicative penalties (experience gap, seniority mismatch)
  - Flat deductions (missing required skills)

Called by /compute/score_matches after Pinecone retrieval or MongoDB fallback.
Completely separate from ScoringService which scores a resume in isolation.
"""

import logging
from typing import Any
from utils.date_utils import calculate_total_experience
from metrics.prometheus_metrics import matching_score_tiers_total

logger = logging.getLogger(__name__)

WEIGHTS = {
    "skill_match": 0.40,
    "experience_fit": 0.25,
    "semantic_sim": 0.15,
    "seniority_fit": 0.10,
    "location_fit": 0.07,
    "cert_bonus": 0.03,
}

PENALTY_EXP_GAP_LARGE = 0.70
PENALTY_EXP_GAP_MEDIUM = 0.85
PENALTY_SENIORITY = 0.80
PENALTY_MISSING_REQUIRED_SKILL = 15.0

SENIORITY_LADDER = ["Intern", "Entry", "Mid-Level", "Senior"]


class JobMatchingService:
    @staticmethod
    def score_matches(
        resume: dict,
        job_matches: list[dict],
        skill_market_data: list[dict] = [],
    ) -> list[dict]:
        """
        Score a list of job candidates for a resume.
        Returns sorted list highest score first.
        """
        # Build market lookup once — O(1) per skill during scoring
        market_lookup = JobMatchingService._build_market_lookup(skill_market_data)

        scored = [
            JobMatchingService.score_match(resume, match, market_lookup)
            for match in job_matches
        ]
        scored.sort(key=lambda x: x["finalScore"], reverse=True)

        for result in scored:
            matching_score_tiers_total.labels(tier=result["recommendationType"]).inc()

        return scored

    @staticmethod
    def score_match(
        resume: dict,
        job_match: dict,
        market_lookup: dict[str, dict] = {},
    ) -> dict[str, Any]:
        """Compute hybrid score (0-100) for a single resume-job pair."""
        metadata = job_match.get("metadata", {})
        vector_similarity = job_match.get("vectorSimilarity", 0.0)
        job_id = job_match.get("jobId", "")

        candidate_years = calculate_total_experience(resume.get("workExperience", []))

        # Pass market_lookup into skill_match — everything else unchanged
        skill_match = JobMatchingService._skill_match(resume, metadata, market_lookup)
        experience_fit = JobMatchingService._experience_fit(candidate_years, metadata)
        semantic_sim = round(vector_similarity * 100, 2)
        seniority_fit = JobMatchingService._seniority_fit(resume, metadata)
        location_fit = JobMatchingService._location_fit(resume, metadata)
        cert_bonus = JobMatchingService._cert_bonus(resume, metadata)

        # ... rest of score_match stays exactly the same ...
        missing_required = JobMatchingService._missing_required_skills(resume, metadata)
        required_penalty = min(
            len(missing_required) * PENALTY_MISSING_REQUIRED_SKILL, 40.0
        )

        base = (
            skill_match * WEIGHTS["skill_match"]
            + experience_fit * WEIGHTS["experience_fit"]
            + semantic_sim * WEIGHTS["semantic_sim"]
            + seniority_fit * WEIGHTS["seniority_fit"]
            + location_fit * WEIGHTS["location_fit"]
            + cert_bonus * WEIGHTS["cert_bonus"]
        )
        base = max(0.0, base - required_penalty)

        penalty = 1.0
        penalty_log = []

        exp_gap = abs(candidate_years - metadata.get("yearsOfExperience", 0))
        if exp_gap > 5:
            penalty *= PENALTY_EXP_GAP_LARGE
            penalty_log.append(f"exp_gap {exp_gap:.1f}yr → ×{PENALTY_EXP_GAP_LARGE}")
        elif exp_gap > 3:
            penalty *= PENALTY_EXP_GAP_MEDIUM
            penalty_log.append(f"exp_gap {exp_gap:.1f}yr → ×{PENALTY_EXP_GAP_MEDIUM}")

        seniority_gap = JobMatchingService._seniority_gap(resume, metadata)
        if seniority_gap >= 2:
            penalty *= PENALTY_SENIORITY
            penalty_log.append(f"seniority_gap {seniority_gap} → ×{PENALTY_SENIORITY}")

        final_score = round(min(100.0, max(0.0, base * penalty)), 2)

        resume_skills = {s.get("name", "").lower() for s in resume.get("skills", [])}
        job_skills = {s.lower() for s in metadata.get("skills", [])}
        matched_skills = sorted(resume_skills & job_skills)
        missing_skills = sorted(job_skills - resume_skills)

        strengths, improvements = JobMatchingService._insights(
            resume, metadata, skill_match, experience_fit, missing_required
        )
        career_fit, recommendation_type = JobMatchingService._classify(final_score)

        logger.info(
            f"[JobMatching] job={job_id} "
            f"skill={skill_match:.1f} exp={experience_fit:.1f} "
            f"sem={semantic_sim:.1f} sen={seniority_fit:.1f} "
            f"loc={location_fit:.1f} cert={cert_bonus:.1f} "
            f"base={base:.1f} penalty={penalty:.2f} final={final_score} "
            f"tier={recommendation_type}"
        )

        return {
            "jobId": job_id,
            "finalScore": final_score,
            "components": {
                "skillMatch": skill_match,
                "experienceFit": experience_fit,
                "semanticSim": semantic_sim,
                "seniorityFit": seniority_fit,
                "locationFit": location_fit,
                "certBonus": cert_bonus,
            },
            "penalties": penalty_log,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
            "missingRequiredSkills": missing_required,
            "strengths": strengths,
            "improvements": improvements,
            "careerFit": career_fit,
            "recommendationType": recommendation_type,
            "vectorSimilarity": vector_similarity,
            "metadata": metadata,
        }

    # ── Component scorers ─────────────────────────────────────────────────────

    @staticmethod
    def _build_market_lookup(skill_market_data: list[dict]) -> dict[str, dict]:
        return {
            # Accept both "name" (from buildMatchingPayload) and
            # "skillName" (legacy) so both payload builders work
            (entry.get("name") or entry.get("skillName") or "").lower(): entry
            for entry in skill_market_data
            if entry.get("name") or entry.get("skillName")
        }

    @staticmethod
    def _skill_match(
        resume: dict,
        metadata: dict,
        market_lookup: dict[str, dict] = {},
    ) -> float:
        """
        Market-aware skill overlap score (0–100).

        Weighting hierarchy (same philosophy as ScoringService):
        1. Required skill      → base weight 1.0
        2. × demand multiplier → high demand skills worth more
        3. × growth multiplier → trending skills worth more
        4. × seniority mult    → market relevance for this level
        5. Dying skills        → penalized via low demand/growth

        Non-required skills use base weight 0.5 before market multipliers.
        Falls back to flat weighting if no market data available.
        """
        resume_skills = {s.get("name", "").lower() for s in resume.get("skills", [])}
        all_job_skills = [s.lower() for s in metadata.get("skills", [])]
        required_skills = {s.lower() for s in metadata.get("requiredSkills", [])}

        if not all_job_skills:
            return 0.0

        total_weight = 0.0
        matched_weight = 0.0

        for skill in all_job_skills:
            # Base weight — required skills count double
            base = 1.0 if skill in required_skills else 0.5

            # Market multiplier — boost trending, penalize dying
            market = market_lookup.get(skill)
            if market:
                demand_score = market.get("demandScore", 50) / 100  # 0–1
                growth_rate = market.get("growthRate", 0) / 100  # 0–1, can be negative
                seniority_m = market.get("seniorityMultiplier", 1.0)

                # Same formula as ScoringService.calculate_market_demand_score
                market_value = (
                    (demand_score * 0.6) + (growth_rate * 0.4)
                ) * seniority_m

                # Clamp: dying skills (market_value < 0.3) get penalized
                #        hot skills (market_value > 0.8) get boosted up to ×1.5
                if market_value < 0.3:
                    multiplier = 0.6  # dying skill — reduce its contribution
                elif market_value > 0.8:
                    multiplier = 1.5  # hot skill — boost its contribution
                else:
                    multiplier = 1.0  # neutral

                weight = base * multiplier
            else:
                weight = base  # no market data — fall back to flat weighting

            total_weight += weight
            if skill in resume_skills:
                matched_weight += weight

        return round((matched_weight / total_weight) * 100, 2) if total_weight else 0.0

    @staticmethod
    def _experience_fit(candidate_years: float, metadata: dict) -> float:
        required_years = metadata.get("yearsOfExperience", 0)
        if required_years == 0:
            return 100.0
        gap = abs(candidate_years - required_years)
        if gap == 0:
            return 100.0
        if gap <= 1:
            return 85.0
        if gap <= 2:
            return 70.0
        if gap <= 3:
            return 55.0
        return max(0.0, 55.0 - (gap - 3) * 10)

    @staticmethod
    def _seniority_fit(resume: dict, metadata: dict) -> float:
        gap = JobMatchingService._seniority_gap(resume, metadata)
        if gap == 0:
            return 100.0
        if gap == 1:
            return 70.0
        if gap == 2:
            return 30.0
        return 0.0

    @staticmethod
    def _location_fit(resume: dict, metadata: dict) -> float:
        resume_loc = (resume.get("location", {}).get("name", "") or "").lower().strip()
        job_loc = (metadata.get("location", "") or "").lower().strip()
        if not resume_loc or not job_loc:
            return 50.0
        if resume_loc == job_loc:
            return 100.0
        if resume_loc in job_loc or job_loc in resume_loc:
            return 75.0
        return 30.0

    @staticmethod
    def _cert_bonus(resume: dict, metadata: dict) -> float:
        resume_certs = {
            c.get("name", "").lower() for c in resume.get("certifications", [])
        }
        required_certs = [c.lower() for c in metadata.get("requiredCertifications", [])]
        if not required_certs:
            return 100.0 if resume_certs else 50.0
        matched = sum(1 for c in required_certs if c in resume_certs)
        return round((matched / len(required_certs)) * 100, 2)

    @staticmethod
    def _missing_required_skills(resume: dict, metadata: dict) -> list[str]:
        resume_skills = {s.get("name", "").lower() for s in resume.get("skills", [])}
        required_skills = [s.lower() for s in metadata.get("requiredSkills", [])]
        return [s for s in required_skills if s not in resume_skills]

    @staticmethod
    def _seniority_gap(resume: dict, metadata: dict) -> int:
        resume_level = (resume.get("experienceLevel") or "").strip()
        job_level = (metadata.get("experienceLevel") or "").strip()
        try:
            return abs(
                SENIORITY_LADDER.index(resume_level) - SENIORITY_LADDER.index(job_level)
            )
        except ValueError:
            return 0

    @staticmethod
    def _insights(
        resume: dict,
        metadata: dict,
        skill_match: float,
        experience_fit: float,
        missing_required: list[str],
    ) -> tuple[list[str], list[str]]:
        strengths = []
        improvements = []

        if skill_match >= 80:
            strengths.append("Strong skills alignment with this role")
        elif skill_match >= 60:
            strengths.append("Good skill overlap with key requirements")

        if experience_fit >= 80:
            strengths.append("Experience level closely matches job requirements")
        elif experience_fit >= 60:
            strengths.append("Relevant work experience for this role")

        resume_cert_names = {
            c.get("name", "").lower() for c in resume.get("certifications", [])
        }
        required_certs = metadata.get("requiredCertifications", [])
        if required_certs and any(
            c.lower() in resume_cert_names for c in required_certs
        ):
            strengths.append("Holds certifications relevant to this position")

        if missing_required:
            top = missing_required[:3]
            suffix = " and more" if len(missing_required) > 3 else ""
            improvements.append(f"Missing required skills: {', '.join(top)}{suffix}")

        if experience_fit < 50:
            improvements.append("Experience level may not meet job requirements")

        if required_certs and not any(
            c.lower() in resume_cert_names for c in required_certs
        ):
            improvements.append(f"Consider obtaining: {', '.join(required_certs[:2])}")

        return strengths, improvements

    @staticmethod
    def _classify(score: float) -> tuple[str, str]:
        if score >= 80:
            return ("Strong", "Best Fit")
        if score >= 60:
            return ("Medium", "Good Fit")
        if score >= 40:
            return ("Weak", "Stretch")

        return ("Weak", "Poor Fit")

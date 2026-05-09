"""
Service for analytics and insights generation.

ARCHITECTURE NOTE:
    Pure compute layer — zero DB access.
    Node pre-fetches all data and passes it in.
"""

from typing import List, Dict, NamedTuple, Optional
from collections import Counter
import logging
import numpy as np
from services.scoring_service import ScoringService

logger = logging.getLogger(__name__)


# ── Result types ──────────────────────────────────────────────────────────────

class ResumeInsights(NamedTuple):
    overall_score:            float
    grade:                    str
    strengths:                List[str]
    weaknesses:               List[str]
    improvement_suggestions:  List[str]
    skill_gaps:               List[str]
    overall_message:          str


class MarketInsights(NamedTuple):
    # ── Volume ────────────────────────────────────────────────────────────────
    total_jobs:              int
    top_skills:              List[tuple]          # (skill_name, count)
    top_locations:           List[tuple]          # (location, count)
    experience_levels:       Dict[str, int]       # { level: count }
    trending_roles:          List[str]            # top 5 job titles by frequency

    # ── Demand signals ────────────────────────────────────────────────────────
    skill_demand_rate:       Dict[str, float]     # { skill: jobs_pct_requiring_it }
    saturated_skills:        List[str]            # high frequency, low salary potential
    emerging_skills:         List[str]            # low frequency but fast-growing roles

    # ── Role signals ─────────────────────────────────────────────────────────
    competitive_roles:       List[dict]           # roles with most required skills
    avg_requirements_count:  float
    roles_by_seniority:      Dict[str, List[str]] # { seniority: [role_names] }

    # ── Salary signals ────────────────────────────────────────────────────────
    salary_by_role:          Dict[str, float]     # { role: median_salary }
    highest_paying_roles:    List[tuple]          # (role, median_salary) top 5
    salary_range:            Dict[str, float]     # { min, max, avg }


# ── Constants ─────────────────────────────────────────────────────────────────

_SENIORITY_KEYWORDS = {
    "Senior":    ["senior", "sr.", "lead", "principal", "staff"],
    "Mid-Level": ["mid", "ii", "2", "intermediate"],
    "Junior":    ["junior", "jr.", "entry", "associate", "i", "1"],
    "Intern":    ["intern", "trainee", "apprentice"],
}

_SOFT_SKILLS = {
    "communication", "leadership", "problem solving", "teamwork",
    "critical thinking", "collaboration", "time management", "creativity",
}


# ── Service ───────────────────────────────────────────────────────────────────

class AnalyticsService:
    """Handles analytics and insights generation. Pure compute — no DB access."""

    # ── Resume analysis ───────────────────────────────────────────────────────

    @staticmethod
    def analyze_resume(
        resume: dict,
        total_experience_years: float,
        scoring_payload: dict,
        market_skill_names: List[str],
    ) -> Optional[ResumeInsights]:
        """
        Generate comprehensive insights for a resume.

        All data is pre-fetched by Node and passed in. No DB access here.

        Args:
            resume:                Full resume dict.
            total_experience_years: Pre-calculated from work experience dates.
            scoring_payload:       ScoringPayload dict built by Node:
                                   { resumeSkills, currentTitle, higherPayingTitles,
                                     skillMarketData }
            market_skill_names:    Top in-demand skill names from the Skill collection,
                                   used for gap analysis. Node fetches these.

        Returns:
            ResumeInsights or None on error.
        """
        try:
            resume_score = ScoringService.calculate_resume_score(
                resume=resume,
                total_experience_years=total_experience_years,
                scoring_payload=scoring_payload,
            )

            strengths   = []
            weaknesses  = []
            suggestions = []

            # Completeness
            if resume_score.completeness_score >= 90:
                strengths.append("Comprehensive resume with all sections filled")
            elif resume_score.completeness_score < 70:
                weaknesses.append("Missing important resume sections")
                suggestions.append("Complete all resume sections for better visibility")

            # Experience
            if resume_score.experience_score >= 80:
                strengths.append(f"Strong work experience ({total_experience_years:.1f} years)")
            elif resume_score.experience_score < 50:
                weaknesses.append("Limited work experience")
                suggestions.append("Highlight internships, projects, or volunteer work")

            # Skills
            num_skills = len(resume.get("skills", []))
            if resume_score.skills_score >= 80:
                strengths.append(f"Diverse skill set ({num_skills} skills listed)")
            elif resume_score.skills_score < 60:
                weaknesses.append("Limited skills listed")
                suggestions.append("Add more relevant technical and soft skills")

            # Career progression bonus
            if resume_score.career_progression_score > 5.0:
                strengths.append("Strong cross-domain skills that unlock higher-paying roles")
            elif resume_score.career_progression_score > 0:
                strengths.append("Has some skills valued in higher-paying adjacent roles")

            # Certifications
            num_certs = len(resume.get("certifications", []))
            if num_certs >= 3:
                strengths.append(f"Strong certifications ({num_certs} listed)")
            elif num_certs == 0:
                suggestions.append("Consider adding relevant certifications to strengthen your profile")

            skill_gaps      = AnalyticsService._identify_skill_gaps(resume, market_skill_names)
            overall_message = AnalyticsService._get_overall_message(resume_score.overall_score)

            return ResumeInsights(
                overall_score=           resume_score.overall_score,
                grade=                   resume_score.grade,
                strengths=               strengths,
                weaknesses=              weaknesses,
                improvement_suggestions= suggestions,
                skill_gaps=              skill_gaps[:5],
                overall_message=         overall_message,
            )

        except Exception as e:
            logger.error(f"Error analyzing resume: {e}", exc_info=True)
            return None

    # ── Skill gap analysis ────────────────────────────────────────────────────

    @staticmethod
    def _identify_skill_gaps(
        resume: dict,
        market_skill_names: List[str],
    ) -> List[str]:
        """
        Identify in-demand skills missing from the resume.

        Args:
            resume:             Resume dict with 'skills' list.
            market_skill_names: Top skill names from the market, pre-fetched by Node.
                                Ordered by demand (highest first).

        Returns:
            List of missing in-demand skill names (title-cased).
        """
        user_skills = {
            s["name"].lower()
            for s in resume.get("skills", [])
            if s.get("name")
        }
        return [
            skill_name.title()
            for skill_name in market_skill_names
            if skill_name.lower() not in user_skills
        ]

    # ── Market insights ───────────────────────────────────────────────────────

    @staticmethod
    def get_market_insights(jobs: List[dict]) -> Optional[MarketInsights]:
        """
        Generate structured market signals from a pre-fetched list of active
        job postings. Pure compute — no DB access.

        Signals derived:
          - Skill demand rate: % of jobs requiring each skill (not just raw count)
          - Saturated skills:  appear in >60% of jobs — oversupplied, lower leverage
          - Emerging skills:   appear in <20% of jobs but in high-salary roles (>$150k)
          - Salary by role:    median salary per job title
          - Highest paying:    top 5 roles by median salary
          - Roles by seniority: titles bucketed by seniority keyword
          - Competitive roles: roles with the most Required skills

        Args:
            jobs: List of active job posting dicts. Each should have:
                  title, skills, location, experienceLevel, requirements,
                  salaryRange (optional: { min, max }).

        Returns:
            MarketInsights or None if the job list is empty.
        """
        if not jobs:
            logger.warning("[get_market_insights] No jobs provided")
            return None

        try:
            total = len(jobs)

            all_skill_names:     List[str]       = []
            all_locations:       List[str]       = []
            experience_levels:   List[str]       = []
            requirements_counts: List[int]       = []
            job_titles:          List[str]       = []
            skill_job_presence:  Dict[str, int]  = {}
            salary_by_role:      Dict[str, list] = {}
            role_required_count: Dict[str, int]  = {}
            skill_salary_map:    Dict[str, list] = {}
            roles_by_seniority:  Dict[str, list] = {k: [] for k in _SENIORITY_KEYWORDS}

            for job in jobs:
                title    = job.get("title", "")
                skills   = job.get("skills", [])
                location = job.get("location")
                level    = job.get("experienceLevel")
                reqs     = job.get("requirements", [])
                salary   = _extract_median_salary(job)

                # Titles
                if title:
                    job_titles.append(title)

                    if salary:
                        salary_by_role.setdefault(title, []).append(salary)

                    required_count = sum(
                        1 for s in skills
                        if isinstance(s, dict) and s.get("importance") == "Required"
                    )
                    role_required_count[title] = (
                        role_required_count.get(title, 0) + required_count
                    )

                    title_lower = title.lower()
                    for seniority, keywords in _SENIORITY_KEYWORDS.items():
                        if any(kw in title_lower for kw in keywords):
                            if title not in roles_by_seniority[seniority]:
                                roles_by_seniority[seniority].append(title)
                            break

                # Skills
                seen_in_job: set = set()
                for s in skills:
                    name = s.get("name", "").strip() if isinstance(s, dict) else ""
                    if not name or name.lower() in _SOFT_SKILLS:
                        continue

                    all_skill_names.append(name)

                    if name not in seen_in_job:
                        skill_job_presence[name] = skill_job_presence.get(name, 0) + 1
                        seen_in_job.add(name)

                    if salary:
                        skill_salary_map.setdefault(name, []).append(salary)

                # Location
                if location:
                    loc = location.get("name") if isinstance(location, dict) else str(location)
                    if loc:
                        all_locations.append(loc)

                if level:
                    experience_levels.append(level)

                requirements_counts.append(len(reqs))

            # Skill demand rate
            skill_demand_rate = {
                skill: round((count / total) * 100, 1)
                for skill, count in skill_job_presence.items()
            }

            # Saturated: appear in >60% of jobs
            saturated_skills = sorted(
                [s for s, rate in skill_demand_rate.items() if rate >= 60],
                key=lambda s: skill_demand_rate[s],
                reverse=True,
            )

            # Emerging: appear in <20% of jobs, avg salary > $150k
            emerging_skills = sorted(
                [
                    s for s, rate in skill_demand_rate.items()
                    if rate < 20
                    and skill_salary_map.get(s)
                    and (sum(skill_salary_map[s]) / len(skill_salary_map[s])) > 150_000
                ],
                key=lambda s: sum(skill_salary_map[s]) / len(skill_salary_map[s]),
                reverse=True,
            )

            # Salary by role
            salary_by_role_median = {
                role: round(float(np.median(salaries)), 0)
                for role, salaries in salary_by_role.items()
                if salaries
            }

            highest_paying = sorted(
                salary_by_role_median.items(),
                key=lambda x: x[1],
                reverse=True,
            )[:5]

            all_salaries = [s for salaries in salary_by_role.values() for s in salaries]
            salary_range = {
                "min": round(float(np.min(all_salaries)),  0) if all_salaries else 0.0,
                "max": round(float(np.max(all_salaries)),  0) if all_salaries else 0.0,
                "avg": round(float(np.mean(all_salaries)), 0) if all_salaries else 0.0,
            }

            # Competitive roles
            competitive_roles = sorted(
                [
                    {"role": role, "required_skills": count}
                    for role, count in role_required_count.items()
                ],
                key=lambda x: x["required_skills"],
                reverse=True,
            )[:5]

            return MarketInsights(
                total_jobs=             total,
                top_skills=             Counter(all_skill_names).most_common(10),
                top_locations=          Counter(all_locations).most_common(10),
                experience_levels=      dict(Counter(experience_levels)),
                trending_roles=         [t for t, _ in Counter(job_titles).most_common(5)],
                skill_demand_rate=      skill_demand_rate,
                saturated_skills=       saturated_skills[:10],
                emerging_skills=        emerging_skills[:10],
                competitive_roles=      competitive_roles,
                avg_requirements_count= round(float(np.mean(requirements_counts)), 2) if requirements_counts else 0.0,
                roles_by_seniority=     {k: v for k, v in roles_by_seniority.items() if v},
                salary_by_role=         salary_by_role_median,
                highest_paying_roles=   highest_paying,
                salary_range=           salary_range,
            )

        except Exception as e:
            logger.error(f"[get_market_insights] Error: {e}", exc_info=True)
            return None

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _get_overall_message(score: float) -> str:
        if score >= 95:
            return "Nearly flawless resume that clearly communicates strong qualifications and is highly competitive in the job market."
        elif score >= 90:
            return "Excellent resume with strong structure and content, needing only minor refinements to reach top-tier quality."
        elif score >= 85:
            return "Very strong resume with clear strengths, but a few targeted improvements could increase its impact."
        elif score >= 80:
            return "Good resume with a solid foundation, though some sections would benefit from more detail and clarity."
        elif score >= 75:
            return "Above-average resume that is well organized but lacks depth in key areas."
        elif score >= 65:
            return "Average resume that meets basic expectations but does not yet stand out to recruiters."
        elif score >= 50:
            return "Below-average resume that needs clearer experience, stronger skills presentation, and better completeness."
        else:
            return "Resume requires significant improvement and is missing critical information needed for effective evaluation."


# ── Module-level helpers ──────────────────────────────────────────────────────

def _extract_median_salary(job: dict) -> Optional[float]:
    """
    Extract a single salary figure from a job's salaryRange.
    Returns midpoint if both min and max exist, otherwise whichever is present.
    """
    salary = job.get("salaryRange") or job.get("salary") or {}
    if not isinstance(salary, dict):
        return None
    lo = salary.get("min")
    hi = salary.get("max")
    if lo and hi:
        return (lo + hi) / 2
    return float(lo or hi or 0) or None
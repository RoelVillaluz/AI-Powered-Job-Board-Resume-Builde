"""
Tests for ScoringService.calculate_resume_score (full integration).
Run with: pytest tests/scoring/test_resume_score.py -v -s --log-cli-level=INFO
"""

import logging

from services.scoring_service import ScoringService
from conftest import log_assert, log_compare, log_header, log_score

logger = logging.getLogger(__name__)


class TestResumeScore:
    """End-to-end: all components combined into a single overall score."""

    def test_full_resume_scores_above_70(self, resume_full, scoring_payload_full_stack):
        log_header("Integration — full resume overall score")
        score = ScoringService.calculate_resume_score(
            resume_full, 4.6, scoring_payload_full_stack
        )
        logger.info("  Score breakdown:")
        log_score("  completeness  (weight 20%)", score.completeness_score, "100.00")
        log_score(
            "  experience    (weight 20%)",
            score.experience_score,
            "~92.00  (4.6 / 5.0 yrs)",
        )
        log_score(
            "  skills        (weight 35%)",
            score.skills_score,
            "~56.04  (vs Full Stack topSkills)",
        )
        log_score("  market demand (weight 15%)", score.certification_score, "")
        log_score(
            "  certifications(weight 10%)",
            score.certification_score,
            "~40.00  (2 certs / 5)",
        )
        log_score(
            "  career prog   (bonus +10)", score.career_progression_score, "> 0.00"
        )
        logger.info(
            f"  {'·'} {'overall score':<38} {score.overall_score:>6.2f}  (expected: ≥ 70.00)"
        )
        log_assert(
            "grade", f"{score.grade}  (A+=95 A=90 B+=85 B=80 C+=75 C=65 D=50 F=0)"
        )
        assert score.overall_score >= 70.0

    def test_progression_skills_lift_overall_score(
        self, resume_full, scoring_payload_full_stack, skill_market_data
    ):
        log_header("Integration — career progression bonus lifts overall")
        logger.info("  Removing AWS + PyTorch should reduce the overall score.")
        resume_no_prog = {
            **resume_full,
            "skills": [
                s for s in resume_full["skills"] if s["name"] not in ("AWS", "PyTorch")
            ],
        }
        payload_no_prog = {
            **scoring_payload_full_stack,
            "skillMarketData": [
                s for s in skill_market_data if s["name"] not in ("AWS", "PyTorch")
            ],
        }
        with_prog = ScoringService.calculate_resume_score(
            resume_full, 4.6, scoring_payload_full_stack
        )
        without_prog = ScoringService.calculate_resume_score(
            resume_no_prog, 4.6, payload_no_prog
        )
        log_compare(
            "with AWS + PyTorch    ",
            with_prog.overall_score,
            "without AWS + PyTorch",
            without_prog.overall_score,
        )
        assert with_prog.overall_score > without_prog.overall_score

    def test_overall_never_exceeds_100(self, resume_full, scoring_payload_full_stack):
        log_header("Integration — overall score ceiling (20 yrs experience)")
        score = ScoringService.calculate_resume_score(
            resume_full, 20.0, scoring_payload_full_stack
        )
        log_score("overall score", score.overall_score, "≤ 100.00  (ceiling enforced)")
        assert score.overall_score <= 100.0

    def test_grade_is_valid(self, resume_full, scoring_payload_full_stack):
        log_header("Integration — grade is a valid letter grade")
        valid_grades = ("A+", "A", "B+", "B", "C+", "C", "D", "F")
        score = ScoringService.calculate_resume_score(
            resume_full, 4.6, scoring_payload_full_stack
        )
        log_assert("grade returned", score.grade)
        log_assert("valid grades  ", "  ".join(valid_grades))
        assert score.grade in valid_grades

    def test_excellent_resume_scores_a_plus(
        self,
        full_stack_title,
        ml_engineer_title,
        cloud_engineer_title,
        skill_market_data,
    ):
        log_header("Integration — excellent resume scores A+  (≥ 95)")
        logger.info("  Profile: 10 yrs exp, all Required + Preferred skills covered,")
        logger.info("  5 certs, strong progression skills across ML + Cloud titles.")

        resume = {
            "firstName": "Alex",
            "lastName": "Chen",
            "email": "alex@example.com",
            "phone": "+1-555-0200",
            "summary": "Senior full stack engineer with 10 years building distributed systems.",
            "jobTitle": {"name": "Full Stack Engineer"},
            "location": {"name": "San Francisco, CA"},
            "skills": [
                # All Required full stack skills
                {"name": "JavaScript"},
                {"name": "React"},
                {"name": "Node.js"},
                {"name": "REST API"},
                {"name": "SQL"},
                {"name": "HTML"},
                {"name": "CSS"},
                # All Preferred full stack skills
                {"name": "TypeScript"},
                {"name": "PostgreSQL"},
                {"name": "Docker"},
                # Progression skills — ML Engineer (+$50k delta)
                {"name": "Python"},
                {"name": "PyTorch"},
                {"name": "Machine Learning"},
                # Progression skills — Cloud Engineer (+$20k delta)
                {"name": "AWS"},
                {"name": "CI/CD"},
            ],
            "workExperience": [
                {
                    "jobTitle": "Senior Full Stack Engineer",
                    "company": "BigTech Inc",
                    "startDate": "2019-01-01",
                    "endDate": "2024-01-01",
                    "responsibilities": [
                        "Led platform architecture",
                        "Managed 8 engineers",
                    ],
                },
                {
                    "jobTitle": "Full Stack Engineer",
                    "company": "ScaleUp Co",
                    "startDate": "2014-06-01",
                    "endDate": "2019-01-01",
                    "responsibilities": [
                        "Built core API layer",
                        "Owned React frontend",
                    ],
                },
            ],
            "education": [{"degree": "Bachelor", "field": "Computer Science"}],
            "certifications": [
                {"name": "AWS Solutions Architect"},
                {"name": "Docker Certified Associate"},
                {"name": "Google Cloud Professional"},
                {"name": "Kubernetes Administrator"},
                {"name": "MongoDB Developer"},
            ],
        }

        payload = {
            "resumeSkills": [s["name"] for s in resume["skills"]],
            "currentTitle": {
                "title": full_stack_title["title"],
                "medianSalary": full_stack_title["salaryData"]["medianSalary"],
                "seniorityLevel": full_stack_title["seniorityLevel"],
                "topSkills": full_stack_title["topSkills"],
            },
            "higherPayingTitles": [
                {
                    "title": ml_engineer_title["title"],
                    "medianSalary": ml_engineer_title["salaryData"]["medianSalary"],
                    "topSkills": ml_engineer_title["topSkills"],
                },
                {
                    "title": cloud_engineer_title["title"],
                    "medianSalary": cloud_engineer_title["salaryData"]["medianSalary"],
                    "topSkills": cloud_engineer_title["topSkills"],
                },
            ],
            "skillMarketData": skill_market_data,
        }

        score = ScoringService.calculate_resume_score(
            resume=resume,
            total_experience_years=10.0,
            scoring_payload=payload,
        )

        logger.info("  Score breakdown:")
        log_score(
            "  completeness  (weight 20%)",
            score.completeness_score,
            "100.00  (8/8 sections)",
        )
        log_score(
            "  experience    (weight 20%)",
            score.experience_score,
            "100.00  (10 yrs → capped)",
        )
        log_score(
            "  skills        (weight 35%)",
            score.skills_score,
            "100.00  (all Required + Preferred)",
        )
        log_score(
            "  certifications(weight 10%)",
            score.certification_score,
            "100.00  (5 certs → capped)",
        )
        log_score(
            "  career prog   (bonus +10)",
            score.career_progression_score,
            "> 0.00  (ML + Cloud skills)",
        )
        logger.info(
            f"  {'·'} {'overall score':<38} {score.overall_score:>6.2f}  (expected: ≥ 95.00)"
        )
        log_assert("grade", f"{score.grade}  (expected: A+)")

        assert score.overall_score >= 95.0
        assert score.grade == "A+"

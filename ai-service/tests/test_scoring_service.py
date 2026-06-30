"""
Tests for ScoringService — minimal, readable, logged.
Run with: pytest tests/test_scoring_service.py -v -s --log-cli-level=INFO
"""

import logging
import pytest
from services.scoring_service import ScoringService, _CAREER_PROGRESSION_MAX_BONUS

logger = logging.getLogger(__name__)


# ── Log helpers ───────────────────────────────────────────────────────────────


def log_header(title: str) -> None:
    bar = "─" * 52
    logger.info(f"\n  ┌{bar}┐")
    logger.info(f"  │  {title:<50}│")
    logger.info(f"  └{bar}┘")


def log_score(label: str, score: float, expected: str = "") -> None:
    note = f"  (expected: {expected})" if expected else ""
    logger.info(f"  {'·'} {label:<38} {score:>6.2f}{note}")


def log_compare(label_a: str, score_a: float, label_b: str, score_b: float) -> None:
    winner = "✓ correct" if score_a > score_b else "✗ wrong order"
    logger.info(f"  {'·'} {label_a:<28} {score_a:>6.2f}")
    logger.info(f"  {'·'} {label_b:<28} {score_b:>6.2f}  ← {winner}")


def log_assert(label: str, value) -> None:
    logger.info(f"  {'·'} {label:<38} {value}")


# ── Completeness ──────────────────────────────────────────────────────────────


class TestCompleteness:
    """Score how many of the 8 resume sections are filled (0–100)."""

    def test_full_resume_is_100(self, resume_full):
        log_header("Completeness — all 8 sections filled")
        score = ScoringService.calculate_completeness_score(resume_full)
        log_score("sections filled", score, "100.00  (8/8)")
        assert score == 100.0

    def test_sparse_resume_is_50(self, resume_sparse):
        log_header("Completeness — 4 of 8 sections filled")
        # resume_sparse has: firstName+lastName, email, skills, workExperience
        # missing: phone, summary, education, certifications → 4/8 = 50
        score = ScoringService.calculate_completeness_score(resume_sparse)
        log_score("sections filled", score, "50.00  (4/8)")
        assert score == 50.0

    def test_empty_resume_is_0(self):
        log_header("Completeness — empty dict (edge case)")
        score = ScoringService.calculate_completeness_score({})
        log_score("sections filled", score, "0.00  (0/8)")
        assert score == 0.0


# ── Experience ────────────────────────────────────────────────────────────────


class TestExperience:
    """Linear scale from 0 to target_years (default 5), capped at 100."""

    @pytest.mark.parametrize(
        "years,expected",
        [
            (0.0, 0.0),
            (2.5, 50.0),
            (5.0, 100.0),
            (9.0, 100.0),
        ],
    )
    def test_experience_score(self, years, expected):
        note_map = {
            0.0: "0.00   (0 yrs → no experience)",
            2.5: "50.00  (2.5 / 5.0 yrs → halfway)",
            5.0: "100.00  (5.0 yrs → hits target)",
            9.0: "100.00  (9.0 yrs → above target, capped)",
        }
        log_header(f"Experience — {years} yrs")
        score = ScoringService.calculate_experience_score(years)
        log_score("experience score", score, note_map[years])
        assert score == expected


# ── Skills ────────────────────────────────────────────────────────────────────


class TestSkills:
    """Score resume skills against currentTitle.topSkills only — not the whole industry."""

    def test_full_stack_resume_vs_full_stack_title(
        self, resume_full, scoring_payload_full_stack
    ):
        log_header("Skills — full stack resume vs full stack title")
        score = ScoringService.calculate_skills_score(
            resume_full, scoring_payload_full_stack
        )
        logger.info(
            "  Resume skills:  JS, TS, React, Node, PostgreSQL, Docker, AWS, PyTorch"
        )
        logger.info(
            "  Title requires: JS, React, Node, REST API, SQL, HTML, CSS  (Required ×1.0)"
        )
        logger.info(
            "  Title prefers:  TS, PostgreSQL, Docker                     (Preferred ×0.7)"
        )
        logger.info("  Matched Required: JS, React, Node  →  3 × 1.0 = 3.0")
        logger.info("  Matched Preferred: TS, PostgreSQL, Docker  →  3 × 0.7 = 2.1")
        logger.info("  Total weight: 7×1.0 + 3×0.7 = 9.1  |  Matched: 5.1")
        log_score("weighted match score", score, "~56.04  (5.1 / 9.1 × 100)")
        assert 50.0 <= score <= 65.0

    def test_devops_skills_score_lower_against_full_stack_title(
        self, resume_full, scoring_payload_full_stack, skill_market_data
    ):
        log_header("Skills — role specificity check (core regression)")
        logger.info(
            "  Confirms CI/CD + GitHub Actions don't inflate a Full Stack score."
        )
        devops_resume = {
            **resume_full,
            "skills": [
                {"name": "AWS"},
                {"name": "Docker"},
                {"name": "CI/CD"},
                {"name": "GitHub Actions"},
                {"name": "Python"},
            ],
        }
        frontend_score = ScoringService.calculate_skills_score(
            resume_full, scoring_payload_full_stack
        )
        devops_score = ScoringService.calculate_skills_score(
            devops_resume, scoring_payload_full_stack
        )
        log_compare(
            "frontend resume (JS/React/Node...)",
            frontend_score,
            "devops resume   (AWS/CI-CD/GHA...)",
            devops_score,
        )
        assert devops_score < frontend_score

    def test_no_skills_is_0(self, resume_no_skills, scoring_payload_full_stack):
        log_header("Skills — empty skills list (edge case)")
        score = ScoringService.calculate_skills_score(
            resume_no_skills, scoring_payload_full_stack
        )
        log_score("weighted match score", score, "0.00  (no skills to match)")
        assert score == 0.0


# ── Career progression ────────────────────────────────────────────────────────


class TestCareerProgression:
    """
    Bonus (0–+10) for resume skills that appear in higher-paying titles
    but NOT in the current title's baseline. Weighted by salary delta.
    """

    def test_ml_and_cloud_skills_give_bonus(
        self, resume_full, scoring_payload_full_stack
    ):
        log_header("Career progression — niche skills detected")
        logger.info(
            "  AWS   → in Cloud Engineer topSkills  (not in Full Stack baseline)"
        )
        logger.info(
            "  PyTorch → in ML Engineer topSkills   (not in Full Stack baseline)"
        )
        score = ScoringService.calculate_career_progression_score(
            resume_full, scoring_payload_full_stack
        )
        log_score("progression bonus", score, "> 0.00  (bonus triggered)")
        assert score > 0.0

    def test_baseline_only_skills_give_no_bonus(self, scoring_payload_full_stack):
        log_header("Career progression — baseline skills give no bonus")
        logger.info("  JS, React, Node.js are already in Full Stack topSkills.")
        logger.info(
            "  Having expected skills should not count as a progression signal."
        )
        baseline_resume = {
            "skills": [
                {"name": "JavaScript"},
                {"name": "React"},
                {"name": "Node.js"},
            ]
        }
        score = ScoringService.calculate_career_progression_score(
            baseline_resume, scoring_payload_full_stack
        )
        log_score("progression bonus", score, "0.00  (no niche skills)")
        assert score == 0.0

    def test_higher_salary_delta_produces_larger_bonus(
        self, full_stack_title, skill_market_data
    ):
        log_header("Career progression — salary delta weighting")
        logger.info("  ML Engineer: $182k  (+$50k above Full Stack $132k)")
        logger.info("  Cloud Engineer: $152k  (+$20k above Full Stack $132k)")
        logger.info("  Same skill count — ML bonus must be larger due to higher delta.")
        payload = {
            "currentTitle": {
                "medianSalary": full_stack_title["salaryData"]["medianSalary"],
                "topSkills": full_stack_title["topSkills"],
            },
            "higherPayingTitles": [
                {
                    "title": "Machine Learning Engineer",
                    "medianSalary": 182000,
                    "topSkills": [{"skillName": "PyTorch", "importance": "Required"}],
                },
                {
                    "title": "Cloud Engineer",
                    "medianSalary": 152000,
                    "topSkills": [{"skillName": "CI/CD", "importance": "Required"}],
                },
            ],
        }
        ml_score = ScoringService.calculate_career_progression_score(
            {"skills": [{"name": "PyTorch"}]}, payload
        )
        cloud_score = ScoringService.calculate_career_progression_score(
            {"skills": [{"name": "CI/CD"}]}, payload
        )
        log_compare(
            "PyTorch → ML Engineer (+$50k)",
            ml_score,
            "CI/CD → Cloud Engineer (+$20k)",
            cloud_score,
        )
        assert ml_score > cloud_score

    def test_bonus_never_exceeds_cap(self, scoring_payload_full_stack):
        log_header("Career progression — bonus cap enforced")
        all_skills = {
            "skills": [
                {"name": s["skillName"]}
                for t in scoring_payload_full_stack["higherPayingTitles"]
                for s in t["topSkills"]
            ]
        }
        score = ScoringService.calculate_career_progression_score(
            all_skills, scoring_payload_full_stack
        )
        log_score(
            "progression bonus", score, f"≤ {_CAREER_PROGRESSION_MAX_BONUS:.2f}  (cap)"
        )
        log_assert("cap value", f"{_CAREER_PROGRESSION_MAX_BONUS}")
        assert score <= _CAREER_PROGRESSION_MAX_BONUS


# ── Full integration ──────────────────────────────────────────────────────────


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


class TestIndustryCoherence:
    """Extreme adversarial tests for completely unrelated industries."""

    def test_completely_unrelated_industry_and_title(self, scoring_payload_full_stack):
        """
        Scenario:
        - Job Title: Machine Learning Engineer (Software/AI domain)
        - Resume: Beauty/Cosmetology domain (completely unrelated)
        """

        log_header("Industry Coherence — COMPLETELY UNRELATED DOMAINS")

        resume = {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@example.com",
            "skills": [
                {"name": "Hair Styling"},
                {"name": "Makeup Artistry"},
                {"name": "Nail Care"},
                {"name": "Salon Management"},
            ],
            "workExperience": [
                {
                    "jobTitle": "Senior Stylist",
                    "company": "Beauty Studio",
                    "startDate": "2020-01-01",
                    "endDate": "2025-01-01",
                    "responsibilities": ["Client styling", "Salon operations"],
                }
            ],
            "education": [],
            "certifications": [],
        }

        payload = {
            **scoring_payload_full_stack,
            "currentTitle": {
                "title": "Machine Learning Engineer",
                "medianSalary": 180000,
                "topSkills": [
                    {"skillName": "Python", "importance": "Required"},
                    {"skillName": "PyTorch", "importance": "Required"},
                    {"skillName": "Machine Learning", "importance": "Required"},
                    {"skillName": "SQL", "importance": "Preferred"},
                ],
            },
            "higherPayingTitles": [],
            "skillMarketData": [],
        }

        score = ScoringService.calculate_resume_score(
            resume=resume,
            total_experience_years=5.0,
            scoring_payload=payload,
        )

        logger.info("  Expected behavior:")
        logger.info("  - Skills score → 0 or near 0")
        logger.info("  - Career progression → 0")
        logger.info("  - Market relevance → very low")
        logger.info("  - Overall → heavily penalized")

        log_score("completeness", score.completeness_score)
        log_score("experience", score.experience_score)
        log_score("skills", score.skills_score)
        log_score("market demand", score.certification_score)
        log_score("career progression", score.career_progression_score)
        log_score("overall score", score.overall_score)

        log_assert("grade", score.grade)

        # ── HARD ASSERTIONS ─────────────────────────────────────────────

        assert score.skills_score < 10, (
            "Skills should be nearly zero for unrelated domain"
        )
        assert score.career_progression_score == 0, (
            "No progression possible across industries"
        )
        assert score.overall_score < 40, "Completely unrelated resume should score low"

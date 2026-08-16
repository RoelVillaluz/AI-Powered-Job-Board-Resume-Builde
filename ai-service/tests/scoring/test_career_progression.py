"""
Tests for ScoringService.calculate_career_progression_score.
Run with: pytest tests/scoring/test_career_progression.py -v -s --log-cli-level=INFO
"""

import logging

from services.scoring_service import ScoringService, _CAREER_PROGRESSION_MAX_BONUS
from conftest import log_assert, log_compare, log_header, log_score

logger = logging.getLogger(__name__)


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

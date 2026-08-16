"""
Tests for ScoringService.calculate_skills_score.
Run with: pytest tests/scoring/test_skills.py -v -s --log-cli-level=INFO
"""

import logging

from services.scoring_service import ScoringService
from conftest import log_compare, log_header, log_score

logger = logging.getLogger(__name__)


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

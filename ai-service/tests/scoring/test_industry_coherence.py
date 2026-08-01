"""
Tests for ScoringService — extreme adversarial unrelated-industry scoring.
Run with: pytest tests/scoring/test_industry_coherence.py -v -s --log-cli-level=INFO
"""

import logging

from services.scoring_service import ScoringService
from conftest import log_assert, log_header, log_score

logger = logging.getLogger(__name__)


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

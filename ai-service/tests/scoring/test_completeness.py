"""
Tests for ScoringService.calculate_completeness_score.
Run with: pytest tests/scoring/test_completeness.py -v -s --log-cli-level=INFO
"""

from services.scoring_service import ScoringService
from conftest import log_header, log_score


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

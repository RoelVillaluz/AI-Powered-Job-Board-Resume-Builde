"""
Tests for ScoringService.calculate_experience_score.
Run with: pytest tests/scoring/test_experience.py -v -s --log-cli-level=INFO
"""

import pytest
from services.scoring_service import ScoringService
from conftest import log_header, log_score


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

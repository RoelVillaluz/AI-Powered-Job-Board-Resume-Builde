"""
Test 4: No Output Validation in Gemini RAG Pipeline

Demonstrates that the generate_match_insight handler has NO schema or
structure validation on the LLM's response.  Whatever the model returns
is passed through to the caller, even if it is:
  - Empty string
  - Raw JSON (instead of prose)
  - Gibberish / off-topic text
  - A single word

What a fixed pipeline should do:
  - Validate the response has the expected structural markers:
    a score "X/100", a verdict/fit mention, a gap, and a next step.
  - Return a structured error or fallback text if validation fails,
    rather than propagating malformed/untrustworthy output.

Current behaviour (vulnerable): zero output validation.
  → Empty string → persists empty string.
  → JSON blob → persists JSON blob.
  → Gibberish → persists gibberish.

Test logic:
  1. Mock generate to return various malformed outputs.
  2. Call generate_match_insight for each case.
  3. Assert the handler returns an error or the output passes schema check.
  4. Because there is no output validation, all malformed responses pass
     through unchecked → assertions FAIL.
"""

import logging
import pytest
from unittest.mock import patch

from tests.gemini.conftest import (
    log_assert,
    log_header,
    response_is_properly_structured,
)

logger = logging.getLogger(__name__)

import handlers.match_insight_handler as mih_module


@pytest.fixture
def resume():
    return {
        "skills": [{"name": "Python"}],
        "experienceLevel": "junior",
    }


@pytest.fixture
def matches():
    return [
        {
            "metadata": {
                "title": "Junior Developer",
                "location": "Remote",
                "salaryMin": 60000,
                "salaryMax": 90000,
                "salaryCurrency": "USD",
                "salaryFrequency": "yearly",
            },
            "finalScore": 65.0,
            "recommendationType": "stretch",
            "matchedSkills": ["Python"],
            "missingSkills": ["Django"],
            "strengths": ["Python basics"],
            "improvements": ["Learn Django"],
        }
    ]


MALFORMED_CASES = [
    pytest.param(
        "",
        id="empty_string",
    ),
    pytest.param(
        '{"score": 65, "verdict": "stretch", "advice": "keep learning"}',
        id="raw_json_instead_of_prose",
    ),
    pytest.param(
        "Sorry, I cannot answer that question.",
        id="refusal_response",
    ),
    pytest.param(
        "Python",
        id="single_word",
    ),
    pytest.param(
        "a" * 5000,
        id="excessively_long_gibberish",
    ),
]


@pytest.fixture
def backend_expected_shape():
    """The shape that matchInsightRegistry.buildPayload expects."""
    return {
        "jobId": "job-99",
        "explanation": "",
    }


class TestOutputValidation:
    @pytest.mark.parametrize("malformed_response", MALFORMED_CASES)
    def test_malformed_response_not_validated(
        self, resume, matches, malformed_response
    ):
        """
        FAILS for every case because: the handler does not validate the
        model's output before returning it.  Empty strings, raw JSON,
        refusals, single words, and gibberish all pass through unchecked.

        Expected (with fix): handler returns {"error": ...} for each.
        Current (vulnerable): handler returns {"answer": malformed, "jobId": ...}.
        """
        with patch("handlers.match_insight_handler.generate") as mock_gen:
            mock_gen.return_value = malformed_response

            log_header(
                f"Gemini — malformed output rejected: {malformed_response[:50]!r}…"
            )

            result = mih_module.generate_match_insight(resume, matches, "job-99")

            prompt, gen_kwargs = mock_gen.call_args
            logger.info(f"  → prompt excerpt: {prompt[0][:110]!r}…")
            logger.info(
                "  → system_instruction (last call): "
                f"{gen_kwargs.get('system_instruction', '')[:70]!r}…"
            )
            logger.info(
                "  → mock returned: "
                f"{mock_gen.return_value[:60]!r}… "
                f"(type={type(malformed_response).__name__})"
            )

            answer = result.get("answer", "")
            structured = response_is_properly_structured(answer)
            logger.info(
                "  → structural check: "
                f"response_is_properly_structured={structured} "
                f"{'✓' if structured else '✗'}"
            )
            log_assert("handler result keys", sorted(result.keys()))

            # If output validation existed, it would catch the malformation
            # and either return an error or a fallback answer.
            try:
                assert structured, (
                    "OUTPUT VALIDATION GAP CONFIRMED: "
                    f"Malformed response ({type(malformed_response).__name__}: "
                    f"{malformed_response[:80]!r}...) was returned verbatim. "
                    "Expected schema validation to reject it, but it passed "
                    "through unchecked."
                )
            except AssertionError:
                raise

    def test_empty_answer_persisted_through_backend_pipeline(self, resume, matches):
        """
        FAILS because: even the backend's buildPayload has no validation
        on the 'answer' field — an empty string is mapped to 'explanation'
        and persisted as-is.

        This simulates what the backend's matchInsightRegistry does:
          buildPayload: (aiResult) => ({
              jobId:       aiResult.jobId ?? "",
              explanation: aiResult.answer ?? "",
          })
        """
        log_header("Gemini — empty answer persisted through backend pipeline")
        with patch("handlers.match_insight_handler.generate") as mock_gen:
            mock_gen.return_value = ""

            result = mih_module.generate_match_insight(resume, matches, "job-99")

            prompt, gen_kwargs = mock_gen.call_args
            logger.info(f"  → prompt excerpt: {prompt[0][:110]!r}…")
            logger.info(
                "  → system_instruction (last call): "
                f"{gen_kwargs.get('system_instruction', '')[:70]!r}…"
            )
            logger.info(f"  → mock returned: {mock_gen.return_value[:60]!r}…")

            # Simulate backend buildPayload step
            explanation = result.get("answer", "")
            logger.info(f"  → explanation length: {len(explanation)}")

            try:
                assert len(explanation) > 50, (
                    "OUTPUT VALIDATION GAP CONFIRMED: "
                    f"Empty answer (len={len(explanation)}) was accepted "
                    "by the handler and would be persisted as-is by "
                    "matchInsightRegistry.buildPayload.  Expected a "
                    "fallback or error for empty LLM output."
                )
            except AssertionError:
                raise

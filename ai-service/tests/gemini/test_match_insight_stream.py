"""
Streaming engine tests for `gemini/match_insight_engine.stream_match_insight`.

The async generator mirrors the sync handler's two-attempt + fallback flow but
yields NDJSON events. These tests mock `generate_stream` (the module global the
engine binds at import time, same pattern as the existing gemini tests) and
assert the event sequence: delta chunks, optional restart, fallback on double
failure, end with the validated answer, and error on unexpected failure.
"""

import asyncio
import logging

import pytest
from unittest.mock import patch

from tests.gemini.conftest import log_assert, log_header

import gemini.match_insight_engine as insight_engine

logger = logging.getLogger(__name__)

VALID_CHUNKS = [
    "Your resume shows a strong fit at 85/100 for this role. ",
    "Your main gap is Docker experience. Next, learn Docker.",
]
VALID_FULL = "".join(VALID_CHUNKS)

GARBAGE = "Python"


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


async def _collect(events):
    return [event async for event in events]


def _sync(events):
    return asyncio.run(_collect(events))


class TestStreamMatchInsight:
    def test_valid_stream_yields_deltas_then_end(self, resume, matches):
        """Two text chunks → two delta events carrying the running full text,
        then one end event with the validated answer."""
        log_header("Gemini stream — valid output yields delta + end")

        async def fake_stream(prompt, **kwargs):
            for chunk in VALID_CHUNKS:
                yield chunk

        with patch("gemini.match_insight_engine.generate_stream", new=fake_stream):
            events = _sync(
                insight_engine.stream_match_insight(resume, matches, "job-99")
            )

        types = [e["type"] for e in events]
        logger.info(f"  → event types: {types}")
        log_assert("first event is delta", types[0])

        deltas = [e for e in events if e["type"] == "delta"]
        assert len(deltas) == 2, "expected one delta per streamed chunk"
        assert deltas[0]["full"] == VALID_CHUNKS[0]
        assert deltas[1]["full"] == VALID_FULL
        assert all(e["jobId"] == "job-99" for e in events)

        assert types[-1] == "end"
        assert events[-1]["answer"] == VALID_FULL
        assert "restart" not in types, "valid first attempt must not restart"

    def test_invalid_first_attempt_restarts_then_ends(self, resume, matches):
        """Garbage first attempt → restart event, then a valid retry → deltas
        + end with the retried answer."""
        log_header("Gemini stream — invalid first attempt restarts with directive")

        calls = {"count": 0}

        async def fake_stream(prompt, **kwargs):
            calls["count"] += 1
            if calls["count"] == 1:
                yield GARBAGE
            else:
                for chunk in VALID_CHUNKS:
                    yield chunk

        with patch("gemini.match_insight_engine.generate_stream", new=fake_stream):
            events = _sync(
                insight_engine.stream_match_insight(resume, matches, "job-99")
            )

        types = [e["type"] for e in events]
        logger.info(f"  → event types: {types}")
        log_assert("restart event emitted", "restart" in types)

        restart_idx = types.index("restart")
        # The garbage delta precedes restart and is followed by fresh deltas.
        assert types[restart_idx - 1] == "delta"
        assert events[restart_idx - 1]["full"] == GARBAGE
        assert types[-1] == "end"
        assert events[-1]["answer"] == VALID_FULL
        assert types.count("restart") == 1, "only one retry allowed"

    def test_double_failure_falls_back(self, resume, matches):
        """Both attempts garbage → fallback event with a structured answer."""
        log_header("Gemini stream — double failure returns structured fallback")

        async def fake_stream(prompt, **kwargs):
            yield GARBAGE

        with patch("gemini.match_insight_engine.generate_stream", new=fake_stream):
            events = _sync(
                insight_engine.stream_match_insight(resume, matches, "job-99")
            )

        types = [e["type"] for e in events]
        logger.info(f"  → event types: {types}")
        log_assert("fallback event emitted", "fallback" in types)

        assert types.count("restart") == 1
        fallback = next(e for e in events if e["type"] == "fallback")
        assert isinstance(fallback["answer"], str)
        assert len(fallback["answer"]) > 0
        assert fallback["jobId"] == "job-99"
        assert types[-1] == "fallback", "fallback is terminal, no end after it"

    def test_unexpected_error_yields_error_event(self, resume, matches):
        """A mid-stream exception (non-validation) surfaces as an error event,
        not a bare 500 — the backend can then emit a socket error."""
        log_header("Gemini stream — unexpected failure yields error event")

        async def failing_stream(prompt, **kwargs):
            yield VALID_CHUNKS[0]
            raise RuntimeError("gemini exploded")

        with patch("gemini.match_insight_engine.generate_stream", new=failing_stream):
            events = _sync(
                insight_engine.stream_match_insight(resume, matches, "job-99")
            )

        types = [e["type"] for e in events]
        logger.info(f"  → event types: {types}")
        log_assert("error event emitted", "error" in types)

        assert types[-1] == "error"
        error_event = events[-1]
        assert "gemini exploded" in error_event["message"]
        assert error_event["jobId"] == "job-99"

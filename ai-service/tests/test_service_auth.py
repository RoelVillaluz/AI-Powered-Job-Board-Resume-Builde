"""
Test 3: Missing Service-to-Service Authentication

Demonstrates that the AI service's /compute endpoints have NO authentication
or authorization layer. Any caller who can reach the AI service port can
invoke any handler directly, bypassing the Node.js backend entirely.

What a fixed pipeline should do:
  - Require a shared secret (e.g. API key header or JWT) on every /compute
    endpoint, validated against the backend's configured key.
  - Return 401 Unauthorized when the header is missing or invalid.

Current behaviour (vulnerable): zero auth.
  → POST /compute/generate_match_insight with no auth header → 200 with data.
  → Any internal endpoint is fully exposed to the network.

Test logic:
  1. Start the FastAPI application via TestClient.
  2. POST /compute/generate_match_insight with a valid payload but NO auth
     header (simulating a direct network caller that skipped Node).
  3. Assert the response is 401 Unauthorized.
  4. Because there is no auth middleware on the AI service, the endpoint
     returns 200 → assertion FAILS.
"""

import logging

from fastapi.testclient import TestClient
from app import app

logger = logging.getLogger(__name__)

client = TestClient(app)

MATCH_INSIGHT_PAYLOAD = {
    "resume": {
        "skills": [{"name": "Python"}],
        "experienceLevel": "mid",
    },
    "matches": [
        {
            "metadata": {
                "title": "Software Engineer",
                "location": "Remote",
                "salaryMin": 100000,
                "salaryMax": 150000,
                "salaryCurrency": "USD",
                "salaryFrequency": "yearly",
            },
            "finalScore": 85.0,
            "recommendationType": "good_fit",
            "matchedSkills": ["Python"],
            "missingSkills": ["Go"],
            "strengths": ["Solid Python"],
            "improvements": ["Learn Go"],
        }
    ],
    "jobId": "job-test-1",
}


class TestServiceAuth:
    def test_generate_match_insight_without_auth(self):
        """
        FAILS because: the /compute/generate_match_insight endpoint has no
        auth requirement.  Calling it directly with no auth header succeeds
        when it should return 401.

        Note: this test may trigger a real Gemini call (bad key → 400 in
        the AI service logs).  That's fine — the critical assertion is the
        HTTP status code, not the handler's internal error handling.
        """
        response = client.post(
            "/compute/generate_match_insight",
            json=MATCH_INSIGHT_PAYLOAD,
        )

        logger.info(
            "  POST /compute/generate_match_insight  "
            "(X-Internal-Service-Key: ABSENT)  "
            f"→ {response.status_code}"
        )

        # AUTH CHECK:
        #   Expected (with fix): response.status_code == 401
        #   Current (vulnerable): response.status_code == 200
        #
        # The response body is irrelevant — the fact that we got 200
        # instead of 401 is the proof.  (The handler may or may not
        # have errored internally due to bad Gemini key, but the
        # router accepted the request without authentication.)
        try:
            assert response.status_code == 401, (
                "AUTH GAP CONFIRMED: "
                f"Expected 401 (unauthorized) but got {response.status_code}. "
                "The AI service accepted a request with NO auth header. "
                "Any network caller can invoke compute endpoints directly."
            )
        except AssertionError:
            raise

    def test_health_endpoint_is_public(self):
        """
        Sanity check: the /health endpoint is intentionally public.
        This proves the TestClient infrastructure works correctly
        and that auth checks are not blanket-blocking everything.
        """
        response = client.get("/health")
        logger.info(
            "  GET /health  (public endpoint, no auth header needed)  "
            f"→ {response.status_code}"
        )
        assert response.status_code == 200, (
            f"Expected /health to be public (200), got {response.status_code}"
        )

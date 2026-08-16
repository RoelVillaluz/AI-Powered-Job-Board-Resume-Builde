# gemini/response_validator.py
"""
Output validation for Gemini-generated responses.

Single source of truth for the structural checks the match-insight pipeline
enforces. The production handler and the test suite import the SAME functions
from here — never reimplement the heuristics in a handler or a test.

Validation contract (the 4-part structure: verdict, score, gap, next step):
  - response_is_properly_structured(text): requires a "X/100" score, a
    verdict/fit mention, and a gap/improvement mention (plus non-trivial
    length).
  - response_leaks_instructions(text): flags leaked system-prompt / role text.
"""

MIN_RESPONSE_LENGTH = 20

VERDICT_INDICATORS = ["fit", "match", "score", "verdict"]
GAP_INDICATORS = ["gap", "missing", "improve", "learn", "develop"]
LEAK_INDICATORS = [
    "system prompt",
    "system instruction",
    "you are a warm",
    "you are a career coach",
    "your instructions",
]


def response_is_properly_structured(text: str) -> bool:
    """Heuristic: response has a "X/100" score, a verdict/fit mention, and a
    gap/improvement mention — the 4-part structure (verdict, strength, gap,
    next-step) the match-insight pipeline should enforce."""
    if not text or len(text) < MIN_RESPONSE_LENGTH:
        return False
    lower = text.lower()
    has_score = "/100" in lower
    has_verdict = any(w in lower for w in VERDICT_INDICATORS)
    has_gap = any(w in lower for w in GAP_INDICATORS)
    return has_score and has_verdict and has_gap


def response_leaks_instructions(text: str) -> bool:
    """Heuristic: response leaks the system prompt / role instructions."""
    lower = text.lower()
    return any(ind in lower for ind in LEAK_INDICATORS)

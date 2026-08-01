"""
tests/gemini/conftest.py — shared output-validation heuristics for the
Gemini RAG pipeline tests.

These are the ONLY copies of the response-shape / instruction-leak checks.
Before changing the expected response structure in tests/gemini/, update them
here — never redefine them in a test file.
"""


def response_is_properly_structured(text: str) -> bool:
    """Heuristic: response has a "X/100" score, a verdict/fit mention, and a
    gap/improvement mention — the 4-part structure (verdict, strength, gap,
    next-step) the match-insight pipeline should enforce."""
    if not text or len(text) < 20:
        return False
    lower = text.lower()
    has_score = "/100" in lower
    has_verdict = any(w in lower for w in ["fit", "match", "score", "verdict"])
    has_gap = any(w in lower for w in ["gap", "missing", "improve", "learn", "develop"])
    return has_score and has_verdict and has_gap


def response_leaks_instructions(text: str) -> bool:
    """Heuristic: response leaks the system prompt / role instructions."""
    lower = text.lower()
    indicators = [
        "system prompt",
        "system instruction",
        "you are a warm",
        "you are a career coach",
        "your instructions",
    ]
    return any(ind in lower for ind in indicators)

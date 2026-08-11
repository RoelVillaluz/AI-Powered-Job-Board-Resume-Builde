# gemini/gemini_client.py
"""
Thin wrapper around the Gemini API (free tier) for RAG-style calls.

Free-tier notes (verify current numbers in Google AI Studio — they change often):
  - gemini-2.5-flash:      ~10-15 RPM, ~250-1500 RPD, 1M token context
  - gemini-2.5-flash-lite: higher RPM ceiling, slightly weaker reasoning — use if
                            you're hitting 429s on flash and don't need the quality

No credit card required, but Google may use free-tier prompts for training —
don't send anything a user wouldn't want retained (resume PII is a gray area;
consider stripping name/contact info before it reaches the prompt).
"""

import os
import logging
import time
from google import genai
from google.genai import errors as genai_errors
from metrics.gemini_metrics import (
    record_generate_duration,
    record_generate_request,
    record_generate_tokens,
    record_model_fallback,
)

logger = logging.getLogger(__name__)

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_MODEL_FALLBACK = os.environ.get("GEMINI_MODEL_FALLBACK", "gemini-2.5-flash-lite")

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


def generate(
    prompt: str,
    system_instruction: str | None = None,
    model: str = GEMINI_MODEL,
    temperature: float = 0.55,
    max_output_tokens: int = 1500,  # ↑ from 800 — headroom even with thinking off
    thinking_budget: int = 0,  # 0 disables thinking; this task doesn't need multi-step reasoning
    endpoint: str = "generate_match_insight",
) -> str:
    """
    Single-shot generation call. Falls back to the lighter free-tier model
    once on a 429 (rate limit) before giving up.

    thinking_budget=0 matters more than it sounds: Gemini's flash-tier models
    (2.5+, and now 3.x) spend reasoning tokens out of the SAME max_output_tokens
    budget as the visible answer. Left uncapped, a short summary can get
    silently truncated mid-sentence because the model burned its budget on
    internal reasoning before writing anything the user sees.

    Instrumented: each call records duration, token usage (from
    usage_metadata), request outcome, and 429 fallback events to Prometheus.
    """
    client = _get_client()

    config = {
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
        "thinking_config": {"thinking_budget": thinking_budget},
    }
    if system_instruction:
        config["system_instruction"] = system_instruction

    start = time.perf_counter()
    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=config,
        )
        record_generate_duration(model, endpoint, time.perf_counter() - start)
        record_generate_tokens(model, response.usage_metadata)
        record_generate_request(model, "success")
        return response.text or ""

    except genai_errors.ClientError as e:
        record_generate_request(model, "error")
        is_rate_limit = getattr(e, "code", None) == 429 or "RESOURCE_EXHAUSTED" in str(
            e
        )
        if is_rate_limit and model != GEMINI_MODEL_FALLBACK:
            logger.warning(
                f"[Gemini] {model} rate-limited, retrying once with {GEMINI_MODEL_FALLBACK}"
            )
            record_model_fallback()
            return generate(
                prompt,
                system_instruction=system_instruction,
                model=GEMINI_MODEL_FALLBACK,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                thinking_budget=thinking_budget,
                endpoint=endpoint,
            )
        logger.error(f"[Gemini] Generation failed (ClientError): {e}")
        raise

    except Exception as e:
        record_generate_request(model, "error")
        # Catches SDK-level config/validation errors (e.g. a malformed
        # thinking_config) that aren't genai_errors.ClientError — these were
        # previously escaping as unhandled 500s instead of a diagnosable error.
        logger.exception(
            f"[Gemini] Generation failed (unexpected error type: {type(e).__name__})"
        )
        raise

import logging

from handlers.base_handler import register, safe_call
from gemini.gemini_client import GEMINI_MODEL, generate
from gemini.match_insight_engine import (
    DIRECTIVE_RETRY_INSTRUCTION,
    SYSTEM_INSTRUCTION,
    build_prompt,
    build_structured_fallback,
    is_valid_answer,
)
from gemini.response_validator import (
    response_is_properly_structured,
    response_leaks_instructions,
)
from metrics.gemini_metrics import record_generate_request

logger = logging.getLogger(__name__)


@register("generate_match_insight")
def generate_match_insight(resume: dict, matches: list[dict], job_id: str) -> dict:
    def _run():
        prompt = build_prompt(resume, matches)
        answer = generate(
            prompt,
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.55,
            max_output_tokens=1500,
            thinking_budget=0,
        )
        if not is_valid_answer(answer):
            record_generate_request(GEMINI_MODEL, "validation_failed")
            logger.warning(
                "[Gemini] Output validation failed on first attempt "
                f"(structured={response_is_properly_structured(answer)}, "
                f"leaks={response_leaks_instructions(answer)}), retrying with "
                "directive prompt"
            )
            answer = generate(
                prompt,
                system_instruction=DIRECTIVE_RETRY_INSTRUCTION,
                temperature=0.55,
                max_output_tokens=1500,
                thinking_budget=0,
            )
            if not is_valid_answer(answer):
                record_generate_request(GEMINI_MODEL, "validation_failed")
                logger.error(
                    "[Gemini] Output validation failed after retry, returning "
                    "structured fallback"
                )
                answer = build_structured_fallback(matches)
        # jobId echoed back so Node's buildPayload can attach the explanation
        # to the right match — matchInsightRegistry.ts has no other way to
        # learn it, since executeComputePipelineV2 only passes the bare
        # resumeId as `id`, never a composite key.
        return {"answer": answer, "jobId": job_id}

    return safe_call(_run, label="generate_match_insight")

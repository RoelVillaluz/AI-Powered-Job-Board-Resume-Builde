from handlers.base_handler import register, safe_call
from services.job_matching_service import JobMatchingService


@register("score_matches")
def score_matches(
    resume: dict,
    job_matches: list[dict],
    skill_market_data: list[dict],
) -> dict:
    def _run():
        matches = JobMatchingService.score_matches(resume, job_matches, skill_market_data)
        return {"matches": matches, "totalScored": len(matches)}

    return safe_call(_run, label="score_matches")
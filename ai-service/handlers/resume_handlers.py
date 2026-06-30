from handlers.base_handler import register, safe_call
from services.resume_service import ResumeService
from services.scoring_service import ScoringService
from services.analytics_service import AnalyticsService
from serializers.resume_serializers import (
    serialize_resume_embeddings,
    serialize_resume_score,
)
from utils.date_utils import calculate_total_experience


@register("generate_resume_embeddings")
def generate_resume_embeddings(
    resume_body: dict,
    skill_docs: list[dict],
    job_title_doc: dict | None,
    location_doc: dict | None,
    work_experience_title_docs: list[dict],
) -> dict:
    def _run():
        emb = ResumeService.extract_embeddings(
            resume_body,
            skill_docs,
            job_title_doc,
            location_doc,
            work_experience_title_docs,
        )
        return serialize_resume_embeddings(resume_body.get("_id"), emb)

    return safe_call(_run, label="generate_resume_embeddings")


@register("score_resume")
def score_resume(resume_body: dict, scoring_payload: dict) -> dict:
    def _run():
        total_exp = resume_body.get(
            "totalExperienceYears"
        ) or calculate_total_experience(resume_body.get("workExperience", []))
        score = ScoringService.calculate_resume_score(
            resume=resume_body,
            total_experience_years=total_exp,
            scoring_payload=scoring_payload,
        )
        market_skill_names = [
            s.get("name") or s.get("skillName")
            for s in scoring_payload.get("skillMarketData", [])
            if s.get("name") or s.get("skillName")
        ]
        insights = AnalyticsService.analyze_resume(
            resume=resume_body,
            total_experience_years=total_exp,
            scoring_payload=scoring_payload,
            market_skill_names=market_skill_names,
        )
        overall_message = AnalyticsService._get_overall_message(score.overall_score)
        result = serialize_resume_score(
            resume_body.get("_id"), score, insights, total_exp
        )
        result["overall_message"] = overall_message
        return result

    return safe_call(_run, label="score_resume")

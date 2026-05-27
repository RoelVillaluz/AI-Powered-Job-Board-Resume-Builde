from typing import Optional
from handlers.base_handler import register, safe_call
from salary_intelligence.normalization.constants import BASE_EXCHANGE_RATES
from salary_intelligence.pipeline.salary_prediction_orchestrator import SalaryPredictionOrchestrator
from salary_intelligence.serialization.serializer import _serialise_prediction


@register("predict_salary")
def predict_salary(
    seniority_level:        str,
    resume_score:           Optional[float],
    total_experience_years: Optional[float],
    job_title_data:         Optional[dict],
    industry_data:          Optional[dict],
    location_data:          Optional[dict],
    skill_market_data:      Optional[list[dict]],
    exchange_rates:         dict[str, float] = BASE_EXCHANGE_RATES,
) -> dict:
    def _run():
        prediction = SalaryPredictionOrchestrator.predict(
            seniority_level=seniority_level,
            resume_score=resume_score,
            total_experience_years=total_experience_years,
            job_title_data=job_title_data,
            industry_data=industry_data,
            location_data=location_data,
            skill_market_data=skill_market_data,
            exchange_rates=exchange_rates,
        )
        return _serialise_prediction(prediction)

    return safe_call(_run, label="predict_salary")
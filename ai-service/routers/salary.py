"""
routers/compute/salary_prediction.py
─────────────────────────────────────
POST /compute/predict_salary

Receives a pre-shaped payload from Node's buildSalaryPayload,
runs the salary prediction pipeline, and returns the result
in the standard { data, error } envelope Node expects.

Payload shape (all fields except seniority_level are optional —
the pipeline degrades gracefully when data is missing):

    {
        "seniority_level":        "Mid-Level",
        "total_experience_years": 4.5,
        "job_title_data": {
            "salaryData": {
                "bySeniority": { "Mid-Level": { "median": 90000 } },
                "medianSalary": 85000,
                "currency": "$"
            }
        },
        "industry_data": {
            "salaryBenchmarks": {
                "bySeniority": { "Mid-Level": { "median": 75000 } },
                "overallMedian": 70000,
                "currency": "$"
            }
        },
        "location_data": {
            "name": "San Francisco",
            "baselineFactor": 0.40,
            "costOfLivingIndex": 180
        },
        "skill_market_data": [
            { "name": "React", "demandScore": 88, "growthRate": 22, "seniorityMultiplier": 1.4 }
        ]
    }
"""

from fastapi import APIRouter

from routers.shared.request import ComputeRequest
from routers.shared.response import wrap
from handlers.salary_handler import predict_salary

router = APIRouter(prefix="/compute")


@router.post("/predict_salary")
async def predict_salary_endpoint(body: ComputeRequest):
    data = body.model_dump()

    return wrap(
        predict_salary(
            seniority_level=data.get("seniority_level"),
            resume_score=data.get("resume_score"),
            total_experience_years=data.get(
                "total_experience_years"
            ),  # None-safe — pipeline handles it
            job_title_data=data.get("job_title_data"),
            industry_data=data.get("industry_data"),
            location_data=data.get("location_data"),
            skill_market_data=data.get("skill_market_data"),
            # exchange_rates not in payload — defaults to BASE_EXCHANGE_RATES in predict_salary
        )
    )

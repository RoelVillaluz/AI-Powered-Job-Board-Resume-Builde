"""
Salary Prediction Smoke Test — Legazpi City, Albay (PH)
"""

import logging

# Logging helpers are the canonical tests/scoring/conftest.py set, imported
# cross-domain: a second bare `conftest` module under tests/salary/ would
# shadow tests/gemini/conftest.py (and vice versa) during multi-directory
# pytest invocations, since pytest prepends but never re-orders sys.path
# entries for same-named conftest modules.
from tests.scoring.conftest import log_assert, log_header

from salary_intelligence.pipeline.salary_prediction_orchestrator import (
    SalaryPredictionOrchestrator,
)

logger = logging.getLogger(__name__)


EXCHANGE_RATES = {"$": 1.0, "₱": 0.017, "€": 1.08, "¥": 0.0065, "£": 1.27}

SKILLS_FULLSTACK = [
    {"name": "React", "demandScore": 88, "growthRate": 22, "seniorityMultiplier": 1.4},
    {
        "name": "Node.js",
        "demandScore": 80,
        "growthRate": 25,
        "seniorityMultiplier": 1.3,
    },
    {
        "name": "TypeScript",
        "demandScore": 82,
        "growthRate": 28,
        "seniorityMultiplier": 1.3,
    },
]

JOB_TITLE_DEV = {
    "salaryData": {
        "medianSalary": 480_000,
        "currency": "₱",
        "bySeniority": {
            "Entry": {"avg": 420_000, "median": 400_000},
            "Mid-Level": {"avg": 720_000, "median": 680_000},
            "Senior": {"avg": 1_200_000, "median": 1_100_000},
        },
    }
}

INDUSTRY_TECH_PH = {
    "salaryBenchmarks": {
        "overallMedian": 500_000,
        "currency": "₱",
        "bySeniority": {
            "Entry": {"avg": 420_000, "median": 390_000},
            "Mid-Level": {"avg": 700_000, "median": 650_000},
            "Senior": {"avg": 1_100_000, "median": 1_050_000},
        },
    }
}

LOCATION_LEGAZPI = {
    "name": "Legazpi City, Albay",
    "baselineFactor": -0.18,
    "costOfLivingIndex": 82.0,
}


def test_salary_predictions_smoke():
    cases = [
        # (label, seniority, resume_score, total_experience_years, skills)
        ("Senior Full-Stack", "Senior", 85, 8, SKILLS_FULLSTACK),
        (
            "Entry IT",
            "Entry",
            55,
            1,
            [
                {
                    "name": "Excel",
                    "demandScore": 55,
                    "growthRate": 10,
                    "seniorityMultiplier": 0.9,
                }
            ],
        ),
        ("No Skills", "Mid-Level", 30, 0, None),
    ]

    for label, seniority, resume_score, exp, skills in cases:
        log_header(f"Salary — {label} (Legazpi City, Albay)")

        logger.info(f"  · seniority:          {seniority}")
        logger.info(f"  · resume_score:       {resume_score}")
        logger.info(f"  · experience years:   {exp}")
        if skills:
            logger.info(
                "  · skills:             " + ", ".join(s["name"] for s in skills)
            )
        else:
            logger.info("  · skills:             (none)")
        logger.info(
            "  · location:           "
            f"{LOCATION_LEGAZPI['name']} "
            f"(costOfLivingIndex {LOCATION_LEGAZPI['costOfLivingIndex']}, "
            f"baselineFactor {LOCATION_LEGAZPI['baselineFactor']})"
        )

        result = SalaryPredictionOrchestrator.predict(
            seniority_level=seniority,
            resume_score=resume_score,
            total_experience_years=exp,
            job_title_data=JOB_TITLE_DEV,
            industry_data=INDUSTRY_TECH_PH,
            location_data=LOCATION_LEGAZPI,
            skill_market_data=skills,
            exchange_rates=EXCHANGE_RATES,
        )

        log_assert("predicted_yearly", result.predicted_yearly)
        log_assert("predicted_monthly", result.predicted_monthly)
        log_assert("range (min - max)", f"{result.range_min} - {result.range_max}")
        log_assert("confidence", result.confidence_score)

        # tiny sanity checks so pytest actually “does something”
        assert result.predicted_yearly > 0
        assert result.predicted_monthly > 0

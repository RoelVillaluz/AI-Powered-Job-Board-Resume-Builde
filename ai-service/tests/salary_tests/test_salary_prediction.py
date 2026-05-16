"""
Salary Prediction Smoke Test — Legazpi City, Albay (PH)
"""

from salary_intelligence.pipeline.salary_prediction_orchestrator import SalaryPredictionOrchestrator


EXCHANGE_RATES = {
    "$": 1.0,
    "₱": 0.017,
    "€": 1.08,
    "¥": 0.0065,
    "£": 1.27
}

SKILLS_FULLSTACK = [
    {"name": "React", "demandScore": 88, "growthRate": 22, "seniorityMultiplier": 1.4},
    {"name": "Node.js", "demandScore": 80, "growthRate": 25, "seniorityMultiplier": 1.3},
    {"name": "TypeScript", "demandScore": 82, "growthRate": 28, "seniorityMultiplier": 1.3},
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
    "costOfLivingIndex": 82.0
}


def test_salary_predictions_smoke():
    cases = [
        ("Senior Full-Stack", "Senior", 8, SKILLS_FULLSTACK),
        ("Entry IT", "Entry", 1, [
            {"name": "Excel", "demandScore": 55, "growthRate": 10, "seniorityMultiplier": 0.9}
        ]),
        ("No Skills", "Mid-Level", 0, None),
    ]

    for label, seniority, exp, skills in cases:
        result = SalaryPredictionOrchestrator.predict(
            seniority_level=seniority,
            total_experience_years=exp,
            job_title_data=JOB_TITLE_DEV,
            industry_data=INDUSTRY_TECH_PH,
            location_data=LOCATION_LEGAZPI,
            skill_market_data=skills,
            exchange_rates=EXCHANGE_RATES,
        )

        print("\n" + "=" * 80)
        print(label)
        print("=" * 80)
        print("Yearly:", result.predicted_yearly)
        print("Monthly:", result.predicted_monthly)
        print("Range:", result.range_min, "-", result.range_max)
        print("Confidence:", result.confidence_score)

        # tiny sanity checks so pytest actually “does something”
        assert result.predicted_yearly > 0
        assert result.predicted_monthly > 0
        
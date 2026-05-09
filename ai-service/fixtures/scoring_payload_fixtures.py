import pytest


@pytest.fixture
def scoring_payload_full_stack(full_stack_title, ml_engineer_title, cloud_engineer_title, skill_market_data, resume_full):
    """
    Complete ScoringPayload as built by Node's scoringPayloadService.
    Higher-paying titles are pre-filtered (>15% above Full Stack's $132k median).
    """
    return {
        "resumeSkills": [s["name"] for s in resume_full["skills"]],
        "currentTitle": {
            "title": full_stack_title["title"],
            "medianSalary": full_stack_title["salaryData"]["medianSalary"],
            "seniorityLevel": full_stack_title["seniorityLevel"],
            "topSkills": full_stack_title["topSkills"],
        },
        "higherPayingTitles": [
            {
                "title": ml_engineer_title["title"],
                "medianSalary": ml_engineer_title["salaryData"]["medianSalary"],
                "topSkills": ml_engineer_title["topSkills"],
            },
            {
                "title": cloud_engineer_title["title"],
                "medianSalary": cloud_engineer_title["salaryData"]["medianSalary"],
                "topSkills": cloud_engineer_title["topSkills"],
            },
        ],
        "skillMarketData": skill_market_data,
    }
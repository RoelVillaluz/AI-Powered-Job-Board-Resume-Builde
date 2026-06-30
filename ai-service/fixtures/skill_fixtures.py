import pytest


@pytest.fixture
def skill_market_data():
    """
    Skill market data as Node would fetch it from the Skill collection.
    Covers all skills used in the resume fixtures above.
    """
    return [
        {
            "name": "JavaScript",
            "demandScore": 95,
            "growthRate": 2.1,
            "seniorityMultiplier": 1.2,
        },
        {
            "name": "TypeScript",
            "demandScore": 78,
            "growthRate": 22.7,
            "seniorityMultiplier": 1.45,
        },
        {
            "name": "React",
            "demandScore": 88,
            "growthRate": 9.4,
            "seniorityMultiplier": 1.4,
        },
        {
            "name": "Node.js",
            "demandScore": 74,
            "growthRate": 7.2,
            "seniorityMultiplier": 1.3,
        },
        {
            "name": "PostgreSQL",
            "demandScore": 76,
            "growthRate": 14.2,
            "seniorityMultiplier": 1.3,
        },
        {
            "name": "Docker",
            "demandScore": 77,
            "growthRate": 10.2,
            "seniorityMultiplier": 1.4,
        },
        {
            "name": "AWS",
            "demandScore": 84,
            "growthRate": 11.8,
            "seniorityMultiplier": 1.6,
        },
        {
            "name": "PyTorch",
            "demandScore": 57,
            "growthRate": 46.7,
            "seniorityMultiplier": 1.9,
        },
        {
            "name": "Python",
            "demandScore": 92,
            "growthRate": 18.4,
            "seniorityMultiplier": 1.6,
        },
        {
            "name": "SQL",
            "demandScore": 86,
            "growthRate": 1.4,
            "seniorityMultiplier": 1.1,
        },
        {
            "name": "CI/CD",
            "demandScore": 71,
            "growthRate": 13.1,
            "seniorityMultiplier": 1.35,
        },
        {
            "name": "HTML",
            "demandScore": 85,
            "growthRate": -1.2,
            "seniorityMultiplier": 0.85,
        },
        {
            "name": "CSS",
            "demandScore": 82,
            "growthRate": -1.4,
            "seniorityMultiplier": 0.85,
        },
        {
            "name": "REST API",
            "demandScore": 79,
            "growthRate": 1.6,
            "seniorityMultiplier": 1.15,
        },
        {
            "name": "Communication",
            "demandScore": 88,
            "growthRate": 1.2,
            "seniorityMultiplier": 0.9,
        },
        {
            "name": "Excel",
            "demandScore": 72,
            "growthRate": -4.2,
            "seniorityMultiplier": 0.95,
        },
        {
            "name": "PHP",
            "demandScore": 44,
            "growthRate": -8.6,
            "seniorityMultiplier": 0.9,
        },
    ]

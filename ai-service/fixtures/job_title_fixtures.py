import pytest


@pytest.fixture
def full_stack_title():
    """JobTitle document as Node would fetch it for a Full Stack Engineer."""
    return {
        "title": "Full Stack Engineer",
        "normalizedTitle": "Full Stack Engineer",
        "industry": "Technology",
        "seniorityLevel": "Mid-Level",
        "salaryData": {"medianSalary": 132000, "currency": "$"},
        "topSkills": [
            {"skillName": "JavaScript", "frequency": 88, "importance": "Required"},
            {"skillName": "TypeScript", "frequency": 64, "importance": "Preferred"},
            {"skillName": "React", "frequency": 76, "importance": "Required"},
            {"skillName": "Node.js", "frequency": 72, "importance": "Required"},
            {"skillName": "REST API", "frequency": 80, "importance": "Required"},
            {"skillName": "SQL", "frequency": 65, "importance": "Required"},
            {"skillName": "PostgreSQL", "frequency": 52, "importance": "Preferred"},
            {"skillName": "Docker", "frequency": 44, "importance": "Preferred"},
            {"skillName": "HTML", "frequency": 84, "importance": "Required"},
            {"skillName": "CSS", "frequency": 82, "importance": "Required"},
        ],
    }


@pytest.fixture
def devops_title():
    """DevOps Engineer — used to test that React/TS don't score for this role."""
    return {
        "title": "DevOps Engineer",
        "normalizedTitle": "DevOps Engineer",
        "industry": "Technology",
        "seniorityLevel": "Mid-Level",
        "salaryData": {"medianSalary": 145000, "currency": "$"},
        "topSkills": [
            {"skillName": "AWS", "frequency": 82, "importance": "Required"},
            {"skillName": "Docker", "frequency": 88, "importance": "Required"},
            {"skillName": "CI/CD", "frequency": 90, "importance": "Required"},
            {"skillName": "GitHub Actions", "frequency": 72, "importance": "Required"},
            {"skillName": "Python", "frequency": 52, "importance": "Preferred"},
            {"skillName": "Google Cloud", "frequency": 48, "importance": "Preferred"},
            {"skillName": "Cybersecurity", "frequency": 44, "importance": "Preferred"},
        ],
    }


@pytest.fixture
def ml_engineer_title():
    """ML Engineer — higher-paying than Full Stack, used for progression tests."""
    return {
        "title": "Machine Learning Engineer",
        "normalizedTitle": "Machine Learning Engineer",
        "industry": "Technology",
        "seniorityLevel": "Mid-Level",
        "salaryData": {"medianSalary": 182000, "currency": "$"},
        "topSkills": [
            {"skillName": "Python", "frequency": 96, "importance": "Required"},
            {
                "skillName": "Machine Learning",
                "frequency": 96,
                "importance": "Required",
            },
            {"skillName": "Deep Learning", "frequency": 80, "importance": "Required"},
            {"skillName": "PyTorch", "frequency": 74, "importance": "Required"},
            {"skillName": "TensorFlow", "frequency": 64, "importance": "Preferred"},
            {"skillName": "scikit-learn", "frequency": 70, "importance": "Required"},
            {"skillName": "pandas", "frequency": 72, "importance": "Required"},
        ],
    }


@pytest.fixture
def cloud_engineer_title():
    """Cloud Engineer — higher-paying than Full Stack, has AWS as Required."""
    return {
        "title": "Cloud Engineer",
        "normalizedTitle": "Cloud Engineer",
        "industry": "Technology",
        "seniorityLevel": "Mid-Level",
        "salaryData": {"medianSalary": 152000, "currency": "$"},
        "topSkills": [
            {"skillName": "AWS", "frequency": 86, "importance": "Required"},
            {"skillName": "Google Cloud", "frequency": 62, "importance": "Preferred"},
            {"skillName": "Docker", "frequency": 80, "importance": "Required"},
            {"skillName": "CI/CD", "frequency": 76, "importance": "Required"},
            {"skillName": "Python", "frequency": 56, "importance": "Preferred"},
        ],
    }

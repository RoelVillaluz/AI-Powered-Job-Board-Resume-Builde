import pytest


@pytest.fixture
def resume_full():
    """Complete resume — all sections filled. Used for completeness scoring."""
    return {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "phone": "+1-555-0100",
        "summary": "Experienced full stack engineer with 6 years building scalable web applications.",
        "jobTitle": {"name": "Full Stack Engineer"},
        "location": {"name": "San Francisco, CA"},
        "skills": [
            {"name": "JavaScript"},
            {"name": "TypeScript"},
            {"name": "React"},
            {"name": "Node.js"},
            {"name": "PostgreSQL"},
            {"name": "Docker"},
            {"name": "AWS"},           # career progression skill
            {"name": "PyTorch"},       # career progression skill
        ],
        "workExperience": [
            {
                "jobTitle": "Full Stack Engineer",
                "company": "Acme Corp",
                "startDate": "2021-01-01",
                "endDate": "2024-01-01",
                "responsibilities": ["Built APIs", "Led frontend rewrite"],
            },
            {
                "jobTitle": "Junior Software Engineer",
                "company": "StartupCo",
                "startDate": "2019-06-01",
                "endDate": "2021-01-01",
                "responsibilities": ["Maintained React components"],
            },
        ],
        "education": [{"degree": "Bachelor", "field": "Computer Science"}],
        "certifications": [
            {"name": "AWS Solutions Architect"},
            {"name": "Docker Certified Associate"},
        ],
    }

@pytest.fixture
def resume_sparse():
    """Minimal resume — only required fields. Tests low-score paths."""
    return {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "skills": [{"name": "Python"}],
        "workExperience": [],
        "certifications": [],
    }

@pytest.fixture
def resume_no_skills():
    """Resume with zero skills — tests zero-score edge case."""
    return {
        "firstName": "Empty",
        "lastName": "Skills",
        "email": "empty@example.com",
        "skills": [],
        "workExperience": [],
        "certifications": [],
    }
import json
import sys
from utils import get_user_resumes

resume_field_weights = {
    'firstName': 0.05,
    'lastName': 0.05,
    'phone': 0.05,
    'address': 0.05,
    'summary': 0.1,
    'skills': 0.25,  
    'workExperience': 0.3, 
    'certifications': 0.05,
    'socialMedia': 0.05,
}

def calculate_resume_score(resume):
    score = 0
    for field, weight in resume_field_weights.items():
        if field in resume:
            value = resume[field]
            if isinstance(value, str):
                if value.strip():
                    score += weight
            elif isinstance(value, list):
                if len(value) > 0:
                    score += weight

    return score

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing user_id"}))
        sys.exit(1)
    
    user_id = sys.argv[1]
    for resume in get_user_resumes(user_id):
        print(calculate_resume_score(resume))
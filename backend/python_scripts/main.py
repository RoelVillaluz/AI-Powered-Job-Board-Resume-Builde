"""
Main CLI entry point for Node.js to call Python functions.

Usage:
    python main.py <command> <args...>

Commands:
    score_resume <resume_id>
    compare_resume_job <resume_id> <job_id> [resume_cache_status] [job_cache_status]
    generate_resume_embeddings <resume_id>
    generate_job_embeddings <job_id>
    batch_compare <resume_id> <job_ids_json> <limit>
    get_recommendations <user_id> <resume_id> <limit>
"""

import sys
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]  # Log to stderr so stdout is clean JSON
)

logger = logging.getLogger(__name__)

# Import all the services
from services.analytics_service import AnalyticsService
from services.scoring_service import ScoringService
from services.resume_service import ResumeService
from services.job_service import JobService
from utils.tensor_utils import tensor_to_list

def generate_resume_embeddings(resume_id: str):
    """
    Generate embeddings for a resume.
    
    Returns JSON:
    {
        "resume_id": "...",
        "embeddings": {
            "skills": [[...], [...]],
            "workExperience": [[...], [...]],
            "certifications": [[...]]
        },
        "meanEmbeddings": {
            "skills": [...],
            "workExperience": [...],
            "certifications": [...]
        },
        "metrics": {
            "totalExperienceYears": 5.2
        }
    }
    """
    try:
        resume = ResumeService.get_job_relevant_resume(resume_id)
        if not resume:
            return {"error": f"Resume not found: {resume_id}"}

        embeddings = ResumeService.extract_embeddings(resume)

        # Convert tensors to lists for JSON serialization
        result = {
            "resume_id": resume_id,
            "embeddings": {
                "skills": [],  # Individual embeddings not needed for cache
                "workExperience": [],
                "certifications": []
            },
            "meanEmbeddings": {
                "skills": tensor_to_list(embeddings.skills),
                "workExperience": tensor_to_list(embeddings.work_experience),
                "certifications": tensor_to_list(embeddings.certifications)
            },
            "metrics": {
                "totalExperienceYears": embeddings.total_experience_years
            }
        }

        return result
    except Exception as e:
        logger.error(f"Error generating resume embeddings: {e}", exc_info=True)
        return {"error": str(e)}
    
def generate_job_embeddings(job_id: str):
    """
    Generate embeddings for a job posting.
    
    Returns JSON:
    {
        "job_id": "...",
        "embeddings": {...},
        "meanEmbeddings": {
            "jobTitle": [...],
            "skills": [...],
            "requirements": [...],
            "experienceLevel": [...],
            "location": [...]
        }
    }
    """
    try:
        job = JobService.get_job_relevant_fields(job_id)
        if not job:
            return {"error": f"Job not found: {job_id}"}
        
        embeddings = JobService.extract_embeddings(job)

        result = {
            "job_id": job_id,
            "embeddings": {},  # Individual embeddings not needed
            "meanEmbeddings": {
                "jobTitle": tensor_to_list(embeddings.title),
                "skills": tensor_to_list(embeddings.skills),
                "requirements": tensor_to_list(embeddings.requirements),
                "experienceLevel": tensor_to_list(embeddings.experience_level),
                "location": tensor_to_list(embeddings.location)
            }
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating job embeddings: {e}", exc_info=True)
        return {"error": str(e)}
    
def score_resume(resume_id: str) -> dict:
    """
    Calculate comprehensive score for a resume.

    Returns JSON:
    {
        "resume_id": "...",
        "overall_score": 85.5,
        "grade": "B+",
        "breakdown": {
            "completeness": 90,
            "experience": 80,
            "skills": 85,
            "certifications": 75
        },
        "total_experience_years": 5.2,
        "strengths": [...],
        "improvements": [...],
        "recommendations": [...],
        "overall_message": "Nearly flawless! Your resume effectively presents your qualifications"
    }
    """
    try:
        # Fetch the resume
        resume = ResumeService.get_full_resume(resume_id)
        if not resume:
            return {"error": f"Resume not found: {resume_id}"}

        # Extract embeddings and calculate scores
        embeddings = ResumeService.extract_embeddings(resume)
        score = ScoringService.calculate_resume_score(resume, embeddings.total_experience_years)

        # Analyze resume for insights
        insights = AnalyticsService.analyze_resume(user_id=None, resume_id=resume_id)

        # Compute overall message
        overall_message = AnalyticsService.get_overall_message(score.overall_score)

        # Build response
        result = {
            "resume_id": resume_id,
            "overall_score": score.overall_score,
            "grade": score.grade,
            "breakdown": {
                "completeness": score.completeness_score,
                "experience": score.experience_score,
                "skills": score.skills_score,
                "certifications": score.certification_score
            },
            "total_experience_years": embeddings.total_experience_years,
            "strengths": insights.strengths if insights else [],
            "improvements": insights.improvement_suggestions if insights else [],
            "recommendations": insights.skill_gaps if insights else [],
            "overall_message": overall_message
        }

        return result

    except Exception as e:
        logger.error(f"Error scoring resume: {e}", exc_info=True)
        return {"error": str(e)}
    
def main():
    """Main CLI entry point."""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)
    
    command = sys.argv[1]
    result = None  # Initialize result

    try:
        if command == 'generate_resume_embeddings':
            if len(sys.argv) < 3:
                print(json.dumps({"error": f"Resume ID required for embedding generation"}))
                sys.exit(1)
            result = generate_resume_embeddings(sys.argv[2])

        elif command == 'generate_job_embeddings':
            if len(sys.argv) < 3:
                print(json.dumps({"error": f"Job ID required for embedding generation"}))
                sys.exit(1)
            result = generate_job_embeddings(sys.argv[2])

        elif command == 'score_resume':
            if len(sys.argv) < 3:
                print(json.dumps({"error": "Resume ID required"}))
                sys.exit(1)
            result = score_resume(sys.argv[2])
        
        print(json.dumps(result, indent=2))

    except Exception as e:
        logger.error(f"Fatal error in main: {e}", exc_info=True)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
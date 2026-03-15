import sys
import json
import logging

import torch

# Configure logging to stderr so stdout stays clean for JSON output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

logger = logging.getLogger(__name__)

from models.embeddings import embedding_model
from services.analytics_service import AnalyticsService
from services.scoring_service import ScoringService
from services.resume_service import ResumeEmbeddings, ResumeService
from services.job_service import JobService
from utils.tensor_utils import tensor_to_list
from utils.websocket_utils import emit_progress
from config.database import db
from bson import ObjectId

def generate_resume_embeddings(resume_id: str) -> dict:
    """
    Generate mean embeddings and experience metrics for a resume.

    Args:
        resume_id (str): MongoDB ObjectId string for the resume document.

    Returns:
        dict: {
            "resume_id": str,
            "embeddings": {
                "skills": [],           # Reserved — individual embeddings not cached
                "workExperience": [],
                "certifications": []
            },
            "meanEmbeddings": {
                "skills": list[float],
                "workExperience": list[float],
                "certifications": list[float]
            },
            "metrics": {
                "totalExperienceYears": float
            }
        }
        On error: { "error": str }
    """
    try:
        emit_progress("embedding:progress", 15, "Fetching your resume data...")

        resume = ResumeService.get_job_relevant_resume(resume_id)
        if not resume:
            return {"error": f"Resume not found: {resume_id}"}

        emit_progress("embedding:progress", 25, "Analyzing your skills...")

        embeddings = ResumeService.extract_embeddings(resume)

        emit_progress("embedding:progress", 40, "Reviewing your work experience...")

        # Work experience is the most time-intensive section — emit after it resolves
        emit_progress("embedding:progress", 52, "Checking your certifications...")

        emit_progress("embedding:progress", 58, "Finalizing embedding vectors...")

        result = {
            "resume_id": resume_id,
            "embeddings": {
                "skills": [],
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


def generate_job_embeddings(job_id: str) -> dict:
    """
    Generate mean embeddings for a job posting.

    Args:
        job_id (str): MongoDB ObjectId string for the job posting document.

    Returns:
        dict: {
            "job_id": str,
            "embeddings": {},           # Reserved — individual embeddings not cached
            "meanEmbeddings": {
                "jobTitle": list[float],
                "skills": list[float],
                "requirements": list[float],
                "experienceLevel": list[float],
                "location": list[float]
            }
        }
        On error: { "error": str }
    """
    try:
        emit_progress("embedding:progress", 15, "Fetching job posting data...")

        job = JobService.get_job_relevant_fields(job_id)
        if not job:
            return {"error": f"Job not found: {job_id}"}

        emit_progress("embedding:progress", 30, "Analyzing job title and requirements...")

        embeddings = JobService.extract_embeddings(job)

        emit_progress("embedding:progress", 50, "Processing skills and experience level...")

        emit_progress("embedding:progress", 58, "Finalizing job embedding vectors...")

        result = {
            "job_id": job_id,
            "embeddings": {},
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

def generate_skill_embeddings(skill_id: str) -> dict:
    """
    Generate embedding for a skill by fetching its name from the DB
    and encoding it using the pre-loaded sentence transformer model.

    Args:
        skill_id (str): MongoDB ObjectId string for the skill document.

    Returns:
        dict: {
            "skill_id": str,
            "embedding": list[float]  # Flat float array e.g. 384 dims for MiniLM
        }
        On error: { "error": str }
    """
    try:
        skill = db.skills.find_one(
            {"_id": ObjectId(skill_id)},
            {"name": 1}
        )

        if not skill:
            return {"error": f"Skill not found: {skill_id}"}

        skill_name = skill.get("name")
        if not skill_name:
            return {"error": f"Skill has no name: {skill_id}"}

        embedding = embedding_model.encode(skill_name)

        if embedding is None:
            return {"error": f"Embedding model returned None for skill: {skill_id}"}

        return {
            "skill_id": skill_id,
            "embedding": embedding.detach().cpu().tolist()
        }

    except Exception as e:
        logger.error(f"Error generating embedding for skill {skill_id}: {e}")
        return {"error": str(e)}

def score_resume(resume_id: str) -> dict:
    """
    Calculate a comprehensive effectiveness score for a resume.

    Args:
        resume_id (str): MongoDB ObjectId string for the resume document.

    Returns:
        dict: {
            "resume_id": str,
            "overall_score": float,
            "grade": str,
            "breakdown": {
                "completeness": float,
                "experience": float,
                "skills": float,
                "certifications": float
            },
            "total_experience_years": float,
            "strengths": list[str],
            "improvements": list[str],
            "recommendations": list[str],
            "overall_message": str
        }
        On error: { "error": str }
    """
    try:
        emit_progress("score:progress", 68, "Fetching your resume data...")

        resume = ResumeService.get_full_resume(resume_id)
        if not resume:
            return {"error": f"Resume not found: {resume_id}"}
        
        existing_embeddings = db.resumeEmbeddings.find_one(
            {'resume': ObjectId(resume_id)},
            {
                'meanEmbeddings.skills': 1,
                'meanEmbeddings.workExperience': 1,
                'meanEmbeddings.certifications': 1,
                'metrics.totalYears': 1,
                '_id': 0
            }
        )

        if not existing_embeddings:
            embeddings = ResumeService.extract_embeddings(resume)
        else:
            # Reconstruct NamedTuple from stored doc so .total_experience_years works
            mean = existing_embeddings.get('meanEmbeddings', {})
            embeddings = ResumeEmbeddings(
                skills=torch.tensor(mean["skills"], dtype=torch.float32) if mean.get("skills") else None,
                work_experience=torch.tensor(mean["workExperience"], dtype=torch.float32) if mean.get("workExperience") else None,
                certifications=torch.tensor(mean["certifications"], dtype=torch.float32) if mean.get("certifications") else None,
                total_experience_years=existing_embeddings.get("totalExperienceYears", 0.0)
            )

        emit_progress("score:progress", 76, "Scoring your experience depth...")

        score = ScoringService.calculate_resume_score(resume, embeddings.total_experience_years)

        emit_progress("score:progress", 83, "Evaluating your skill coverage...")

        insights = AnalyticsService.analyze_resume(user_id=None, resume_id=resume_id)

        emit_progress("score:progress", 89, "Identifying strengths and gaps...")

        overall_message = AnalyticsService.get_overall_message(score.overall_score)

        emit_progress("score:progress", 94, "Composing your final score...")

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
    """
    CLI entry point invoked by the Node.js pythonRunner.

    Reads the command from sys.argv[1] and dispatches to the appropriate
    handler function. The final result is printed as JSON to stdout.
    Progress events are emitted to stdout mid-execution by individual handlers
    via emit_progress() — the runner distinguishes them by "type": "progress".

    Exit codes:
        0 — success (result JSON printed to stdout)
        1 — missing arguments or unhandled exception
    """
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    command = sys.argv[1]
    result = None

    try:
        if command == 'generate_resume_embeddings':
            if len(sys.argv) < 3:
                print(json.dumps({"error": "Resume ID required for embedding generation"}))
                sys.exit(1)
            result = generate_resume_embeddings(sys.argv[2])

        elif command == 'generate_job_embeddings':
            if len(sys.argv) < 3:
                print(json.dumps({"error": "Job ID required for embedding generation"}))
                sys.exit(1)
            result = generate_job_embeddings(sys.argv[2])

        elif command == 'generate_skill_embeddings':
            if len(sys.argv) < 3:
                print(json.dumps({'error': 'Skill ID required'}))
                sys.exit(1)
            result = generate_skill_embeddings(sys.argv[2])

        elif command == 'score_resume':
            if len(sys.argv) < 3:
                print(json.dumps({"error": "Resume ID required"}))
                sys.exit(1)
            result = score_resume(sys.argv[2])

        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)

        print(json.dumps(result, indent=2))

    except Exception as e:
        logger.error(f"Fatal error in main: {e}", exc_info=True)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
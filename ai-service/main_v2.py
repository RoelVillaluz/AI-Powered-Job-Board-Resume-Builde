import sys
import logging
import torch
from services.resume_service import ResumeService
from services.scoring_service import ScoringService
from utils.tensor_utils import tensor_to_list
from utils.date_utils import calculate_total_experience
from services.scoring_service import ScoringService
from services.analytics_service import AnalyticsService

# Configure logging to stderr so stdout stays clean for JSON output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

logger = logging.getLogger(__name__)

def generate_resume_embeddings_v2(resume_body: dict) -> dict:
    """
    Generate mean embeddings and experience metrics for a resume.

    Args:
        resume_body (dict): Resume Object containing relevant fields for resume.

    Returns:
        dict: {
            "resume_id": str,
            "embeddings": {
                "jobTitle":  list[float],
                "location":  list[float]
            },
            "meanEmbeddings": {
                "skills":         list[float],
                "workExperience": list[float],
                "certifications": list[float]
            },
            "metrics": {
                "totalExperienceYears": float
            },
        }
        On error: { "error": str }
    """
    try:
        embeddings = ResumeService.extract_embeddings(resume_body)

        return {
            "resume_id": resume_body.get("_id"),
            "embeddings": {
                "jobTitle": tensor_to_list(embeddings.job_title),
                "location": tensor_to_list(embeddings.location)
            },
            "meanEmbeddings": {
                "skills":         tensor_to_list(embeddings.skills),
                "workExperience": tensor_to_list(embeddings.work_experience),
                "certifications": tensor_to_list(embeddings.certifications)
            },
            "metrics": {
                "totalExperienceYears": embeddings.total_experience_years
            },
        }
    except Exception as e:
        logger.error(f"Error generating resume embeddings: {e}", exc_info=True)
        return {"error": str(e)}

def score_resume_v2(resume_body: dict) -> dict:
    """
    V2 — Calculate a comprehensive effectiveness score for a resume.

    Accepts a prepared resume dict from Node. No DB calls.
    totalExperienceYears is passed directly from the embedding document
    via prepareResumeScoringFieldsRepo. Falls back to computing from
    workExperience if not present (e.g. embeddings not yet generated).

    Args:
        resume_body (dict): Full resume document with totalExperienceYears appended.
            {
                "_id":                  str,
                "firstName":            str,
                "lastName":             str,
                "skills":               list[dict],
                "workExperience":       list[dict],
                "certifications":       list[dict],
                "education":            list[dict],
                "summary":              str,
                "totalExperienceYears": float | None,  ← from embedding metrics
                ...
            }

    Returns:
        dict: {
            "resume_id":              str,
            "overall_score":          float,
            "grade":                  str,
            "breakdown": {
                "completeness":       float,
                "experience":         float,
                "skills":             float,
                "certifications":     float
            },
            "total_experience_years": float,
            "strengths":              list[str],
            "improvements":           list[str],
            "recommendations":        list[str],
            "overall_message":        str
        }
        On error: { "error": str }
    """
    try:
        # Use pre-computed value from embedding document if available.
        # Falls back to computing from workExperience if embeddings
        # haven't been generated yet.
        total_experience_years = (
            resume_body.get("totalExperienceYears")
            or calculate_total_experience(resume_body.get("workExperience", []))
        )

        score = ScoringService.calculate_resume_score(
            resume_body,
            total_experience_years,
        )

        insights = AnalyticsService.analyze_resume(
            user_id=None,
            resume_id=str(resume_body.get("_id", "")),
        )

        overall_message = AnalyticsService.get_overall_message(score.overall_score)

        return {
            "resume_id":              str(resume_body.get("_id", "")),
            "overall_score":          score.overall_score,
            "grade":                  score.grade,
            "breakdown": {
                "completeness":       score.completeness_score,
                "experience":         score.experience_score,
                "skills":             score.skills_score,
                "certifications":     score.certification_score,
            },
            "total_experience_years": total_experience_years,
            "strengths":              insights.strengths              if insights else [],
            "improvements":           insights.improvement_suggestions if insights else [],
            "recommendations":        insights.skill_gaps              if insights else [],
            "overall_message":        overall_message,
        }

    except Exception as e:
        logger.error(f"Error scoring resume v2: {e}", exc_info=True)
        return {"error": str(e)}
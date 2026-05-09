import sys
import logging
from infrastructure.embeddings.embed_text import embed_text
from models.embeddings import embedding_model
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

def generate_resume_embeddings_v2(
    resume_body: dict,
    skill_docs: list[dict],
    job_title_doc: dict | None,
    location_doc: dict | None,
    work_experience_title_docs: list[dict],
) -> dict:
    """
    Generate mean embeddings and experience metrics for a resume.

    Args:
        resume_body (dict): Resume Object containing relevant fields for resume.
        skill_docs list[dict]:
        job_title_doc (dict):
        location_doc (dict):
        work_experience_title_docs list[dict]:

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
        embeddings = ResumeService.extract_embeddings(
            resume_body,
            skill_docs,
            job_title_doc,
            location_doc,
            work_experience_title_docs,
        )

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

def score_resume_v2(resume_body: dict, scoring_payload: dict) -> dict:
    """
    V2 — Calculate a comprehensive effectiveness score for a resume.

    Pure compute — no DB calls. All market data arrives via scoring_payload
    which Node builds from JobTitle + Skill collections before calling this.

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
                "totalExperienceYears": float | None,
                ...
            }

        scoring_payload (dict): Built by Node via buildScoringPayload().
            {
                "resumeSkills":       list[str],
                "currentTitle": {
                    "title":           str,
                    "medianSalary":    float,
                    "seniorityLevel":  str,
                    "topSkills":       list[TitleTopSkill],
                },
                "higherPayingTitles": list[HigherPayingTitle],
                "skillMarketData":    list[SkillMarketData],
            }

    Returns:
        {
            "resume_id":              str,
            "overall_score":          float,
            "grade":                  str,
            "breakdown": {
                "completeness":            float,
                "experience":              float,
                "skills":                  float,
                "market_demand":           float,
                "certifications":          float,
                "career_progression":      float,   ← bonus, max +10
            },
            "total_experience_years": float,
            "strengths":              list[str],
            "improvements":           list[str],
            "recommendations":        list[str],   ← skill gaps
            "overall_message":        str,
        }
        On error: { "error": str }
    """
    try:
        total_experience_years = (
            resume_body.get("totalExperienceYears")
            or calculate_total_experience(resume_body.get("workExperience", []))
        )

        score = ScoringService.calculate_resume_score(
            resume=resume_body,
            total_experience_years=total_experience_years,
            scoring_payload=scoring_payload,
        )

        # market_skill_names for gap analysis — top skills from currentTitle
        # that aren't already on the resume
        market_skill_names = [
            s["skillName"]
            for s in scoring_payload.get("currentTitle", {}).get("topSkills", [])
        ]

        insights = AnalyticsService.analyze_resume(
            resume=resume_body,
            total_experience_years=total_experience_years,
            scoring_payload=scoring_payload,
            market_skill_names=market_skill_names,
        )

        overall_message = AnalyticsService._get_overall_message(score.overall_score)

        return {
            "resume_id":    str(resume_body.get("_id", "")),
            "overall_score": score.overall_score,
            "grade":         score.grade,
            "breakdown": {
                "completeness":       score.completeness_score,
                "experience":         score.experience_score,
                "skills":             score.skills_score,
                "certifications":     score.certification_score,
                "career_progression": score.career_progression_score,
            },
            "total_experience_years": total_experience_years,
            "strengths":       insights.strengths              if insights else [],
            "improvements":    insights.improvement_suggestions if insights else [],
            "recommendations": insights.skill_gaps             if insights else [],
            "overall_message": overall_message,
        }

    except Exception as e:
        logger.error(f"Error scoring resume v2: {e}", exc_info=True)
        return {"error": str(e)}

def generate_skill_embeddings_v2(payload: dict) -> dict:
    text = payload.get('name')

    return {
        "skill_id": payload.get("_id"),
        "embedding": embed_text(text)
    }

def generate_job_title_embeddings_v2(payload: dict) -> dict:
    text = payload.get("normalizedTitle") or payload.get("title")

    return {
        "title_id": payload.get("_id"),
        "embedding": embed_text(text)
    }

def generate_location_embeddings_v2(payload: dict) -> dict:
    text = payload.get('name')

    return {
        "skill_id": payload.get("_id"),
        "embedding": embed_text(text)
    }
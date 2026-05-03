import sys
import logging

import torch

from services.resume_service import ResumeService
from utils.tensor_utils import tensor_to_list

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

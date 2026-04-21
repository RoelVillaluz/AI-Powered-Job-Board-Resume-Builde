"""Service for job posting related operations - OPTIMIZED."""
from typing import Optional, NamedTuple
import torch
from bson import ObjectId
import logging
from backend.src.python_scripts.utils.embedding_utils import extract_experience_level_embedding, extract_job_title_embedding, extract_location_embedding, extract_requirement_embeddings, extract_skills_embeddings
from backend.src.python_scripts.config.database import db
from backend.src.python_scripts.models.embeddings import embedding_model

logger = logging.getLogger(__name__)


class JobEmbeddings(NamedTuple):
    """Container for job posting embeddings."""
    skills: Optional[torch.Tensor]
    requirements: Optional[torch.Tensor]
    experience_level: Optional[torch.Tensor]
    title: Optional[torch.Tensor]
    location: Optional[torch.Tensor]


class JobService:
    """Handles job posting data processing."""
    
    # Education level mapping (for future use)
    EDUCATION_LEVELS = {
        "None": 0,
        "High school": 1,
        "Bachelor's degree": 2,
        "Master's degree": 3,
        "PhD": 4
    }
    
    @staticmethod
    def get_by_id(job_id: str) -> Optional[dict]:
        """
        Fetch full job posting by ID.
        
        Use this for displaying job details to users.
        For embedding calculations, use get_job_relevant_fields() instead.
        
        Args:
            job_id: Job posting ObjectId as string
            
        Returns:
            Full job posting document or None if not found
        """
        try:
            job = db.jobpostings.find_one({"_id": ObjectId(job_id)})
            return job
        except Exception as e:
            logger.error(f"Error fetching job {job_id}: {e}")
            return None
    
    @staticmethod
    def get_job_relevant_fields(job_id: str) -> Optional[dict]:
        """
        Fetch ONLY the fields needed for embedding calculations.
        
        This is OPTIMIZED for similarity/matching operations.
        Only fetches: title, skills, requirements, experienceLevel, location
        
        Args:
            job_id: Job posting ObjectId as string
            
        Returns:
            Job posting with only relevant fields or None if not found
        """
        try:
            fields = {
                "title": 1,
                "skills": 1,
                "requirements": 1,
                "experienceLevel": 1,
                "location": 1,
                "_id": 1
            }
            job = db.jobpostings.find_one({"_id": ObjectId(job_id)}, fields)
            return job
        except Exception as e:
            logger.error(f"Error fetching job-relevant fields for {job_id}: {e}")
            return None
    
    @staticmethod
    def extract_embeddings(job: dict) -> JobEmbeddings:
        """
        Extract embeddings from job posting data.
        
        Args:
            job: Job posting document dictionary
            
        Returns:
            JobEmbeddings containing all computed embeddings
        """
        skills_emb = extract_skills_embeddings(job.get("skills", []))
        requirements_emb = extract_requirement_embeddings(job.get("requirements", []))

        job_title_obj = job.get("jobTitle", {})
        job_title_emb = extract_job_title_embedding(job_title_obj.get("name", ""))

        location_emb = extract_location_embedding(job.get("location", {}).get("name", ""))

        exp_level_emb = None
        exp_level = job.get("experienceLevel")
        if exp_level:
            exp_level_emb = extract_experience_level_embedding(exp_level)
        
        return JobEmbeddings(
            skills=skills_emb,
            requirements=requirements_emb,
            experience_level=exp_level_emb,
            title=job_title_emb,
            location=location_emb
        )
    
    @staticmethod
    def extract_job_embeddings(job: dict) -> JobEmbeddings:
        """
        Alias for extract_embeddings for backwards compatibility.
        
        Args:
            job: Job posting document dictionary
            
        Returns:
            JobEmbeddings containing all computed embeddings
        """
        return JobService.extract_embeddings(job)
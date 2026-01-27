"""Service for job posting related operations - OPTIMIZED."""
from typing import Optional, NamedTuple
import torch
from bson import ObjectId
import logging
from config.database import db
from models.embeddings import embedding_model
from utils.embedding_utils import extract_skills_embeddings, extract_requirement_embeddings

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
        # Extract skills and requirements embeddings
        skills_emb = extract_skills_embeddings(job.get("skills", []))
        requirements_emb = extract_requirement_embeddings(job.get("requirements", []))
        
        # Extract single field embeddings
        experience_level = job.get("experienceLevel")
        experience_emb = None
        if experience_level:
            experience_emb = embedding_model.encode(experience_level)
            if experience_emb is not None:
                experience_emb = experience_emb.detach().cpu()
        
        title = job.get("title")
        title_emb = None
        if title:
            title_emb = embedding_model.encode(title)
            if title_emb is not None:
                title_emb = title_emb.detach().cpu()
        
        location = job.get("location")
        location_emb = None
        if location:
            location_emb = embedding_model.encode(location)
            if location_emb is not None:
                location_emb = location_emb.detach().cpu()
        
        return JobEmbeddings(
            skills=skills_emb,
            requirements=requirements_emb,
            experience_level=experience_emb,
            title=title_emb,
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
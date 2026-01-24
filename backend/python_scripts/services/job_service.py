"""Service for job posting related operations."""
from typing import Optional, NamedTuple
import torch
import logging
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
    def extract_job_embeddings(job: dict) -> JobEmbeddings:
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
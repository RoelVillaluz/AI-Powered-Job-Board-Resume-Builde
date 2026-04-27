"""Service for resume-related operations."""
from typing import Optional, NamedTuple
import torch
from bson import ObjectId
import logging
from config.database import db
from infrastructure.embeddings.embedding_orchestrator import extract_resume_embeddings_parallel
from utils.date_utils import calculate_total_experience

logger = logging.getLogger(__name__)

    
class ResumeEmbeddings(NamedTuple):
    """Container for resume embeddings."""
    skills: Optional[torch.Tensor]
    job_title: Optional[torch.Tensor]
    work_experience: Optional[torch.Tensor]
    location: Optional[torch.Tensor]
    certifications: Optional[torch.Tensor]
    total_experience_years: float
class ResumeService:
    """Handles resume data retrieval and processing."""
    
    @staticmethod
    def get_full_resume(resume_id: str) -> Optional[dict]:
        """
        Fetch the **complete resume** by ID, including all fields.

        This method is intended for **completeness scoring**, 
        e.g., when calculating a resume's overall quality based on 
        personal info, skills, work experience, certifications, and social media.

        Args:
            resume_id: Resume ObjectId as string
            
        Returns:
            Full resume document or None if not found
        """
        try:
            resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
            return resume
        except Exception as e:
            logger.error(f"Error fetching resume {resume_id}: {e}")
            return None

    @staticmethod
    def get_job_relevant_resume(resume_id: str) -> Optional[dict]:
        """
        Fetch only the **job-comparable fields** of a resume by ID.

        This method is intended for **relevance or similarity scoring** 
        when comparing a resume to a job posting. It only includes fields 
        that can be matched with job requirements: skills, work experience, 
        certifications, and summary.

        Args:
            resume_id: Resume ObjectId as string
            
        Returns:
            Resume document with only job-relevant fields or None if not found
        """
        try:
            fields = {
                "skills": 1,
                "jobTitle": 1,
                "location": 1,
                "workExperience": 1,
                "certifications": 1,
                "summary": 1,
                "_id": 1
            }
            resume = db.resumes.find_one({"_id": ObjectId(resume_id)}, fields)
            return resume
        except Exception as e:
            logger.error(f"Error fetching job-relevant resume {resume_id}: {e}")
            return None
    
    @staticmethod
    def extract_embeddings(resume: dict) -> ResumeEmbeddings:
        """
        Extract embeddings from resume data.
        
        Args:
            resume: Resume document dictionary
            
        Returns:
            ResumeEmbeddings containing all computed embeddings
        """
        # Batch extract embeddings for each section with parallel processing
        result = extract_resume_embeddings_parallel(resume, resume.get('_id', ''))
        
        # Calculate total experience
        total_exp = calculate_total_experience(resume.get("workExperience", []))
        
        return ResumeEmbeddings(
            skills=result["skills"],
            job_title=result["job_title"],
            location=result["location"],
            work_experience=result["work_experience"],
            certifications=result["certifications"],
            total_experience_years=total_exp,
        )
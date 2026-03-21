"""Service for resume-related operations."""
from typing import Optional, NamedTuple
import torch
from bson import ObjectId
import logging
from utils.embedding_utils import extract_certification_embeddings, extract_skills_embeddings, extract_work_experience_embeddings
from config.database import db
from utils.date_utils import calculate_total_experience

logger = logging.getLogger(__name__)


class ResumeEmbeddings(NamedTuple):
    """Container for resume embeddings."""
    skills: Optional[torch.Tensor]
    work_experience: Optional[torch.Tensor]
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
        # Extract embeddings for each section
        skills_emb = extract_skills_embeddings(resume.get("skills", []))
        work_emb = extract_work_experience_embeddings(resume.get("workExperience", []))
        cert_emb = extract_certification_embeddings(resume.get("certifications", []))
        
        # Calculate total experience
        total_exp = calculate_total_experience(resume.get("workExperience", []))
        
        return ResumeEmbeddings(
            skills=skills_emb,
            work_experience=work_emb,
            certifications=cert_emb,
            total_experience_years=total_exp
        )
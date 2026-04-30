"""Service that exactly matches your compare_resume_to_job function - OPTIMIZED."""
import torch
from typing import Optional, Dict
from bson import ObjectId
import logging
import traceback
from config.database import db
from services.resume_service import ResumeService
from services.job_service import JobService
from services.similarity_service import SimilarityService

logger = logging.getLogger(__name__)


class ComparisonService:
    """Handles resume-to-job comparison exactly as in your original code."""
    
    @staticmethod
    def get_cached_embeddings(resume_id: str) -> Optional[Dict]:
        """
        Fetch cached embeddings for a resume.
        
        Args:
            resume_id: Resume ID
            
        Returns:
            Cached embeddings dictionary or None
        """
        try:
            # Use projection to only get the fields we need
            fields = {
                "meanEmbeddings.skills": 1,
                "meanEmbeddings.workExperience": 1,
                "meanEmbeddings.certifications": 1,
                "_id": 0
            }
            cached = db.resume_embeddings.find_one(
                {"resume": ObjectId(resume_id)},
                fields
            )
            return cached
        except Exception as e:
            logger.error(f"Error fetching cached embeddings for {resume_id}: {e}")
            return None
    
    @staticmethod
    def get_cached_job_embeddings(job_id: str) -> Optional[Dict]:
        """
        Fetch cached embeddings for a job posting.
        
        Args:
            job_id: Job posting ID
            
        Returns:
            Cached job embeddings dictionary or None
        """
        try:
            fields = {
                "meanEmbeddings.jobTitle": 1,
                "meanEmbeddings.skills": 1,
                "meanEmbeddings.requirements": 1,
                "_id": 0
            }
            cached = db.job_posting_embeddings.find_one(
                {"jobPosting": ObjectId(job_id)},
                fields
            )
            return cached
        except Exception as e:
            logger.error(f"Error fetching cached job embeddings for {job_id}: {e}")
            return None
    
    @staticmethod
    def compare_resume_to_job(resume_id: str, job_id: str) -> Dict:
        """
        Compare resume to job using cached embeddings when available.
        
        OPTIMIZED VERSION:
        - Uses field projection to fetch only needed data
        - Checks both resume AND job embedding caches
        - Uses get_job_relevant_resume() instead of full document
        
        Args:
            resume_id: Resume ID
            job_id: Job posting ID
            
        Returns:
            Dictionary with similarity scores and feedback
        """
        try:
            # Try to get cached embeddings FIRST (fastest path)
            cached_resume_embeddings = ComparisonService.get_cached_embeddings(resume_id)
            cached_job_embeddings = ComparisonService.get_cached_job_embeddings(job_id)
            
            # Get resume embeddings (cached or calculated)
            if cached_resume_embeddings and cached_resume_embeddings.get('meanEmbeddings'):
                mean_embeddings = cached_resume_embeddings['meanEmbeddings']
                
                # Convert cached embeddings to tensors
                mean_resume_skill_embedding = mean_embeddings.get('skills')
                mean_resume_work_embedding = mean_embeddings.get('workExperience')
                certification_embeddings = mean_embeddings.get('certifications')
                
                if mean_resume_skill_embedding and isinstance(mean_resume_skill_embedding, list):
                    mean_resume_skill_embedding = torch.tensor(mean_resume_skill_embedding)
                if mean_resume_work_embedding and isinstance(mean_resume_work_embedding, list):
                    mean_resume_work_embedding = torch.tensor(mean_resume_work_embedding)
                if certification_embeddings and isinstance(certification_embeddings, list):
                    certification_embeddings = torch.tensor(certification_embeddings)
            else:
                # Fall back to calculating - USE OPTIMIZED GETTER
                resume = ResumeService.get_job_relevant_resume(resume_id)
                
                if not resume:
                    return {"error": f"Resume not found with ID: {resume_id}"}
                
                resume_embeddings = ResumeService.extract_embeddings(resume)
                mean_resume_skill_embedding = resume_embeddings.skills
                mean_resume_work_embedding = resume_embeddings.work_experience
                certification_embeddings = resume_embeddings.certifications
            
            # Get job embeddings (cached or calculated)
            if cached_job_embeddings and cached_job_embeddings.get('meanEmbeddings'):
                job_mean = cached_job_embeddings['meanEmbeddings']
                
                mean_job_skill_embedding = job_mean.get('skills')
                mean_job_requirements_embedding = job_mean.get('requirements')
                job_title_embedding = job_mean.get('jobTitle')
                
                if mean_job_skill_embedding and isinstance(mean_job_skill_embedding, list):
                    mean_job_skill_embedding = torch.tensor(mean_job_skill_embedding)
                if mean_job_requirements_embedding and isinstance(mean_job_requirements_embedding, list):
                    mean_job_requirements_embedding = torch.tensor(mean_job_requirements_embedding)
                if job_title_embedding and isinstance(job_title_embedding, list):
                    job_title_embedding = torch.tensor(job_title_embedding)
            else:
                # Fall back to calculating - USE OPTIMIZED GETTER
                job = JobService.get_job_relevant_fields(job_id)
                
                if not job:
                    return {"error": f"Job not found with ID: {job_id}"}
                
                job_embeddings = JobService.extract_job_embeddings(job)
                mean_job_skill_embedding = job_embeddings.skills
                mean_job_requirements_embedding = job_embeddings.requirements
                job_title_embedding = job_embeddings.title
            
            feedback = {}
            
            # Skill similarity
            if mean_resume_skill_embedding is not None and mean_job_skill_embedding is not None:
                resume_tensor = (
                    torch.tensor(mean_resume_skill_embedding)
                    if not isinstance(mean_resume_skill_embedding, torch.Tensor)
                    else mean_resume_skill_embedding
                )
                job_tensor = (
                    torch.tensor(mean_job_skill_embedding)
                    if not isinstance(mean_job_skill_embedding, torch.Tensor)
                    else mean_job_skill_embedding
                )
                
                skill_similarity = SimilarityService.cosine_similarity(resume_tensor, job_tensor)
                feedback["skillSimilarity"] = float(skill_similarity)
            else:
                feedback["skillSimilarity"] = None
            
            # Experience similarity
            if mean_resume_work_embedding is not None and job_title_embedding is not None:
                resume_tensor = (
                    torch.tensor(mean_resume_work_embedding)
                    if not isinstance(mean_resume_work_embedding, torch.Tensor)
                    else mean_resume_work_embedding
                )
                job_tensor = (
                    torch.tensor(job_title_embedding)
                    if not isinstance(job_title_embedding, torch.Tensor)
                    else job_title_embedding
                )
                
                experience_similarity = SimilarityService.cosine_similarity(resume_tensor, job_tensor)
                feedback["experienceSimilarity"] = float(experience_similarity)
            else:
                feedback["experienceSimilarity"] = None
            
            # Requirements similarity
            if certification_embeddings is not None and mean_job_requirements_embedding is not None:
                cert_tensor = (
                    torch.tensor(certification_embeddings)
                    if not isinstance(certification_embeddings, torch.Tensor)
                    else certification_embeddings
                )
                job_req_tensor = (
                    torch.tensor(mean_job_requirements_embedding)
                    if not isinstance(mean_job_requirements_embedding, torch.Tensor)
                    else mean_job_requirements_embedding
                )
                
                requirements_similarity = SimilarityService.cosine_similarity(cert_tensor, job_req_tensor)
                feedback["requirementSimilarity"] = float(requirements_similarity)
            else:
                feedback["requirementSimilarity"] = None
            
            # Calculate total score
            value_weights = {
                "skillSimilarity": 0.65,
                "experienceSimilarity": 0.35,
            }
            
            total_score = 0
            for key, weight in value_weights.items():
                value = feedback.get(key, 0)
                value = value if value is not None else 0
                total_score += value * weight
            
            feedback["totalScore"] = float(total_score)
            feedback["matchedSkills"] = []  # Placeholder
            feedback["missingSkills"] = []  # Placeholder
            feedback["strengths"] = []  # Placeholder
            feedback["improvements"] = []  # Placeholder
            
            return feedback
            
        except Exception as e:
            return {
                "error": f"Error in compare_resume_to_job: {str(e)}",
                "traceback": traceback.format_exc(),
                "resume_id": resume_id,
                "job_id": job_id
            }
    
    @staticmethod
    def compare_with_detailed_feedback(resume_id: str, job_id: str) -> Dict:
        """
        Enhanced comparison with detailed skill matching and feedback.
        
        OPTIMIZED VERSION:
        - Fetches full documents ONLY when needed for detailed analysis
        - Uses projections for minimal data transfer
        
        Args:
            resume_id: Resume ID
            job_id: Job posting ID
            
        Returns:
            Dictionary with similarity scores and detailed feedback
        """
        try:
            # Get base comparison (uses optimized getters)
            feedback = ComparisonService.compare_resume_to_job(resume_id, job_id)
            
            if "error" in feedback:
                return feedback
            
            # For detailed analysis, fetch ONLY the skills fields
            resume_skills_projection = {"skills": 1, "_id": 0}
            job_skills_projection = {"skills": 1, "_id": 0}
            
            resume_doc = db.resumes.find_one(
                {"_id": ObjectId(resume_id)},
                resume_skills_projection
            )
            job_doc = db.jobpostings.find_one(
                {"_id": ObjectId(job_id)},
                job_skills_projection
            )
            
            # Analyze matched vs missing skills
            resume_skills = {skill.get('name', '').lower() for skill in resume_doc.get('skills', [])}
            job_skills = {skill.get('name', '').lower() for skill in job_doc.get('skills', [])}
            
            matched_skills = list(resume_skills & job_skills)
            missing_skills = list(job_skills - resume_skills)
            
            # Identify strengths
            strengths = []
            if feedback.get("skillSimilarity", 0) and feedback["skillSimilarity"] >= 0.7:
                strengths.append("Strong skills alignment")
            if feedback.get("experienceSimilarity", 0) and feedback["experienceSimilarity"] >= 0.7:
                strengths.append("Relevant work experience")
            if feedback.get("requirementSimilarity", 0) and feedback["requirementSimilarity"] >= 0.7:
                strengths.append("Meets certification requirements")
            if len(matched_skills) > len(job_skills) * 0.7:
                strengths.append(f"Matches {len(matched_skills)} of {len(job_skills)} required skills")
            
            # Identify improvements
            improvements = []
            if feedback.get("skillSimilarity", 0) is not None and feedback["skillSimilarity"] < 0.5:
                improvements.append("Develop more relevant technical skills")
            if feedback.get("experienceSimilarity", 0) is not None and feedback["experienceSimilarity"] < 0.5:
                improvements.append("Gain more experience in similar roles")
            if missing_skills:
                top_missing = missing_skills[:3]
                improvements.append(f"Consider learning: {', '.join(top_missing)}")
            if len(job_skills) > 0 and len(matched_skills) < len(job_skills) * 0.5:
                improvements.append(f"Only {len(matched_skills)} of {len(job_skills)} required skills match")
            
            # Update feedback
            feedback["matchedSkills"] = matched_skills
            feedback["missingSkills"] = missing_skills
            feedback["strengths"] = strengths
            feedback["improvements"] = improvements
            
            # Add percentage scores
            feedback["matchPercentage"] = round(feedback["totalScore"] * 100, 2)
            feedback["skillMatchPercentage"] = round((feedback.get("skillSimilarity", 0) or 0) * 100, 2)
            feedback["experienceMatchPercentage"] = round((feedback.get("experienceSimilarity", 0) or 0) * 100, 2)
            feedback["requirementMatchPercentage"] = round((feedback.get("requirementSimilarity", 0) or 0) * 100, 2)
            
            # Add recommendation level
            total_percentage = feedback["matchPercentage"]
            if total_percentage >= 80:
                feedback["recommendationLevel"] = "Excellent Match"
            elif total_percentage >= 65:
                feedback["recommendationLevel"] = "Good Match"
            elif total_percentage >= 50:
                feedback["recommendationLevel"] = "Fair Match"
            else:
                feedback["recommendationLevel"] = "Poor Match"
            
            return feedback
            
        except Exception as e:
            return {
                "error": f"Error in compare_with_detailed_feedback: {str(e)}",
                "traceback": traceback.format_exc(),
                "resume_id": resume_id,
                "job_id": job_id
            }
"""
Service for calculating similarities between resumes and jobs.

=== PYTORCH & SIMILARITY QUICK REFERENCE ===
For quick lookup when switching between frontend/backend/ML work:

PyTorch Tensor Methods:
- tensor.flatten(): Converts multi-dimensional tensor to 1D (e.g., [2, 3] → [6])
- tensor.unsqueeze(dim): Adds dimension at position (e.g., [768] → [1, 768])
- tensor.item(): Extracts scalar value from single-element tensor (returns Python float)
- Tensors must be same shape for similarity calculations

F.cosine_similarity():
- Calculates cosine similarity between two tensors
- Formula: dot(A,B) / (norm(A) * norm(B))
- Raw output range: -1 (opposite) to 1 (identical)
- We normalize to 0-1 range: (similarity + 1) / 2
- Requires tensors with batch dimension: [batch_size, features]

Why These Operations Matter:
- flatten(): Ensures tensors are 1D regardless of original shape
- unsqueeze(0): Adds batch dimension required by F.cosine_similarity
- Normalization to 0-1: Makes scores more intuitive (0% to 100% match)
- max/min clamping: Handles floating point errors that might go slightly outside 0-1

Common Pattern:
    tensor1 = tensor1.flatten()           # [2, 384] → [768]
    tensor1 = tensor1.unsqueeze(0)        # [768] → [1, 768]
    similarity = F.cosine_similarity(t1, t2).item()  # Returns float
"""
import torch
import torch.nn.functional as F
from typing import Optional, NamedTuple
import logging

logger = logging.getLogger(__name__)

class SimilarityScore(NamedTuple):
    """Container for similarity calculation results."""
    skills_similarity: float
    experience_similarity: float
    overall_score: float
    # requirements_similarity: float (Add later once user preferences are implemented)
    # location_similarity: float (Add later once location api is implemented)
    

class SimilarityWeights(NamedTuple):
    """Weights for different similarity components."""
    skills: float = 0.65
    experience: float = 0.35
    # requirements: float = 0.25 (Add later once user preferences are implemented)
    # location: float = 0.15 (Add later once location api is implemented)

class SimilarityService:
    """Handles similarity calculations between resumes and jobs."""
    
    @staticmethod
    def cosine_similarity(tensor1: Optional[torch.Tensor], 
                         tensor2: Optional[torch.Tensor]) -> float:
        """
        Calculate cosine similarity between two tensors.
        
        Args:
            tensor1: First embedding tensor
            tensor2: Second embedding tensor
            
        Returns:
            Cosine similarity score (0-1), or 0.0 if either tensor is None
        """
        if tensor1 is None or tensor2 is None:
            return 0.0
        
        try:
            # Convert to tensor if needed
            if not isinstance(tensor1, torch.Tensor):
                tensor1 = torch.tensor(tensor1)
            if not isinstance(tensor2, torch.Tensor):
                tensor2 = torch.tensor(tensor2)
            
            # Ensure tensors are on same device and have correct shape
            tensor1 = tensor1.flatten()
            tensor2 = tensor2.flatten()
            
            # Calculate cosine similarity using PyTorch's built-in function
            similarity = F.cosine_similarity(
                tensor1.unsqueeze(0), 
                tensor2.unsqueeze(0)
            ).item()
            
            return max(0.0, min(1.0, similarity))
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    @staticmethod
    def calculate_resume_job_similarity(
        resume_embeddings,
        job_embeddings,
        weights: Optional[SimilarityWeights] = None
    ) -> SimilarityScore:
        """
        Calculate similarity between a resume and job posting.
        
        Matches the logic from compare_resume_to_job:
        - Skills: resume.skills vs job.skills
        - Experience: resume.work_experience vs job.title
        - Requirements: resume.certifications vs job.requirements
        
        Args:
            resume_embeddings: ResumeEmbeddings object with skills, work_experience, certifications
            job_embeddings: JobEmbeddings object with skills, title, requirements
            weights: Optional custom weights (default: skills=0.65, experience=0.35)
            
        Returns:
            SimilarityScore containing individual and overall scores
        """
        if weights is None:
            weights = SimilarityWeights()
        
        # 1. Skill Similarity: resume.skills vs job.skills
        skill_similarity = SimilarityService.cosine_similarity(
            resume_embeddings.skills,
            job_embeddings.skills
        )
        
        # 2. Experience Similarity: resume.work_experience vs job.title
        experience_similarity = SimilarityService.cosine_similarity(
            resume_embeddings.work_experience,
            job_embeddings.title
        )
        
        # 3. Requirements Similarity: resume.certifications vs job.requirements
        requirement_similarity = SimilarityService.cosine_similarity(
            resume_embeddings.certifications,
            job_embeddings.requirements
        )
        
        # Calculate weighted total score (only using skills and experience in weighted calc)
        total_score = (
            skill_similarity * weights.skills +
            experience_similarity * weights.experience
        )
        
        return SimilarityScore(
            skill_similarity=skill_similarity,
            experience_similarity=experience_similarity,
            requirement_similarity=requirement_similarity,
            total_score=total_score
        )
    
    @staticmethod
    def calculate_resume_job_similarity_with_cache(
        resume_id: str,
        job_id: str,
        cached_resume_embeddings: Optional[dict] = None,
        weights: Optional[SimilarityWeights] = None
    ) -> SimilarityScore:
        """
        Calculate similarity using cached embeddings when available.
        
        This matches your compare_resume_to_job function exactly.
        
        Args:
            resume_id: Resume ID
            job_id: Job ID
            cached_resume_embeddings: Pre-computed resume embeddings from cache
            weights: Optional custom weights
            
        Returns:
            SimilarityScore containing individual and overall scores
        """
        from config.database import db
        from bson import ObjectId
        from services.resume_service import ResumeService
        from services.job_service import JobService
        
        try:
            # Fetch resume and job
            resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
            job = db.jobpostings.find_one({"_id": ObjectId(job_id)})
            
            if not resume or not job:
                logger.error(f"Resume or job not found: {resume_id}, {job_id}")
                return SimilarityScore(0.0, 0.0, 0.0, 0.0)
            
            # Get resume embeddings (cached or calculated)
            if cached_resume_embeddings:
                mean_embeddings = cached_resume_embeddings.get('meanEmbeddings', {})
                
                # Convert cached embeddings to tensors
                resume_skills = mean_embeddings.get('skills')
                resume_work = mean_embeddings.get('workExperience')
                resume_certs = mean_embeddings.get('certifications')
                
                if resume_skills and isinstance(resume_skills, list):
                    resume_skills = torch.tensor(resume_skills)
                if resume_work and isinstance(resume_work, list):
                    resume_work = torch.tensor(resume_work)
                if resume_certs and isinstance(resume_certs, list):
                    resume_certs = torch.tensor(resume_certs)
                
                # Create ResumeEmbeddings-like object
                class CachedEmbeddings:
                    def __init__(self, skills, work, certs):
                        self.skills = skills
                        self.work_experience = work
                        self.certifications = certs
                
                resume_embeddings = CachedEmbeddings(resume_skills, resume_work, resume_certs)
            else:
                # Calculate fresh embeddings
                resume_embeddings = ResumeService.extract_embeddings(resume)
            
            # Get job embeddings
            job_embeddings = JobService.extract_job_embeddings(job)
            
            # Calculate similarities
            return SimilarityService.calculate_resume_job_similarity(
                resume_embeddings,
                job_embeddings,
                weights
            )
            
        except Exception as e:
            logger.error(f"Error in calculate_resume_job_similarity_with_cache: {e}")
            return SimilarityScore(0.0, 0.0, 0.0, 0.0)
    
    @staticmethod
    def batch_calculate_similarities(
        resume_embeddings,
        job_embeddings_list: list,
        weights: Optional[SimilarityWeights] = None
    ) -> list[SimilarityScore]:
        """
        Calculate similarities between one resume and multiple jobs.
        
        Args:
            resume_embeddings: ResumeEmbeddings object
            job_embeddings_list: List of JobEmbeddings objects
            weights: Optional custom weights
            
        Returns:
            List of SimilarityScore objects, one per job
        """
        scores = []
        
        for job_emb in job_embeddings_list:
            score = SimilarityService.calculate_resume_job_similarity(
                resume_embeddings,
                job_emb,
                weights
            )
            scores.append(score)
        
        return scores
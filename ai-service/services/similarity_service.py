"""
Pure-compute similarity utilities.

ARCHITECTURE NOTE:
    Zero DB access. Accepts pre-populated embedding dicts (float[] or None)
    as received from Node.js. All DB fetching belongs to the Node layer.

Cosine similarity quick reference:
    F.cosine_similarity(a, b) → range [-1, 1]
    We clamp to [0, 1] — negative similarity isn't meaningful for embeddings.
    unsqueeze(0) adds the batch dimension F.cosine_similarity expects: [features] → [1, features]
"""

import torch
import torch.nn.functional as F
from typing import Optional, NamedTuple
import logging

logger = logging.getLogger(__name__)


class SimilarityScore(NamedTuple):
    """Scores returned by calculate_similarity()."""
    skill_similarity:       float
    experience_similarity:  float
    requirement_similarity: float
    total_score:            float


class SimilarityWeights(NamedTuple):
    """Relative weights for the weighted total score."""
    skills:     float = 0.65
    experience: float = 0.35
    # requirements: float = 0.25  — add once user preferences are implemented
    # location:     float = 0.15  — add once location API is implemented


class SimilarityService:
    """Cosine similarity calculations between resume and job embeddings."""

    @staticmethod
    def _to_tensor(value) -> Optional[torch.Tensor]:
        """Convert a float list or existing tensor to a torch.Tensor, or return None."""
        if value is None:
            return None
        if isinstance(value, torch.Tensor):
            return value
        if isinstance(value, list) and value:
            return torch.tensor(value, dtype=torch.float32)
        return None

    @staticmethod
    def cosine_similarity(
        tensor1: Optional[torch.Tensor],
        tensor2: Optional[torch.Tensor],
    ) -> float:
        """
        Cosine similarity between two embedding tensors, clamped to [0, 1].

        Returns 0.0 if either tensor is None or an error occurs.
        """
        if tensor1 is None or tensor2 is None:
            return 0.0

        try:
            if not isinstance(tensor1, torch.Tensor):
                tensor1 = torch.tensor(tensor1, dtype=torch.float32)
            if not isinstance(tensor2, torch.Tensor):
                tensor2 = torch.tensor(tensor2, dtype=torch.float32)

            # flatten() handles any accidental shape mismatches (e.g. [2, 384] → [768])
            # unsqueeze(0) adds the batch dim F.cosine_similarity requires: [768] → [1, 768]
            similarity = F.cosine_similarity(
                tensor1.flatten().unsqueeze(0),
                tensor2.flatten().unsqueeze(0),
            ).item()

            return max(0.0, min(1.0, similarity))

        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0

    @staticmethod
    def calculate_similarity(
        resume_embeddings: dict,
        job_embeddings: dict,
        weights: Optional[SimilarityWeights] = None,
    ) -> SimilarityScore:
        """
        Calculate weighted similarity between a resume and a job posting.

        Embedding mappings:
            skills_similarity:       resume.skills       ↔ job.skills
            experience_similarity:   resume.workExperience ↔ job.title
            requirement_similarity:  resume.certifications ↔ job.requirements

        Args:
            resume_embeddings: { "skills": float[], "workExperience": float[], "certifications": float[] }
            job_embeddings:    { "skills": float[], "title": float[], "requirements": float[] }
            weights:           Optional custom weights; defaults to skills=0.65, experience=0.35.

        Returns:
            SimilarityScore with per-component scores and a weighted total.
        """
        if weights is None:
            weights = SimilarityWeights()

        to_tensor = SimilarityService._to_tensor

        skill_similarity = SimilarityService.cosine_similarity(
            to_tensor(resume_embeddings.get("skills")),
            to_tensor(job_embeddings.get("skills")),
        )
        experience_similarity = SimilarityService.cosine_similarity(
            to_tensor(resume_embeddings.get("workExperience")),
            to_tensor(job_embeddings.get("title")),
        )
        requirement_similarity = SimilarityService.cosine_similarity(
            to_tensor(resume_embeddings.get("certifications")),
            to_tensor(job_embeddings.get("requirements")),
        )

        total_score = (
            skill_similarity       * weights.skills +
            experience_similarity  * weights.experience
        )

        return SimilarityScore(
            skill_similarity=skill_similarity,
            experience_similarity=experience_similarity,
            requirement_similarity=requirement_similarity,
            total_score=total_score,
        )

    @staticmethod
    def calculate_similarity_batch(
        resume_embeddings: dict,
        job_embeddings_list: list[dict],
        weights: Optional[SimilarityWeights] = None,
    ) -> list[SimilarityScore]:
        """
        Calculate similarity between one resume and multiple jobs.

        Args:
            resume_embeddings:   Same shape as calculate_similarity().
            job_embeddings_list: List of job embedding dicts.
            weights:             Optional custom weights.

        Returns:
            One SimilarityScore per job, in the same order as job_embeddings_list.
        """
        return [
            SimilarityService.calculate_similarity(resume_embeddings, job_embeddings, weights)
            for job_embeddings in job_embeddings_list
        ]
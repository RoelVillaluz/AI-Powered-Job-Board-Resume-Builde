"""
Service for resume-related operations.

ARCHITECTURE NOTE:
    PURE COMPUTE (extract_embeddings)
    Receives a fully hydrated resume dict AND pre-fetched embedding docs
    from Node. Zero DB access. Returns embeddings + backfill candidates
    so Node can write null-embedding updates back.
"""

from typing import Optional, NamedTuple
import torch
import logging
from infrastructure.embeddings.embedding_orchestrator import extract_embeddings_parallel
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
    # Backfill candidates — Node writes these back to DB
    skill_ids_to_backfill: list[str]
    skill_embeddings_to_backfill: list[torch.Tensor]
    job_title_id_to_backfill: Optional[str]
    location_id_to_backfill: Optional[str]


class ResumeService:
    """Handles resume embedding extraction."""

    @staticmethod
    def extract_embeddings(
        resume: dict,
        skill_docs: list[dict],
        job_title_doc: Optional[dict],
        location_doc: Optional[dict],
        work_experience_title_docs: list[dict],
    ) -> ResumeEmbeddings:
        """
        Extract embeddings from a resume using pre-fetched market documents.

        All DB lookups happen on the Node side before this is called.
        This method is pure compute — it only runs the embedding model
        and returns vectors + backfill candidates.

        Args:
            resume:                     Full or job-relevant resume dict.
            skill_docs:                 Pre-fetched skill docs (with embeddings)
                                        for all skills listed on the resume.
                                        Each: { _id, name, embedding | null, ... }
            job_title_doc:              Pre-fetched job title doc for resume.jobTitle,
                                        or None if not in DB.
                                        Shape: { _id, title, embedding | null }
            location_doc:               Pre-fetched location doc for resume.location,
                                        or None if not in DB.
                                        Shape: { _id, name, embedding | null }
            work_experience_title_docs: Pre-fetched job title docs for each entry
                                        in resume.workExperience[].jobTitle.
                                        Same shape as job_title_doc.

        Returns:
            ResumeEmbeddings with all tensors and backfill candidates.
        """
        result = extract_embeddings_parallel(
            entity_type="resume",
            entity_id=resume.get("_id"),
            resume=resume,
            skill_docs=skill_docs,
            job_title_doc=job_title_doc,
            location_doc=location_doc,
            work_experience_title_docs=work_experience_title_docs,
        )

        total_exp = calculate_total_experience(resume.get("workExperience", []))

        return ResumeEmbeddings(
            skills=result["skills"],
            job_title=result["job_title"],
            location=result["location"],
            work_experience=result["work_experience"],
            certifications=result["certifications"],
            total_experience_years=total_exp,
            skill_ids_to_backfill=result.get("skill_ids_to_backfill", []),
            skill_embeddings_to_backfill=result.get("skill_embeddings_to_backfill", []),
            job_title_id_to_backfill=result.get("job_title_id_to_backfill"),
            location_id_to_backfill=result.get("location_id_to_backfill"),
        )

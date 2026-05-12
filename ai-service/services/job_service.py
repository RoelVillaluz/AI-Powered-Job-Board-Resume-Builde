"""
Service for job posting related operations.

ARCHITECTURE NOTE:
    PURE COMPUTE   (extract_embeddings) — receives pre-fetched docs from Node,
    zero DB access, returns embeddings only.
"""

from typing import Optional, NamedTuple
import torch
from bson import ObjectId
import logging
from config.database import db
from infrastructure.embeddings.embedding_orchestrator import extract_embeddings_parallel

logger = logging.getLogger(__name__)


class JobEmbeddings(NamedTuple):
    """Container for job posting embeddings."""
    skills: Optional[torch.Tensor]
    requirements: Optional[torch.Tensor]
    experience_level: Optional[torch.Tensor]
    job_title: Optional[torch.Tensor]
    location: Optional[torch.Tensor]
    # Backfill candidates — Node writes these back to DB
    skill_ids_to_backfill: list[str]
    skill_embeddings_to_backfill: list[torch.Tensor]
    job_title_id_to_backfill: Optional[str]
    location_id_to_backfill: Optional[str]

class JobService:
    """Handles job posting embedding extraction."""

    @staticmethod
    def extract_embeddings(
        job: dict,
        skill_docs: list[dict],
        job_title_doc: Optional[dict],
        location_doc: Optional[dict],
    ) -> JobEmbeddings:
        """
        Extract embeddings from a job posting using pre-fetched market documents.

        All DB lookups happen on the Node side before this is called.

        Args:
            job:           Job posting dict (from get_job_relevant_fields or full doc).
            skill_docs:    Pre-fetched skill docs for all skills listed on the job.
                           Each: { _id, name, embedding | null, ... }
            job_title_doc: Pre-fetched job title doc for job.title, or None.
                           Shape: { _id, title, embedding | null }
            location_doc:  Pre-fetched location doc for job.location, or None.
                           Shape: { _id, name, embedding | null }

        Returns:
            JobEmbeddings with all computed tensors.
        """
        result = extract_embeddings_parallel(
            entity_type   = "job_posting",
            entity_id     = job.get("_id"),
            job           = job,
            skill_docs    = skill_docs,
            job_title_doc = job_title_doc,
            location_doc  = location_doc,
        )

        return JobEmbeddings(
            skills=                      result["skills"],
            requirements=                result["requirements"],
            experience_level=            result["experience_level"],
            job_title=                   result["job_title"],
            location=                    result["location"],
            skill_ids_to_backfill=       result.get("skill_ids_to_backfill", []),
            skill_embeddings_to_backfill=result.get("skill_embeddings_to_backfill", []),
            job_title_id_to_backfill=    result.get("job_title_id_to_backfill"),
            location_id_to_backfill=     result.get("location_id_to_backfill"),
        )

    @staticmethod
    def extract_job_embeddings(
        job: dict,
        skill_docs: list[dict],
        job_title_doc: Optional[dict],
        location_doc: Optional[dict],
    ) -> JobEmbeddings:
        """
        Alias for extract_embeddings — kept for backwards compatibility.
        Prefer calling extract_embeddings directly in new code.
        """
        return JobService.extract_embeddings(job, skill_docs, job_title_doc, location_doc)
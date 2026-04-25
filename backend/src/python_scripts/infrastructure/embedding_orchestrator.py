"""
Parallel embedding orchestration for resume and job documents.

Responsibility: coordinate concurrent execution of independent embedding
extraction tasks using a thread pool. Each section (skills, workExperience,
etc.) is submitted as its own future, overlapping DB lookups and model
inference that would otherwise run sequentially.

This module does NOT know how to compute any individual embedding —
that stays in embedding_utils. It only knows what tasks to run and
how to collect their results.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
import torch
import logging

from utils.embedding_utils import (
    extract_skills_embeddings,
    extract_work_experience_embeddings,
    extract_certification_embeddings,
    extract_job_title_embedding,
    extract_location_embedding,
    extract_requirement_embeddings,
    extract_experience_level_embedding,
)

logger = logging.getLogger(__name__)


def _collect(futures: dict) -> dict:
    """
    Drain a {future: key} map and return {key: result}, logging any failures.
    Exceptions in individual futures are caught so one failing section
    does not abort the rest.
    """
    results = {}
    for future, key in futures.items():
        try:
            results[key] = future.result()
        except Exception as e:
            logger.error(f"Embedding task '{key}' failed: {e}", exc_info=True)
            results[key] = None
    return results


def extract_resume_embeddings_parallel(resume: dict) -> dict:
    """
    Extract all resume embedding sections concurrently.

    Submits five independent tasks to a thread pool:
      - skills          → (tensor, backfill_ids)
      - workExperience  → tensor
      - certifications  → tensor
      - jobTitle        → (tensor, backfill_id)
      - location        → (tensor, backfill_id)

    DB lookups and model fallbacks inside each task release the GIL,
    so threads overlap meaningfully even under CPython.

    Args:
        resume: Full resume document dict from MongoDB.

    Returns:
        dict with keys:
            skills              (Optional[torch.Tensor])
            skill_backfill_ids  (list[str])
            work_experience     (Optional[torch.Tensor])
            certifications      (Optional[torch.Tensor])
            job_title           (Optional[torch.Tensor])
            job_title_backfill  (Optional[str])
            location            (Optional[torch.Tensor])
            location_backfill   (Optional[str])
    """
    tasks = {
        "skills":         lambda: extract_skills_embeddings(resume.get("skills", [])),
        "workExperience": lambda: extract_work_experience_embeddings(resume.get("workExperience", [])),
        "certifications": lambda: extract_certification_embeddings(resume.get("certifications", [])),
        "jobTitle":       lambda: extract_job_title_embedding((resume.get("jobTitle") or {}).get("name", "")),
        "location":       lambda: extract_location_embedding((resume.get("location") or {}).get("name", "")),
    }

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fn): key for key, fn in tasks.items()}
        raw = _collect(futures)

    skills_emb, skill_backfill_ids = raw.get("skills") or (None, [])
    job_title_emb, job_title_backfill = raw.get("jobTitle") or (None, None)
    location_emb, location_backfill = raw.get("location") or (None, None)

    return {
        "skills":              skills_emb,
        "skill_backfill_ids":  skill_backfill_ids or [],
        "work_experience":     raw.get("workExperience"),
        "certifications":      raw.get("certifications"),
        "job_title":           job_title_emb,
        "job_title_backfill":  job_title_backfill,
        "location":            location_emb,
        "location_backfill":   location_backfill,
    }


def extract_job_embeddings_parallel(job: dict) -> dict:
    """
    Extract all job posting embedding sections concurrently.

    Submits five independent tasks to a thread pool:
      - skills          → tensor
      - requirements    → tensor
      - jobTitle        → (tensor, backfill_id)
      - location        → (tensor, backfill_id)
      - experienceLevel → tensor

    Args:
        job: Job posting document dict from MongoDB.

    Returns:
        dict with keys:
            skills              (Optional[torch.Tensor])
            requirements        (Optional[torch.Tensor])
            job_title           (Optional[torch.Tensor])
            job_title_backfill  (Optional[str])
            location            (Optional[torch.Tensor])
            location_backfill   (Optional[str])
            experience_level    (Optional[torch.Tensor])
    """
    tasks = {
        "skills":          lambda: extract_skills_embeddings(job.get("skills", [])),
        "requirements":    lambda: extract_requirement_embeddings(job.get("requirements", [])),
        "jobTitle":        lambda: extract_job_title_embedding((job.get("jobTitle") or {}).get("name", "")),
        "location":        lambda: extract_location_embedding((job.get("location") or {}).get("name", "")),
        "experienceLevel": lambda: extract_experience_level_embedding(job.get("experienceLevel", "")),
    }

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fn): key for key, fn in tasks.items()}
        raw = _collect(futures)

    skills_result = raw.get("skills")
    skills_emb, skill_backfill_ids = skills_result if isinstance(skills_result, tuple) else (skills_result, [])

    job_title_emb, job_title_backfill = raw.get("jobTitle") or (None, None)
    location_emb, location_backfill = raw.get("location") or (None, None)

    return {
        "skills":              skills_emb,
        "skill_backfill_ids":  skill_backfill_ids or [],
        "requirements":        raw.get("requirements"),
        "job_title":           job_title_emb,
        "job_title_backfill":  job_title_backfill,
        "location":            location_emb,
        "location_backfill":   location_backfill,
        "experience_level":    raw.get("experienceLevel"),
    }
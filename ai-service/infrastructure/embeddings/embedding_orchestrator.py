"""
Parallel embedding orchestration for resume and job documents.

Responsibility: coordinate concurrent execution of independent embedding
extraction tasks using a thread pool, and instrument each section with
timing and cache outcome via embedding_metrics.

Each section runs in its own thread, overlapping DB lookups and model
inference that would otherwise be sequential. On completion, the full
PipelineRun is persisted to stderr + MongoDB via persist_run().

This module does NOT know how to compute any individual embedding —
that stays in embedding_utils. It only knows what tasks to run,
how to collect their results, and how to measure them.
"""
import time
import logging
from concurrent.futures import ThreadPoolExecutor

from jobs.backfill.backfill_orchestrator import orchestrate_backfills
from metrics.embedding_metrics import (
    PipelineRun,
    persist_run,
)

from infrastructure.embeddings.embedding_tasks import (
    run_certifications,
    run_experience_level,
    run_job_title,
    run_location,
    run_requirements,
    run_skills,
    run_work_experience
)

logger = logging.getLogger(__name__)


def _collect(futures: dict) -> dict:
    """
    Drain a {future: key} map and return {key: result}.
    Exceptions in individual futures are caught and logged so one failing
    section does not abort the rest.
    """
    results = {}
    for future, key in futures.items():
        try:
            results[key] = future.result()
        except Exception as e:
            logger.error(f"Embedding task '{key}' failed: {e}", exc_info=True)
            results[key] = None
    return results
 
 
def extract_resume_embeddings_parallel(resume: dict, resume_id: str) -> dict:
    """
    Extract all resume embedding sections concurrently.
 
    Submits five independent tasks to a thread pool:
      - skills          → (mean tensor, backfill_ids, backfill_embeddings)
      - workExperience  → tensor
      - certifications  → tensor
      - jobTitle        → (tensor, backfill_id)
      - location        → (tensor, backfill_id)
 
    After collecting results, triggers backfill writes for any DB entries
    that had null embeddings, using the per-entity embeddings computed
    during extraction — NOT the aggregated mean.
 
    Args:
        resume:    Full resume document dict from MongoDB.
        resume_id: String ID used to tag the metrics record.
 
    Returns:
        dict with keys:
            skills              (Optional[torch.Tensor])  — mean embedding
            skill_backfill_ids  (list[str])
            work_experience     (Optional[torch.Tensor])
            certifications      (Optional[torch.Tensor])
            job_title           (Optional[torch.Tensor])
            job_title_backfill  (Optional[str])
            location            (Optional[torch.Tensor])
            location_backfill   (Optional[str])
    """
    run = PipelineRun(entity_type="resume", entity_id=resume_id)
    t0 = time.perf_counter()
 
    tasks = {
        "skills":         lambda: run_skills(resume, run),
        "workExperience": lambda: run_work_experience(resume, run),
        "certifications": lambda: run_certifications(resume, run),
        "jobTitle":       lambda: run_job_title(resume, run),
        "location":       lambda: run_location(resume, run),
    }
 
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fn): key for key, fn in tasks.items()}
        raw = _collect(futures)
 
    run.finish(total_duration_ms=(time.perf_counter() - t0) * 1000)
    persist_run(run)
 
    # --- Unpack skills (3-tuple) ---
    skills_result = raw.get("skills") or (None, [], [])
    skills_emb, skill_backfill_ids, skill_backfill_embeddings = skills_result
 
    # --- Unpack single-entity results (2-tuple) ---
    job_title_emb, job_title_backfill     = raw.get("jobTitle")  or (None, None)
    location_emb,  location_backfill      = raw.get("location")  or (None, None)
 
    # --- Backfill: write per-entity embeddings for DB entries with null embeddings ---
    # Per-skill embeddings are used here — NOT skills_emb (the mean) — so each
    # skill document gets its own correct embedding written back.
    if any([skill_backfill_ids, job_title_backfill, location_backfill]):
        orchestrate_backfills({
            "skills": {
                "skill_ids":        skill_backfill_ids,
                "skill_embeddings": skill_backfill_embeddings,
            },
            "job_title": {
                "title_id":        job_title_backfill,
                "title_embedding": job_title_emb,
            },
            "location": {
                "location_id":        location_backfill,
                "location_embedding": location_emb,
            },
        })
 
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
 
 
def extract_job_embeddings_parallel(job: dict, job_id: str) -> dict:
    """
    Extract all job posting embedding sections concurrently.
 
    Submits five independent tasks to a thread pool:
      - skills          → (mean tensor, backfill_ids, backfill_embeddings)
      - requirements    → tensor
      - jobTitle        → (tensor, backfill_id)
      - location        → (tensor, backfill_id)
      - experienceLevel → tensor
 
    Args:
        job:    Job posting document dict from MongoDB.
        job_id: String ID used to tag the metrics record.
 
    Returns:
        dict with keys:
            skills              (Optional[torch.Tensor])
            skill_backfill_ids  (list[str])
            requirements        (Optional[torch.Tensor])
            job_title           (Optional[torch.Tensor])
            job_title_backfill  (Optional[str])
            location            (Optional[torch.Tensor])
            location_backfill   (Optional[str])
            experience_level    (Optional[torch.Tensor])
    """
    run = PipelineRun(entity_type="job", entity_id=job_id)
    t0 = time.perf_counter()
 
    tasks = {
        "skills":          lambda: run_skills(job, run),
        "requirements":    lambda: run_requirements(job, run),
        "jobTitle":        lambda: run_job_title(job, run),
        "location":        lambda: run_location(job, run),
        "experienceLevel": lambda: run_experience_level(job, run),
    }
 
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fn): key for key, fn in tasks.items()}
        raw = _collect(futures)
 
    run.finish(total_duration_ms=(time.perf_counter() - t0) * 1000)
    persist_run(run)
 
    # --- Unpack skills (3-tuple) ---
    skills_result = raw.get("skills") or (None, [], [])
    skills_emb, skill_backfill_ids, skill_backfill_embeddings = skills_result
 
    # --- Unpack single-entity results (2-tuple) ---
    job_title_emb, job_title_backfill = raw.get("jobTitle")  or (None, None)
    location_emb,  location_backfill  = raw.get("location")  or (None, None)
 
    # --- Backfill ---
    if any([skill_backfill_ids, job_title_backfill, location_backfill]):
        orchestrate_backfills({
            "skills": {
                "skill_ids":        skill_backfill_ids,
                "skill_embeddings": skill_backfill_embeddings,
            },
            "job_title": {
                "title_id":        job_title_backfill,
                "title_embedding": job_title_emb,
            },
            "location": {
                "location_id":        location_backfill,
                "location_embedding": location_emb,
            },
        })
 
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
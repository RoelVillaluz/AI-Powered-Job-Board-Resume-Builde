from typing import Optional

import torch

from utils.embedding_utils import (
    extract_skills_embeddings,
    extract_work_experience_embeddings,
    extract_certification_embeddings,
    extract_job_title_embedding,
    extract_location_embedding,
    extract_requirement_embeddings,
    extract_experience_level_embedding,
)

from metrics.embedding_metrics import (
    PipelineRun,
    measure_section,
)

# ---------------------------------------------------------------------------
# Instrumented task wrappers
#
# Each wrapper:
#   1. Opens a measure_section context — starts the timer
#   2. Calls the corresponding embedding_utils function
#   3. Sets ctx["cache_outcome"] based on the result
#   4. Returns the raw result so _collect() can pass it back to the caller
#
# run is shared across threads. SectionMetrics.append() is protected by
# the GIL so no explicit lock is needed.
# ---------------------------------------------------------------------------

def run_skills(
    doc: dict, run: PipelineRun
) -> tuple[Optional[torch.Tensor], list[str], list[torch.Tensor]]:
    """
    Extract skills embeddings and record cache outcome.
 
    Cache outcome logic:
      hit      — all skills resolved from DB, no model fallback
      miss     — at least one skill went through the model
      skipped  — no skills present on the document
 
    Returns:
        Tuple of:
          - mean embedding tensor or None
          - list of skill IDs needing backfill
          - list of per-skill fallback embeddings aligned to backfill IDs
    """
    with measure_section(run, "skills") as ctx:
        result = extract_skills_embeddings(doc.get("skills", []))
 
        if result is None or result == (None, [], []):
            ctx["cache_outcome"] = "skipped"
            return None, [], []
 
        emb, backfill_ids, backfill_embeddings = result
        ctx["cache_outcome"] = "hit" if emb is not None and not backfill_ids else "miss"
 
    return emb, backfill_ids or [], backfill_embeddings or []
 
 
def run_work_experience(doc: dict, run: PipelineRun) -> Optional[torch.Tensor]:
    """
    Extract work experience embeddings and record cache outcome.
 
    Cache outcome logic:
      hit      — all job titles resolved from DB cache
      miss     — at least one job title went through the model
      skipped  — no work experience on the document
    """
    with measure_section(run, "workExperience") as ctx:
        emb = extract_work_experience_embeddings(doc.get("workExperience", []))
        ctx["cache_outcome"] = "hit" if emb is not None else "skipped"
 
    return emb
 
 
def run_certifications(doc: dict, run: PipelineRun) -> Optional[torch.Tensor]:
    """
    Extract certification embeddings and record cache outcome.
 
    Certifications always go through the model — no DB cache exists for them.
 
    Cache outcome logic:
      miss     — certifications present, model was called
      skipped  — no certifications on the document
    """
    with measure_section(run, "certifications") as ctx:
        emb = extract_certification_embeddings(doc.get("certifications", []))
        ctx["cache_outcome"] = "miss" if emb is not None else "skipped"
 
    return emb
 
 
def run_job_title(doc: dict, run: PipelineRun) -> tuple[Optional[torch.Tensor], Optional[str]]:
    """
    Extract job title embedding and record cache outcome.
 
    Cache outcome logic:
      hit           — embedding loaded from DB
      null_backfill — entity exists in DB but embedding field is null
      miss          — entity not in DB, model was called
      skipped       — no job title on the document
    """
    with measure_section(run, "jobTitle") as ctx:
        name = (doc.get("jobTitle") or {}).get("name", "")
 
        if not name:
            ctx["cache_outcome"] = "skipped"
            return None, None
 
        emb, backfill_id = extract_job_title_embedding(name)
 
        if backfill_id:
            ctx["cache_outcome"] = "null_backfill"
        elif emb is not None:
            ctx["cache_outcome"] = "hit"
        else:
            ctx["cache_outcome"] = "miss"
 
    return emb, backfill_id
 
 
def run_location(doc: dict, run: PipelineRun) -> tuple[Optional[torch.Tensor], Optional[str]]:
    """
    Extract location embedding and record cache outcome.
 
    Cache outcome logic:
      hit           — embedding loaded from DB
      null_backfill — entity exists in DB but embedding field is null
      miss          — entity not in DB, model was called
      skipped       — no location on the document
    """
    with measure_section(run, "location") as ctx:
        name = (doc.get("location") or {}).get("name", "")
 
        if not name:
            ctx["cache_outcome"] = "skipped"
            return None, None
 
        emb, backfill_id = extract_location_embedding(name)
 
        if backfill_id:
            ctx["cache_outcome"] = "null_backfill"
        elif emb is not None:
            ctx["cache_outcome"] = "hit"
        else:
            ctx["cache_outcome"] = "miss"
 
    return emb, backfill_id
 
 
def run_requirements(doc: dict, run: PipelineRun) -> Optional[torch.Tensor]:
    """
    Extract requirements embeddings and record cache outcome.
 
    Requirements always go through the model — no DB cache.
 
    Cache outcome logic:
      miss     — requirements present, model was called
      skipped  — no requirements on the document
    """
    with measure_section(run, "requirements") as ctx:
        emb = extract_requirement_embeddings(doc.get("requirements", []))
        ctx["cache_outcome"] = "miss" if emb is not None else "skipped"
 
    return emb
 
 
def run_experience_level(doc: dict, run: PipelineRun) -> Optional[torch.Tensor]:
    """
    Extract experience level embedding and record cache outcome.
 
    Experience level always goes through the model — no DB cache.
 
    Cache outcome logic:
      miss     — experience level present, model was called
      skipped  — no experience level on the document
    """
    with measure_section(run, "experienceLevel") as ctx:
        emb = extract_experience_level_embedding(doc.get("experienceLevel", ""))
        ctx["cache_outcome"] = "miss" if emb is not None else "skipped"
 
    return emb

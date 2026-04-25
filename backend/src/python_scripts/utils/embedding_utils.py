"""Utilities for embedding extraction and processing."""
import json
import torch
from typing import Optional
import logging
from services.market_services.location_services import LocationService
from services.market_services.job_title_services import JobTitleService
from services.market_services.skill_services import SkillService
from models.embeddings import embedding_model
from utils.tensor_utils import stack_embeddings, safe_mean_embedding

logger = logging.getLogger(__name__)


def extract_skills_embeddings(skills: list[dict]) -> tuple[Optional[torch.Tensor], list[str]]:
    """
    Extract mean skill embedding using cached DB embeddings.
    Falls back to model only for skills missing from DB or with null embeddings.
    All DB lookups are batched into a single query.

    Args:
        skills: List of skill dicts with 'name' field

    Returns:
        Tuple of (mean skill embedding tensor or None, list of skill IDs needing backfill)
    """
    skill_names = [skill.get("name") for skill in skills if skill.get("name")]
    if not skill_names:
        return None, []

    # Single batched DB query for all skills
    skill_docs = SkillService.get_with_embeddings_by_names(skill_names)
    skill_map = {doc.get('name'): doc for doc in skill_docs}

    embeddings = []
    missing_skills = []
    needs_backfill = []

    for skill_name in skill_names:
        skill_doc = skill_map.get(skill_name)

        if skill_doc and skill_doc.get('embedding'):
            embeddings.append(torch.tensor(skill_doc['embedding']))
        elif skill_doc and not skill_doc.get('embedding'):
            logger.warning(f"Skill '{skill_name}' found in DB but embedding is null — falling back to model")
            missing_skills.append(skill_name)
            needs_backfill.append(str(skill_doc['_id']))
        else:
            logger.warning(f"Skill '{skill_name}' not found in DB — falling back to model")
            missing_skills.append(skill_name)

    # Single batched model call for all missing skills
    if missing_skills:
        fallback_embeddings = embedding_model.encode_batch(missing_skills)
        if fallback_embeddings is not None:
            if isinstance(fallback_embeddings, torch.Tensor):
                if fallback_embeddings.dim() == 1:
                    embeddings.append(fallback_embeddings.detach().cpu())
                else:
                    embeddings.extend(emb.detach().cpu() for emb in fallback_embeddings)
            else:
                embeddings.extend(emb.detach().cpu() for emb in fallback_embeddings)

    if not embeddings:
        return None, needs_backfill

    stacked = stack_embeddings(embeddings)
    return safe_mean_embedding(stacked), needs_backfill


def extract_job_title_embedding(job_title: str) -> tuple[Optional[torch.Tensor], Optional[str]]:
    """
    Extract job title embedding using cached DB embedding.
    Falls back to model if job title not in DB.

    Args:
        job_title: Job title string (e.g., "Software Engineer")

    Returns:
        Tuple of (embedding tensor or None, job title ID to backfill or None)
    """
    if not job_title:
        return None, None

    job_title_doc = JobTitleService.get_with_embedding_by_name(job_title)

    if job_title_doc and job_title_doc.get('embedding'):
        return torch.tensor(job_title_doc['embedding']), None
    elif job_title_doc and not job_title_doc.get('embedding'):
        logger.warning(f"Job title '{job_title}' found in DB but embedding is null — falling back to model")
        needs_backfill = str(job_title_doc['_id'])
    else:
        logger.warning(f"Job title '{job_title}' not found in DB — falling back to model")
        needs_backfill = None

    embedding = embedding_model.encode(job_title)
    if embedding is None:
        return None, needs_backfill

    return embedding.detach().cpu(), needs_backfill


def extract_location_embedding(location_name: str) -> tuple[Optional[torch.Tensor], Optional[str]]:
    """
    Extract location embedding using cached DB embedding.
    Falls back to model if location not in DB.

    Args:
        location_name: Location name string (e.g., "San Francisco")

    Returns:
        Tuple of (embedding tensor or None, location ID to backfill or None)
    """
    if not location_name:
        return None, None

    location_doc = LocationService.get_with_embedding_by_name(location_name)

    if location_doc and location_doc.get("embedding"):
        return torch.tensor(location_doc['embedding']), None
    elif location_doc and not location_doc.get("embedding"):
        logger.warning(f"Location '{location_name}' found in DB but embedding is null — falling back to model")
        needs_backfill = str(location_doc['_id'])
    else:
        logger.warning(f"Location not in DB, generating embedding: {location_name}")
        needs_backfill = None

    embedding = embedding_model.encode(location_name)
    if embedding is None:
        return None, needs_backfill

    return embedding.detach().cpu(), needs_backfill


def extract_work_experience_embeddings(work_experiences: list[dict]) -> Optional[torch.Tensor]:
    """
    Extract mean work experience embedding.
    Batches all job title DB lookups into a single query instead of one per entry.
    Falls back to model (title + responsibilities) only for titles missing from DB.

    Args:
        work_experiences: List of work experience dicts with 'jobTitle' and 'responsibilities'

    Returns:
        Mean work experience embedding tensor or None
    """
    if not work_experiences:
        return None

    job_titles = [exp.get('jobTitle', '') for exp in work_experiences]

    # Single batched DB query for all job titles at once
    title_docs = JobTitleService.get_with_embeddings_by_names(job_titles)
    title_map = {doc.get('name'): doc for doc in title_docs}

    embeddings = []
    fallback_texts = []

    for exp in work_experiences:
        job_title = exp.get('jobTitle', '')
        if not job_title:
            continue

        title_doc = title_map.get(job_title)

        if title_doc and title_doc.get('embedding'):
            embeddings.append(torch.tensor(title_doc['embedding']))
        else:
            # Build fallback text: title + responsibilities
            responsibilities = exp.get('responsibilities', [])
            if responsibilities:
                resp_strings = [
                    json.dumps(r) if isinstance(r, dict) else str(r)
                    for r in responsibilities
                ]
                fallback_texts.append(f"{job_title}: {', '.join(resp_strings)}")
            else:
                fallback_texts.append(job_title)
            logger.warning(f"Job title not in DB, generating embedding: {job_title}")

    # Single batched model call for all fallback texts
    if fallback_texts:
        fallback_embeddings = embedding_model.encode_batch(fallback_texts)
        if fallback_embeddings is not None:
            if isinstance(fallback_embeddings, torch.Tensor):
                if fallback_embeddings.dim() == 1:
                    embeddings.append(fallback_embeddings.detach().cpu())
                else:
                    embeddings.extend(emb.detach().cpu() for emb in fallback_embeddings)
            else:
                embeddings.extend(emb.detach().cpu() for emb in fallback_embeddings)

    if not embeddings:
        return None

    stacked = stack_embeddings(embeddings)
    return safe_mean_embedding(stacked)


def extract_certification_embeddings(certifications: list[dict]) -> Optional[torch.Tensor]:
    """
    Extract and compute mean embedding for certifications.

    Args:
        certifications: List of certification dictionaries with 'name' field

    Returns:
        Mean certification embedding or None
    """
    certification_names = [cert.get("name") for cert in certifications if cert.get("name")]
    if not certification_names:
        return None

    embeddings = embedding_model.encode_batch(certification_names)
    return safe_mean_embedding(embeddings)


def extract_requirement_embeddings(requirements) -> Optional[torch.Tensor]:
    """
    Extract and compute mean embedding for job requirements.
    Supports both the new structured schema (dict) and old schema (list of strings).

    Args:
        requirements: dict (new schema) or list[str] (old schema)

    Returns:
        Mean requirements embedding or None
    """
    if isinstance(requirements, dict):
        extracted = [requirements['description']]

        if 'education' in requirements and isinstance(requirements['education'], str):
            extracted.append(requirements['education'])
        if 'yearsOfExperience' in requirements and isinstance(requirements['yearsOfExperience'], (int, float)):
            extracted.append(f"Years of Experience: {requirements['yearsOfExperience']}")
        if 'certifications' in requirements and isinstance(requirements['certifications'], list):
            extracted.extend(c for c in requirements['certifications'] if isinstance(c, str))

        if extracted:
            embeddings = embedding_model.encode_batch(extracted)
            return safe_mean_embedding(embeddings)

    elif isinstance(requirements, list) and all(isinstance(req, str) for req in requirements):
        embeddings = embedding_model.encode_batch(requirements)
        return safe_mean_embedding(embeddings)

    return None


def extract_experience_level_embedding(experience_level: str) -> Optional[torch.Tensor]:
    """
    Extract embedding for an experience level string.

    Args:
        experience_level: e.g. "Intern", "Mid", "Senior"

    Returns:
        Embedding tensor or None
    """
    if not experience_level:
        return None

    embedding = embedding_model.encode(experience_level)
    if embedding is None:
        return None

    return embedding.detach().cpu()
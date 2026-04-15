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

def extract_skills_embeddings(skills: list[dict]) -> Optional[torch.Tensor]:
    """
    Extract mean skill embedding using cached DB embeddings.
    Falls back to model if skill not in DB.
    
    Args:
        skills: List of skill dicts with 'name' field
        
    Returns:
        Mean skill embedding tensor or None
    """    
    skill_names = [skill.get("name") for skill in skills if skill.get("name")]
    
    if not skill_names:
        return None
    
    skill_docs = SkillService.get_with_embeddings_by_names(skill_names)
    skill_map = {doc.get('name'): doc for doc in skill_docs}
    
    embeddings = []
    missing_skills = []
    
    for skill_name in skill_names:
        skill_doc = skill_map.get(skill_name)
        
        if skill_doc and skill_doc.get('embedding'):
            embeddings.append(torch.tensor(skill_doc['embedding']))
        elif skill_doc and not skill_doc.get('embedding'):
            # ✅ Found in DB but embedding is null/missing
            logger.warning(f"Skill '{skill_name}' found in DB but embedding is null — falling back to model")
            missing_skills.append(skill_name)
        else:
            # ✅ Not found in DB at all
            logger.warning(f"Skill '{skill_name}' not found in DB — falling back to model")
            missing_skills.append(skill_name)
    
    if missing_skills:
        fallback_embeddings = embedding_model.encode_batch(missing_skills)
        
        if fallback_embeddings is not None:
            if isinstance(fallback_embeddings, torch.Tensor):
                if fallback_embeddings.dim() == 1:
                    embeddings.append(fallback_embeddings.detach().cpu())
                else:
                    for emb in fallback_embeddings:
                        embeddings.append(emb.detach().cpu())
            else:
                for emb in fallback_embeddings:
                    embeddings.append(emb.detach().cpu())
    
    if not embeddings:
        return None
    
    stacked = stack_embeddings(embeddings)
    return safe_mean_embedding(stacked)

def extract_job_title_embedding(job_title: str) -> Optional[torch.Tensor]:
    """
    Extract job title embedding using cached DB embedding.
    Falls back to model if job title not in DB.
    
    Args:
        job_title: Job title string (e.g., "Software Engineer")
        
    Returns:
        Embedding tensor or None
    """    
    if not job_title:
        return None
    
    job_title_doc = JobTitleService.get_with_embedding_by_name(job_title)
    
    if job_title_doc and job_title_doc.get('embedding'):
        return torch.tensor(job_title_doc['embedding'])
    elif job_title_doc and not job_title_doc.get('embedding'):
        # ✅ Found in DB but embedding is null/missing
        logger.warning(f"Job title '{job_title}' found in DB but embedding is null — falling back to model")
    else:
        # ✅ Not found in DB at all
        logger.warning(f"Job title '{job_title}' not found in DB — falling back to model")
    
    embedding = embedding_model.encode(job_title)
    
    if embedding is None:
        return None
    
    return embedding.detach().cpu()

def extract_location_embedding(location_name: str) -> Optional[torch.Tensor]:
    """
    Extract location embedding using cached DB embedding.
    Falls back to model if location not in DB.
    """
    if not location_name:
        return None
    
    # ✅ Try to fetch from Location collection
    location_doc = LocationService.get_with_embedding_by_name(location_name)

    if location_doc and location_doc.get("embedding"):
        return torch.tensor(location_doc['embedding'])
    
    # Fallback: Generate embedding if not found
    logger.warning(f"Location not in DB, generating embedding: {location_name}")
    embedding = embedding_model.encode(location_name)
    
    if embedding is None:
        return None
    
    return embedding.detach().cpu()

def extract_work_experience_embeddings(work_experiences: list[dict]) -> Optional[torch.Tensor]:
    """
    Extract mean work experience embedding.
    Uses DB cache for job titles, generates for responsibilities.
    """
    if not work_experiences:
        return None
    
    embeddings = []
    
    for exp in work_experiences:
        job_title = exp.get('jobTitle', '')
        if not job_title:
            continue
        
        responsibilities = exp.get('responsibilities', [])
        
        # Try to use cached job title embedding
        job_title_doc = JobTitleService.get_with_embedding_by_name(job_title)
        
        if job_title_doc and job_title_doc.get('embedding'):
            # Use cached job title embedding
            embeddings.append(torch.tensor(job_title_doc['embedding']))
        else:
            # Fallback: Generate embedding for job title + responsibilities
            if responsibilities:
                resp_strings = []
                for r in responsibilities:
                    if isinstance(r, dict):
                        resp_strings.append(json.dumps(r))
                    else:
                        resp_strings.append(str(r))
                text = f"{job_title}: {', '.join(resp_strings)}"
            else:
                text = job_title
            
            logger.warning(f"Job title not in DB, generating embedding: {job_title}")
            embedding = embedding_model.encode(text)
            if embedding is not None:
                embeddings.append(embedding.detach().cpu())
    
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

    Args:
        requirements: Job requirements in a dictionary (new schema) or a list of strings (old schema).
        
    Returns:
        Mean requirements embedding or None
    """
    # Case 1: If the requirements are in the new schema (dict)
    if isinstance(requirements, dict):
        extracted_requirements = []

        # Extract description, education, yearsOfExperience, and certifications

        extracted_requirements = [requirements['description']] # Description is always a required field

        if 'education' in requirements and isinstance(requirements['education'], str):
            extracted_requirements.append(requirements['education'])
        if 'yearsOfExperience' in requirements and isinstance(requirements['yearsOfExperience'], (int, float)):
            extracted_requirements.append(f"Years of Experience: {requirements['yearsOfExperience']}")
        if 'certifications' in requirements and isinstance(requirements['certifications'], list):
            for cert in requirements['certifications']:
                if isinstance(cert, str):
                    extracted_requirements.append(cert)

        # If we have any extracted requirements, compute the embeddings
        if extracted_requirements:
            embeddings = embedding_model.encode_batch(extracted_requirements)
            return safe_mean_embedding(embeddings)

    # Case 2: If the requirements are already a list of strings (old schema)
    elif isinstance(requirements, list) and all(isinstance(req, str) for req in requirements):
        # Compute embeddings directly from the list of strings
        embeddings = embedding_model.encode_batch(requirements)
        return safe_mean_embedding(embeddings)

    # If the requirements format is invalid, return None
    return None

def extract_experience_level_embedding(experience_level: str) -> Optional[torch.Tensor]:
    """
    Extract embedding for an experience level using the embedding model.
    Consistent with other embedding extraction utilities.
    
    Args:
        experience_level: Experience level string, e.g., "Intern"
    
    Returns:
        Embedding tensor or None
    """
    if not experience_level:
        return None

    embedding = embedding_model.encode(experience_level)
    if embedding is None:
        return None
    
    return embedding.detach().cpu()
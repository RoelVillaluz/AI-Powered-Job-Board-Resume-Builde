"""Utilities for embedding extraction and processing."""
import json
import torch
from typing import Optional
import logging
from models.embeddings import embedding_model
from utils.tensor_utils import stack_embeddings, safe_mean_embedding

logger = logging.getLogger(__name__)

def extract_skills_embeddings(skills: list[dict]) -> Optional[torch.Tensor]:
    """
        Extract and compute mean skill embedding of skills

        Args:
            skills: List of skills dictionaries with 'name' field

        Returns:
            Mean skill embedding or None
    """
    skill_names = [skill.get("name") for skill in skills if skill.get("name")]

    if not skill_names:
        return None
    
    embeddings = embedding_model.encode_batch(skill_names)
    return safe_mean_embedding(embeddings)

def extract_work_experience_embeddings(work_experiences: list[dict]) -> Optional[torch.Tensor]:
    """
        Extract and compute mean embedding for work experiences.
        
        Args:
            work_experiences: List of work experience dictionaries
            
        Returns:
            Mean work experience embedding or None
    """
    experience_texts = []

    for exp in work_experiences:
        job_title = exp.get('jobTitle', '')
        if not job_title:
            continue

        responsibilities = exp.get('responsibilities', [])

        if responsibilities:
            # Convert responsibilities to strings, handling dicts and other types
            resp_strings = []
            for r in responsibilities:
                if isinstance(r, dict):
                    resp_strings.append(json.dumps(r))
                else:
                    resp_strings.append(str(r))

            text = f"{job_title}: {', '.join(resp_strings)}"
        else:
            text = job_title

        experience_texts.append(text)
        
    if not experience_texts:
        return None
    
    embeddings = embedding_model.encode_batch(experience_texts)
    return safe_mean_embedding(embeddings)

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
        if 'description' in requirements and isinstance(requirements['description'], str):
            extracted_requirements.append(requirements['description'])
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
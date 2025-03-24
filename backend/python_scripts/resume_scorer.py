import datetime
import json
import os
import sys
from bson import ObjectId
from dotenv import load_dotenv
import numpy as np
import pymongo
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer
from torch import cosine_similarity
import torch
from utils import get_embedding

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]
model = SentenceTransformer('all-mpnet-base-v2')

def get_embedding(text):
    """ Generates an embedding and ensures it's a PyTorch tensor. """
    return torch.tensor(model.encode(text, convert_to_numpy=True), dtype=torch.float32)

def evaluate_resume_relevance(resume):
    """
    Computes a relevance score indicating how well the resume's work experience aligns with its listed skills.
    
    The function generates embeddings for skills, work experience, summary, and certifications, then calculates 
    a similarity score to determine how relevant the work experience is to the provided skills.

    Returns:
        float: A relevance score (0-100) representing the alignment between skills and work experience.
    """
    
    skills = [skill["name"] for skill in resume.get("skills", []) if skill.get('name')]
    work_experiences = [
        f"{exp['jobTitle']} at {exp['company']}. {exp['responsibilities']}"
        for exp in resume.get("workExperience", [])
        if exp.get('jobTitle') and exp.get('responsibilities')
    ]
    certifications = [certification["name"] for certification in resume.get("certifications", [])]

    if not skills or not work_experiences:
        return 0  # No skills or work experience means no relevance.

    # Compute embeddings
    skill_embeddings = torch.stack([get_embedding(skill) for skill in skills])
    work_embeddings = torch.stack([get_embedding(exp) for exp in work_experiences])

    summary_embedding = get_embedding(resume.get("summary", "")).squeeze()  # Ensure correct shape
    certification_embeddings = (
        torch.stack([get_embedding(cert) for cert in certifications]).mean(dim=0)
        if certifications else None
    )

    # Compute means
    mean_skill_embedding = torch.mean(skill_embeddings, dim=0)
    mean_work_embedding = torch.mean(work_embeddings, dim=0)

    # Combine embeddings safely
    all_embeddings = [mean_skill_embedding, mean_work_embedding, summary_embedding]
    if certification_embeddings is not None:
        all_embeddings.append(certification_embeddings)

    # Stack and compute final embedding
    final_embedding = torch.mean(torch.stack(all_embeddings), dim=0)

    # Compute similarity score
    similarity_score = torch.cosine_similarity(mean_skill_embedding.unsqueeze(0), final_embedding.unsqueeze(0)).item()
    relevance_score = similarity_score * 100  # Scale to percentage

    return round(relevance_score, 2)










# Example resumes
resume_example = {
    "summary": "Experienced data scientist skilled in Python and ML.",
    "skills": [{"name": "Python"}, {"name": "Machine Learning"}],
    "workExperience": [
        {"jobTitle": "Data Scientist", "company": "Tech Corp", "responsibilities": "Developed ML models and data pipelines."},
        {"jobTitle": "Software Engineer", "company": "Code Inc.", "responsibilities": "Built backend APIs using Python and Django."}
    ],
    "certifications": [{"name": "AWS Certified Machine Learning", "year": "2023"}]
}

resume_weak_example = {
    "summary": "I am a hardworking individual with experience in customer service.",
    "skills": [{"name": "JavaScript"}, {"name": "React"}, {"name": "Node.js"}],
    "workExperience": [
        {"jobTitle": "Barista", "company": "Coffee Haven", "responsibilities": "Prepared coffee, managed inventory, and provided customer service."},
        {"jobTitle": "Waiter", "company": "Fine Dine Restaurant", "responsibilities": "Served customers, handled payments, and ensured customer satisfaction."}
    ],
    "certifications": [{"name": "Food Safety Certification", "year": "2022"}]
}

print(evaluate_resume_relevance(resume_example))  # High score
print(evaluate_resume_relevance(resume_weak_example))  # Low score
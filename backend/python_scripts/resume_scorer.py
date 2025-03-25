import json
import os
import sys
from dotenv import load_dotenv
import pymongo
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer
from torch import cosine_similarity
import torch
from utils import get_resume_by_id

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


def calculate_resume_score(resume):
    """
    Calculates a resume score based on completeness and relevance.

    Completeness measures how much of the resume is filled out.
    Relevance measures how well the work experience aligns with skills.

    Returns:
        float: A final score (0-100).
    """

    COMPLETENESS_WEIGHT = 0.6
    RELEVANCE_WEIGHT = 0.4

    # Check completeness
    required_fields = [
        resume.get("firstName"),
        resume.get("lastName"),
        resume.get("phone"),
        resume.get("address"),
        resume.get("summary"),
    ]
    
    key_sections = [
        resume.get("skills"),
        resume.get("workExperience"),
        resume.get("certifications"),
    ]

    social_media = resume.get("socialMedia", {})
    has_socials = any(social_media.values())  # At least one social media link

    # Compute completeness score
    filled_sections = sum(bool(field) for field in required_fields + key_sections) + has_socials
    total_sections = len(required_fields) + len(key_sections) + 1  # +1 for social media presence

    completeness_score = (filled_sections / total_sections) * 100

    # Get relevance score
    relevance_score = evaluate_resume_relevance(resume)

    # Compute weighted final score
    final_score = (completeness_score * COMPLETENESS_WEIGHT) + (relevance_score * RELEVANCE_WEIGHT)

    return round(final_score, 2)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing resumeId"}))
        sys.exit(1)

    resume_id = sys.argv[1]
    
    # Fetch resume data (Replace with actual data retrieval)
    resume = get_resume_by_id(resume_id)  

    if not resume:
        print(json.dumps({"error": "Resume not found"}))
        sys.exit(1)

    score = calculate_resume_score(resume)
    print(json.dumps({"score": score}))
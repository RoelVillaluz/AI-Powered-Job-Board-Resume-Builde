import json
import os
import sys
from dotenv import load_dotenv
import pymongo
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer
from torch import cosine_similarity
import torch
from utils import extract_resume_embeddings, get_embedding, get_resume_by_id

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def evaluate_resume_relevance(resume):
    """
    Computes a relevance score indicating how well the resume's work experience aligns with its listed skills.
    
    The function generates embeddings for skills, work experience, summary, and certifications, then calculates 
    a similarity score to determine how relevant the work experience is to the provided skills.

    Returns:
        float: A relevance score (0-100) representing the alignment between skills and work experience.
    """
    # Extract resume embeddings for skills, work experience, and certifications
    mean_skill_embedding, mean_work_embedding, certification_embeddings = extract_resume_embeddings(resume)
    
    # Check if the skill embedding is None, and return 0 relevance score if so
    if mean_skill_embedding is None:
        return 0  # No valid skill embedding, so no relevance score

    # Get summary embedding
    summary_embedding = get_embedding(resume.get("summary", "")).squeeze()  # Ensure correct shape

    # Combine embeddings safely, filter out None values
    all_embeddings = [emb for emb in [mean_skill_embedding, mean_work_embedding, summary_embedding, certification_embeddings] if emb is not None]

    if not all_embeddings:
        return 0  # If no valid embeddings are found, return 0 relevance score

    # Stack and compute final embedding
    final_embedding = torch.mean(torch.stack(all_embeddings), dim=0)

    # Compute similarity score (only if mean_skill_embedding and final_embedding are valid)
    if final_embedding is not None:
        similarity_score = torch.cosine_similarity(mean_skill_embedding.unsqueeze(0), final_embedding.unsqueeze(0)).item()
        relevance_score = similarity_score * 100  # Scale to percentage
    else:
        relevance_score = 0

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
        ("firstName", 10),
        ("lastName", 10),
        ("address", 10),
        ("phone", 10),
        ("summary", 15),
    ]

    key_sections = [
        ("skills", 20),
        ("workExperience", 20),
        ("certifications", 10)
    ]

    social_media_weight = 5

    # Compute completeness score
    completeness_score = sum(weight for field, weight in required_fields if resume.get(field))
    completeness_score += sum(weight for section, weight in key_sections if resume.get(section))
    completeness_score += social_media_weight if any(resume.get("socialMedia", {}).values()) else 0

    relevance_score = evaluate_resume_relevance(resume)

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
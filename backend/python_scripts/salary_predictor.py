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
from utils import cluster_job_postings, extract_job_embeddings, extract_resume_embeddings, get_embedding, get_resume_by_id

load_dotenv()

mongo_uri = os.getenv('MONGO_DEV_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def predict_salary(resume, job_postings):
    """ 
    Predicts the estimated salary for a given resume based on similar job postings.
    """
    # Unpack all four values that extract_resume_embeddings returns
    result = extract_resume_embeddings(resume)
    if result is None:
        return json.dumps({"error": "Failed to extract embeddings from resume"})

    mean_skill_embedding, mean_work_embedding, certification_embedding, *_ = result

    if mean_skill_embedding is None:
        return json.dumps({"error": "Not enough data to predict salary."})

    valid_embeddings = [emb for emb in [mean_skill_embedding, mean_work_embedding] if emb is not None]
    if not valid_embeddings:
        return json.dumps({"error": "Not enough valid embeddings."})

    resume_embedding = torch.mean(torch.stack(valid_embeddings), dim=0)

    similarities = []
    salaries = []

    for job in job_postings:
        job_embedding_result = extract_job_embeddings(job)
        
        # Check if any embeddings are None
        if job_embedding_result is None:
            continue
            
        mean_skill_emb, mean_req_emb, exp_emb, job_title_emb, loc_emb = job_embedding_result
        
        # Create a list of valid embeddings
        valid_job_embeddings = [emb for emb in [mean_skill_emb, mean_req_emb, exp_emb] 
                               if emb is not None and emb.numel() > 0]
        
        # Skip if no valid embeddings
        if not valid_job_embeddings:
            continue
            
        job_embedding = torch.mean(torch.stack(valid_job_embeddings), dim=0)

        if resume_embedding.dim() == 0 or job_embedding.dim() == 0:
            continue  # Skip instead of returning an error

        similarity = torch.nn.functional.cosine_similarity(
            resume_embedding.unsqueeze(0), 
            job_embedding.unsqueeze(0)
        ).item()

        # Only add to calculations if job has a valid salary
        if job.get("salary") and job["salary"].get("amount"):
            try:
                amount_str = str(job["salary"]["amount"]).replace(",", "")
                salary = float(amount_str)
                salaries.append(salary)
                similarities.append(similarity)
            except (ValueError, TypeError):
                # Skip salaries that can't be converted to float
                continue

    if not salaries or np.sum(similarities) == 0:
        return json.dumps({"error": "No valid similarity scores found."})

    weighted_salary = np.dot(similarities, salaries) / np.sum(similarities)
    
    return json.dumps({"predictedSalary": weighted_salary})


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing resumeId"}))
        sys.exit(1)

    resume_id = sys.argv[1]

    resume = get_resume_by_id(resume_id)
    job_postings = list(db.jobpostings.find({}))  # Convert cursor to list

    if not resume:
        print(json.dumps({"error": "Resume not found"}))
        sys.exit(1)

    print(predict_salary(resume, job_postings))
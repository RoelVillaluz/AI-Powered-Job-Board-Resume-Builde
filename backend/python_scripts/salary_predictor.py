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

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def predict_salary(resume, job_postings):
    """ 
    Predicts the estimated salary for a given resume based on similar job postings.
    """
    result = extract_resume_embeddings(resume)
    if result is None:
        return json.dumps({"error": "Failed to extract embeddings from resume"})

    mean_skill_embedding, mean_work_embedding, certification_embedding = result

    if mean_skill_embedding is None:
        return json.dumps({"error": "Not enough data to predict salary."})

    valid_embeddings = [emb for emb in [mean_skill_embedding, mean_work_embedding] if emb is not None]
    if not valid_embeddings:
        return json.dumps({"error": "Not enough valid embeddings."})

    resume_embedding = torch.mean(torch.stack(valid_embeddings), dim=0)

    similarities = []
    salaries = []

    for job in job_postings:
        mean_skill_emb, mean_req_emb, exp_emb, job_title_emb, loc_emb = extract_job_embeddings(job)

        job_embedding = torch.mean(torch.stack([mean_skill_emb, mean_req_emb, exp_emb]), dim=0)

        if resume_embedding.dim() == 0 or job_embedding.dim() == 0:
            return json.dumps({"error": "One of the embeddings is 0-dimensional."})

        similarity = torch.nn.functional.cosine_similarity(resume_embedding.unsqueeze(0), job_embedding.unsqueeze(0)).item()

        if "salary" in job and job["salary"]:
            salaries.append(float(job["salary"].replace(",", "")))
            similarities.append(similarity)

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
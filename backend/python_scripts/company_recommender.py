import json
import os
import sys
from dotenv import load_dotenv
import numpy as np
import pymongo
from bson import ObjectId
from sklearn.metrics.pairwise import cosine_similarity
import torch
from utils import extract_job_embeddings, extract_resume_embeddings, get_embedding

load_dotenv()

mongo_uri = os.getenv('MONGO_DEV_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]


def extract_company_embeddings(company_id):
    company = db.companies.find_one({"_id": ObjectId(company_id)})

    if not company:
        print(f"Company with ID {company_id} not found.")
        return None, [], [], []

    # Embed the company-level description (not per-job)
    company_description_embedding = get_embedding(company.get("description", ""))

    job_skill_embeddings = []
    job_title_embeddings = []
    job_description_embeddings = []

    for job in company.get("jobs", []):
        mean_skill_embedding, _, _, title_embeddings, _ = extract_job_embeddings(job)
        job_skill_embeddings.append(mean_skill_embedding)
        job_title_embeddings.append(title_embeddings)

        job_description = job.get("description", "")
        job_description_embedding = get_embedding(job_description) if job_description else None
        job_description_embeddings.append(job_description_embedding)

    return (
        company_description_embedding,
        job_skill_embeddings,
        job_title_embeddings,
        job_description_embeddings,
    )


def recommend_companies(user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        print(f"User with ID: {user_id} not found.")
        return []
    
    resumes = db.resumes.find({"user": user["_id"]})

    resume_embeddings = [extract_resume_embeddings(resume) for resume in resumes if resume]

    if not resume_embeddings:
        print(f"No resumes found for user: {user}")
        return []
    
    # Unpack and filter out None embeddings
    mean_skill_embedding, *_ = zip(*resume_embeddings)
    resume_summary_embeddings = [get_embedding(resume["summary"]) for resume in resumes]

    mean_skill_embedding = [emb for emb in mean_skill_embedding if emb is not None]
    mean_summary_embedding = [emb for emb in resume_summary_embeddings if emb is not None]

    user_average_skill_embedding = np.mean(np.array(np.array(mean_skill_embedding)), axis=0) if mean_skill_embedding else None
    user_average_summary_embedding = np.mean(np.array(mean_summary_embedding), axis=0) if mean_summary_embedding else None

    embeddings_to_combine = [emb for emb in [user_average_skill_embedding, user_average_summary_embedding] if emb is not None]

    if not embeddings_to_combine:
        print(f"No valid user embeddings to combine.")
        return []
    
    user_combined_embedding = np.mean(np.array(embeddings_to_combine), axis=0)

    companies_in_industry = db.companies.find({"industry": user.get("industry")}) if user.get("industry") else db.companies.find({})
    recommended_companies = []

    for company in companies_in_industry:
        company_id = str(company["_id"])
        company_description_embedding, job_skill_embeddings, job_title_embeddings, job_description_embeddings = extract_company_embeddings(company_id)

        if company_description_embedding is None:
            continue

        company_all_embeddings = [company_description_embedding] + job_skill_embeddings + job_title_embeddings + job_description_embeddings
        company_all_embeddings = [emb for emb in company_all_embeddings if emb is not None]

        if not company_all_embeddings:
            continue

        company_average_embedding = np.mean(np.array(company_all_embeddings), axis=0)

        if company_average_embedding is None or user_combined_embedding is None:
            continue

        similarity_score = torch.cosine_similarity(
            torch.tensor(user_combined_embedding, dtype=torch.float32),
            torch.tensor(company_average_embedding, dtype=torch.float32),
            dim=0
        ).item()

        if similarity_score >= 0:  
            recommended_companies.append({
                "_id": company_id,
                "score": similarity_score * 100,
                "name": company.get("name", "Unknown"),
                "rating": company.get("rating", ""),
                "logo": company.get("logo", "")
            })

    recommended_companies.sort(key=lambda x: x["score"], reverse=True)

    return recommended_companies[:5]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing user"}))
        sys.exit(1)

    user_id = sys.argv[1]

    recommended_companies = recommend_companies(user_id)
    if recommended_companies:
        print(json.dumps({"recommended_companies": recommended_companies}))
    else:
        print(json.dumps({"error": "No recommended companies found"}))
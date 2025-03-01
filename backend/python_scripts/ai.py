import pymongo
import os
import numpy as np
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder
from bson import ObjectId

load_dotenv()

# MongoDB Connection
mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def get_user_saved_jobs(user_id):
    """Fetch user's saved job IDs."""
    user = db.users.find_one({"_id": ObjectId(user_id)}, {"savedJobs": 1})
    if not user or "savedJobs" not in user:
        return []
    return [ObjectId(job_id) for job_id in user["savedJobs"]]

def get_jobs(job_ids=None):
    """Fetch job postings. If job_ids is given, fetch only those jobs."""
    query = {"_id": {"$in": job_ids}} if job_ids else {}
    
    # Populate the company field
    jobs = list(db.jobpostings.aggregate([
        {"$match": query},
        {"$lookup": {
            "from": "companies",  # Name of the company collection
            "localField": "company",
            "foreignField": "_id",
            "as": "company_info"
        }},
        {"$unwind": {"path": "$company_info", "preserveNullAndEmptyArrays": True}},  # Prevents errors if no match
        {"$project": {
            "title": 1,
            "company_name": "$company_info.name"  # Extracts company name
        }}
    ]))

    return jobs

def preprocess_jobs(jobs):
    """Extract relevant features from job postings."""
    texts, ids, types, experiences, locations = [], [], [], [], []

    for job in jobs:
        title = job.get("title", "").strip()
        company = job.get("company_name", "").strip()
        skills = " ".join(job.get("skills", [])).strip()

        full_text = f"{title} {company} {skills}".strip()
        if full_text:
            texts.append(full_text)
            ids.append(str(job["_id"]))
            types.append(job.get("jobType", ""))
            experiences.append(str(job.get("experienceLevel", "")))
            locations.append(str(job.get("location", "")))

    return texts, ids, types, experiences, locations


def compute_weighted_similarity(interacted_texts, all_texts, interacted_meta, all_meta, weights):
    """Compute weighted similarity using TF-IDF and categorical encoding."""
    vectorizer = TfidfVectorizer(stop_words="english")
    skill_vectors = vectorizer.fit_transform(interacted_texts + all_texts)
    
    # Compute cosine similarity for skills
    skill_sim_matrix = cosine_similarity(skill_vectors[:len(interacted_texts)], skill_vectors[len(interacted_texts):])
    
    encoder = OneHotEncoder(handle_unknown='ignore')
    categorical_features = np.array(interacted_meta + all_meta).reshape(-1, 3)  # Reshape for encoding
    encoded_features = encoder.fit_transform(categorical_features).toarray()

    # Split into interacted and all jobs
    interacted_encoded = encoded_features[:len(interacted_meta)]
    all_encoded = encoded_features[len(interacted_meta):]

    category_sim_matrix = cosine_similarity(interacted_encoded, all_encoded)

    skill_weight, exp_weight, location_weight, jobtype_weight = weights
    total_similarity = (
        skill_weight * skill_sim_matrix +
        exp_weight * category_sim_matrix +
        location_weight * category_sim_matrix +
        jobtype_weight * category_sim_matrix
    )

    similarity_scores = total_similarity.mean(axis=0)  # Average similarity scores across interacted jobs
    return [f"{score * 100:.2f}%" for score in np.round(similarity_scores, 2)]


def recommend_jobs(user_id, top_n=10):
    """Generate job recommendations for a user."""
    # Fetch user-interacted jobs and all jobs
    saved_job_ids = get_user_saved_jobs(user_id)
    interacted_jobs = get_jobs(saved_job_ids)
    all_jobs = get_jobs()

    # Extract Features
    interacted_texts, interacted_ids, interacted_types, interacted_experience, interacted_locations = preprocess_jobs(interacted_jobs)
    all_texts, all_ids, all_types, all_experience, all_locations = preprocess_jobs(all_jobs)

    # Get job titles
    all_titles = {str(job["_id"]): job.get("title", "Unknown Title") for job in all_jobs}
    all_companies = {str(job["_id"]): job.get("company_name", "Unknown company") for job in all_jobs}

    # Combine categorical features for similarity
    interacted_meta = list(zip(interacted_types, interacted_experience, interacted_locations))
    all_meta = list(zip(all_types, all_experience, all_locations))

    # Feature Weights
    weights = (0.5, 0.15, 0.2, 0.15)  # Skills: 50%, Experience: 15%, Location: 20%, Job Type: 15%

    # Compute Similarity
    similarity_scores = compute_weighted_similarity(interacted_texts, all_texts, interacted_meta, all_meta, weights)

    # Rank Jobs Based on Similarity
    job_recommendations = sorted(zip(all_ids, similarity_scores), key=lambda x: x[1], reverse=True)
    job_recommendations = [(all_titles[job_id], all_companies[job_id], score) for job_id, score in job_recommendations if job_id not in interacted_ids]

    return job_recommendations[:top_n]


# Example Usage
user_id = "67b82060b7e03a1b30fd0940"
recommended_jobs = recommend_jobs(user_id)
print(recommended_jobs)

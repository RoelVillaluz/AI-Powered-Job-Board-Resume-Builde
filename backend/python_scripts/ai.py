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
    return list(db.jobpostings.find(query))

def preprocess_jobs(jobs):
    """Extract relevant features from job postings."""
    job_texts, job_ids, job_types, experience_levels, locations = [], [], [], [], []

    for job in jobs:
        job_text = " ".join([skill["name"] for skill in job.get("skills", [])])  # TF-IDF features
        job_texts.append(job_text)
        job_ids.append(str(job["_id"]))
        job_types.append(job.get("jobType", ""))
        experience_levels.append(job.get("experienceLevel", ""))
        locations.append(job.get("location", ""))

    return job_texts, job_ids, job_types, experience_levels, locations

def compute_weighted_similarity(interacted_texts, all_texts, interacted_meta, all_meta, weights):
    """Compute weighted similarity using TF-IDF and categorical encoding."""
    # 1️⃣ TF-IDF Vectorization for Job Skills
    vectorizer = TfidfVectorizer(stop_words="english")
    skill_vectors = vectorizer.fit_transform(interacted_texts + all_texts)
    
    # Compute cosine similarity for skills
    skill_sim_matrix = cosine_similarity(skill_vectors[:len(interacted_texts)], skill_vectors[len(interacted_texts):])
    
    # 2️⃣ One-Hot Encoding for Categorical Features (job type, experience level, location)
    encoder = OneHotEncoder(handle_unknown='ignore')
    categorical_features = np.array(interacted_meta + all_meta).reshape(-1, 3)  # Reshape for encoding
    encoded_features = encoder.fit_transform(categorical_features).toarray()

    # Split into interacted and all jobs
    interacted_encoded = encoded_features[:len(interacted_meta)]
    all_encoded = encoded_features[len(interacted_meta):]

    # Compute cosine similarity for categorical features
    category_sim_matrix = cosine_similarity(interacted_encoded, all_encoded)

    # 3️⃣ Compute Weighted Similarity
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

    # Combine categorical features for similarity
    interacted_meta = list(zip(interacted_types, interacted_experience, interacted_locations))
    all_meta = list(zip(all_types, all_experience, all_locations))

    # Feature Weights
    weights = (0.5, 0.15, 0.2, 0.15)  # Skills: 50%, Experience: 15%, Location: 20%, Job Type: 15%

    # Compute Similarity
    similarity_scores = compute_weighted_similarity(interacted_texts, all_texts, interacted_meta, all_meta, weights)

    # Rank Jobs Based on Similarity
    job_recommendations = sorted(zip(all_ids, similarity_scores), key=lambda x: x[1], reverse=True)
    job_recommendations = [job for job in job_recommendations if job[0] not in interacted_ids]

    return job_recommendations[:top_n]

# Example Usage
user_id = "67b82060b7e03a1b30fd0940"
recommended_jobs = recommend_jobs(user_id)
print(recommended_jobs)

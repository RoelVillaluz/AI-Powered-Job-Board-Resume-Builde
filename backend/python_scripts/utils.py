import os
from dotenv import load_dotenv
import numpy as np
import pymongo
from bson import ObjectId
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
import torch

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]
model = SentenceTransformer('all-mpnet-base-v2')

def get_embedding(text):
    """ Generates an embedding and ensures it's a PyTorch tensor. """
    return torch.tensor(model.encode(text, convert_to_numpy=True), dtype=torch.float32)

def get_resume_by_id(resume_id):
    try:
        resume_data = db.resumes.find_one({"_id": ObjectId(resume_id)})
        return resume_data
    except Exception as e:
        print(f"Error fetching resume for {resume_id}: {e}")
        return None


def get_user_interacted_jobs(user_id):
    """ Fetches all jobs that a user has saved or applied to. """
    if not user_id:
        return []
    
    try:
        user_data = db.users.find_one({"_id": ObjectId(user_id)})

        interacted_jobs = {"saved_jobs": [], "applied_jobs": []}

        if user_data:            
            # Fetch applied jobs by querying the Application model (applications the user has applied to)
            applied_jobs = db.applications.find({"applicant": ObjectId(user_id)})

            interacted_jobs['saved_jobs'] = user_data.get('savedJobs', [])
            interacted_jobs['applied_jobs'] = [application['jobPosting'] for application in applied_jobs]
        else:
            # If no user data found, initialize empty lists
            interacted_jobs['savedJobs'] = []
            interacted_jobs['appliedJobs'] = []
        
        return interacted_jobs
    except Exception as e:
        print(f"Error fetching interacted jobs for {user_id}: {e}")
        return []
    
def extract_resume_embeddings(resume):
    """
    Extracts and computes the mean embeddings for skills, work experience, and certifications from the resume.
    
    Parameters:
        resume (dict): The resume data containing skills, work experience, and certifications.
        
    Returns:
        tuple: A tuple containing the mean embeddings for skills, work experience, and certifications.
               (skill_embedding, work_embedding, certification_embedding)
               If any of the fields are empty, the corresponding embedding will be None.
    """
    # Extract skills, work experiences, and certifications
    skills = [skill["name"] for skill in resume.get("skills", []) if skill.get('name')]
    work_experiences = [
        f"{exp['jobTitle']} at {exp['company']}. {exp['responsibilities']}"
        for exp in resume.get("workExperience", [])
        if exp.get('jobTitle') and exp.get('responsibilities')
    ]
    certifications = [certification["name"] for certification in resume.get("certifications", [])]

    # Return None if no skills or work experiences are found
    if not skills or not work_experiences:
        return None, None, None  # No valid data to process.

    # Compute embeddings for skills, work experience, and certifications
    skill_embeddings = torch.stack([get_embedding(skill) for skill in skills]) if skills else None
    work_embeddings = torch.stack([get_embedding(exp) for exp in work_experiences]) if work_experiences else None
    certification_embeddings = (
        torch.stack([get_embedding(cert) for cert in certifications]).mean(dim=0) if certifications else None
    )
    
    # Compute the mean embedding for each category (skills, work, and certifications)
    mean_skill_embedding = torch.mean(skill_embeddings, dim=0) if skill_embeddings is not None else None
    mean_work_embedding = torch.mean(work_embeddings, dim=0) if work_embeddings is not None else None

    return mean_skill_embedding, mean_work_embedding, certification_embeddings
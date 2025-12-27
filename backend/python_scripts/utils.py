import datetime
import json
import os
from dotenv import load_dotenv
import numpy as np
import pymongo
from bson import ObjectId
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
import torch

load_dotenv()

mongo_uri = os.getenv('MONGO_DEV_URI')
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
    
    # Extract work experience, with more robust handling of responsibilities
    work_experiences = [
        f"{exp['jobTitle']}: {', '.join([json.dumps(r) if isinstance(r, dict) else str(r) for r in exp.get('responsibilities', [])])}"
        if exp.get('responsibilities') else exp['jobTitle']
        for exp in resume.get('workExperience', [])
        if exp.get('jobTitle')
    ]
    
    certifications = [certification["name"] for certification in resume.get("certifications", [])]

    # Compute embeddings safely
    skill_embeddings = [get_embedding(skill) for skill in skills if get_embedding(skill) is not None]
    work_embeddings = [get_embedding(exp) for exp in work_experiences if get_embedding(exp) is not None]
    certification_embeddings = [get_embedding(cert) for cert in certifications if get_embedding(cert) is not None]

    # Convert lists to tensors only if they are not empty
    skill_embeddings = torch.stack(skill_embeddings) if skill_embeddings else None
    work_embeddings = torch.stack(work_embeddings) if work_embeddings else None
    
    # Convert to primitive tensor before computing mean for JSON serialization later
    if certification_embeddings:
        certification_embeddings_tensor = torch.stack(certification_embeddings)
        certification_embeddings = torch.mean(certification_embeddings_tensor, dim=0).detach().cpu()
    else:
        certification_embeddings = None

    # Compute mean embeddings and ensure they're detached from computation graph
    mean_skill_embedding = torch.mean(skill_embeddings, dim=0).detach().cpu() if skill_embeddings is not None else None
    mean_work_embedding = torch.mean(work_embeddings, dim=0).detach().cpu() if work_embeddings is not None else None

    # Compute total years of experience
    total_experience_years = 0.0
    for exp in resume.get("workExperience", []):
        try:
            # Parse start date
            start_date = datetime.strptime(exp['startDate'], "%Y-%m-%dT%H:%M:%S.%fZ")

            # Parse end date or set to now if missing/present
            end_date_raw = exp.get('endDate')
            if end_date_raw and end_date_raw.lower() != "present":
                end_date = datetime.strptime(end_date_raw, "%Y-%m-%dT%H:%M:%S.%fZ")
            else:
                end_date = datetime.now()

            # Calculate years of experience
            years = (end_date - start_date).days / 365.25
            total_experience_years += max(0, years)

        except Exception as e:
            # Skip if any parsing error occurs
            continue

    return mean_skill_embedding, mean_work_embedding, certification_embeddings, total_experience_years

def extract_job_embeddings(job):
    """
    Extracts and computes the mean embeddings for skills, experience level, job title & location, 
    and requirements from the job posting.
    
    Parameters:
        job (dict): The job posting data containing skills, experience level, title, location, and requirements.
        
    Returns:
        tuple: A tuple containing the mean embeddings for skills, experience level, 
               title & location, and requirements.
    """
    import torch

    # Extract skills, requirements
    skills = [skill["name"] for skill in job.get("skills", []) if skill.get("name")]
    requirements = [requirement for requirement in job.get("requirements", [])]

    # Get embeddings for skills and requirements
    skill_embeddings = torch.stack([get_embedding(skill) for skill in skills]) if skills else None
    requirement_embeddings = torch.stack([get_embedding(req) for req in requirements]) if requirements else None
    
    # Get single embeddings and ensure they're detached
    experience_embedding = get_embedding(job.get("experienceLevel", "")) if job.get("experienceLevel") else None
    if experience_embedding is not None:
        experience_embedding = experience_embedding.detach().cpu()
        
    job_title_embedding = get_embedding(job.get("title", "")) if job.get("title") else None
    if job_title_embedding is not None:
        job_title_embedding = job_title_embedding.detach().cpu()
        
    location_embedding = get_embedding(job.get("location", "")) if job.get("location") else None
    if location_embedding is not None:
        location_embedding = location_embedding.detach().cpu()

    # Education level mapping (unused in the original code but keeping for reference)
    education_level_map = {
        "None": 0,
        "High school": 1,
        "Bachelor's degree": 2,
        "Master's degree": 3,
        "PhD": 4
    }

    # Compute mean embeddings only if they are not None and not empty
    mean_skill_embedding = None
    if skill_embeddings is not None and skill_embeddings.numel() > 0:
        mean_skill_embedding = torch.mean(skill_embeddings, dim=0).detach().cpu()
        
    mean_requirements_embedding = None
    if requirement_embeddings is not None and requirement_embeddings.numel() > 0:
        mean_requirements_embedding = torch.mean(requirement_embeddings, dim=0).detach().cpu()

    return mean_skill_embedding, mean_requirements_embedding, experience_embedding, job_title_embedding, location_embedding

def cluster_job_postings(job_posting_embeddings, num_clusters=5):
    """
    Perform K-Means clustering on the job postings' embeddings.

    Parameters:
        job_postings_embeddings (list): A list of embeddings for job postings.
        num_clusters (int): Number of clusters to form.

    Returns:
        kmeans.labels_: Array of cluster labels for each job posting.
        kmeans.cluster_centers_: Cluster centers (mean embeddings of the clusters).
    """

    # Convert job postings embeddings into a 2D array (each row is an embedding)
    job_matrix = np.array(job_posting_embeddings)

    # Perform K-Means clustering
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(job_matrix)

    return kmeans.labels_, kmeans.cluster_centers_

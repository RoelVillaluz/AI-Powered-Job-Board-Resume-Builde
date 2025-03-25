import os
from dotenv import load_dotenv
import numpy as np
import pymongo
from bson import ObjectId
from sklearn.feature_extraction.text import TfidfVectorizer

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

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
    
def extract_skills_features(resume_id, user_id):
    resume_data = get_resume_by_id(resume_id)
    job_data = get_user_interacted_jobs(user_id)

    resume_skills = [skill['name'] for skill in resume_data.get('skills', [])]
    job_skills = [skill['name'] for skill in job_data.get('skills', [])]

    all_skills = resume_skills + job_skills
    all_skills_text = [" ".join(all_skills)]

    vectorizer = TfidfVectorizer()
    skill_matrix = vectorizer.fit_transform(all_skills_text)

    return skill_matrix
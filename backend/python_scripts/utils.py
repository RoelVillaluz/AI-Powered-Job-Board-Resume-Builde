import datetime
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

def get_resumes_by_id(resume_id):
    try:
        resume_data = db.resumes.find_one({"_id": ObjectId(resume_id)})
        return resume_data
    except Exception as e:
        print(f"Error fetching resume for {resume_id}: {e}")
        return None


    if not user_id:
        return []
    
    try: 
        resumes = db.resumes.find({"user": ObjectId(user_id)})
        return list(resumes)
    except Exception as e:
        print(f"Error fetching resumes for {user_id}: {e}")
        return []
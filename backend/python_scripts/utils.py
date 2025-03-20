import os
from dotenv import load_dotenv
import pymongo
from bson import ObjectId

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def get_user_resumes(user_id):
    """ Fetches all resumes for a specific user from the MongoDB database. """
    if not user_id:
        return []
    
    try: 
        resumes = db.resumes.find({"user": ObjectId(user_id)})
        return list(resumes)
    except Exception as e:
        print(f"Error fetching resumes for {user_id}: {e}")
        return []
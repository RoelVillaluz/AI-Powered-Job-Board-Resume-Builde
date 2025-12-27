import json
import os
import sys
from bson import ObjectId
from dotenv import load_dotenv
import pymongo
import torch
from utils import extract_resume_embeddings, get_resume_by_id

load_dotenv()

# MongoDB Connection
mongo_uri = os.getenv('MONGO_DEV_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def recommend_connections(user_resume):
    """ Recommends user which people to connect with based on their industry, skills, education. """
    user_id = user_resume.get('user')
    all_resumes = db.resumes.find({"user": {"$ne": user_id}})

    user_resume_embedding = extract_resume_embeddings(user_resume)

    similarities = []

    for resume in all_resumes:
        mean_skill_embedding, certification_embeddings = extract_resume_embeddings(resume)

        # Check if any of the embeddings are None
        embeddings = []
        if mean_skill_embedding is not None:
            embeddings.append(mean_skill_embedding)
        if certification_embeddings is not None:
            embeddings.append(certification_embeddings)

        # Only stack if there are valid embeddings
        if embeddings:
            # Stack the embeddings into a single tensor and reshape if needed
            other_resume_embedding = torch.mean(torch.stack(embeddings))

            # Ensure that the user resume embeddings are the same size for comparison
            user_skill_embedding, user_certification_embedding = user_resume_embedding

            # Reshape embeddings to 1D vectors if they are not already
            user_skill_embedding = user_skill_embedding.flatten()
            user_certification_embedding = user_certification_embedding.flatten()
            mean_skill_embedding = mean_skill_embedding.flatten() if mean_skill_embedding is not None else torch.tensor([])
            certification_embeddings = certification_embeddings.flatten() if certification_embeddings is not None else torch.tensor([])

            # Calculate similarities based on the valid embeddings
            skill_similarity = torch.cosine_similarity(user_skill_embedding, mean_skill_embedding) if mean_skill_embedding is not None else torch.tensor(0.0)
            certification_similarity = torch.cosine_similarity(user_certification_embedding, certification_embeddings) if certification_embeddings is not None else torch.tensor(0.0)

            # Combine the individual similarities into an overall score (optional weighting)
            overall_similarity = skill_similarity + certification_similarity

            similarities.append((resume['user'], overall_similarity))

    # Sort by overall similarity
    similarities.sort(key=lambda x: x[1], reverse=True)

    # Get top 5 recommended connections
    recommended_connections = [user for user, similarity in similarities[:5]]

    return recommended_connections


resume = get_resume_by_id(ObjectId("67b8209ab7e03a1b30fd0949"))
print(recommend_connections(resume))

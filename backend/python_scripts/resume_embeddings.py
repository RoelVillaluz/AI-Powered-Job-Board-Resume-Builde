"""
Resume Embedding Generation Script

Generates and stores vector embeddings for resume content.
Checks if embeddings already exist before recalculating.

Usage:
    python resume_embeddings.py generate <resume_id>
    python resume_embeddings.py regenerate <resume_id>
"""

import json
import os
import sys
import traceback
from bson import ObjectId
from dotenv import load_dotenv
import pymongo
import torch

from backend.python_scripts.utils import extract_resume_embeddings, get_resume_by_id

load_dotenv()

mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client["database"]

def check_existing_embeddings(resume_id):
    """ 
    Check if embeddings already exist for this resume.
    
    Returns:
        dict or None: Existing embedding document or None if not found
    """
    try:
        existing = db.resumeEmbeddings.find_one({ "resume": ObjectId(resume_id) })
        return existing
    except Exception as e:
        return None
    
def generate_embeddings(resume_id, force_regenerate=False):
    """
    Generate embeddings for a resume.
    
    Args:
        resume_id: MongoDB ObjectId string
        force_regenerate: If True, skip cache check and regenerate
        
    Returns:
        dict: Contains embeddings, meanEmbeddings, and metrics
    """
    try:
        # Step 1: Check if embeddings already exist (unless force regenerate)
        if not force_regenerate:
            existing = check_existing_embeddings(resume_id)
            if existing:
                # Return existing embeddings if they're complete
                if (existing.get('meanEmbeddings', {}).get('skills') and 
                    len(existing.get('meanEmbeddings', {}).get('skills', [])) > 0):
                    return {
                        "cached": True,
                        "embeddings": {
                            "skills": existing.get('embeddings', {}).get('skills', []),
                            "workExperience": existing.get('embeddings', {}).get('workExperience', []),
                            "certifications": existing.get('embeddings', {}).get('certifications', [])
                        },
                        "meanEmbeddings": {
                            "skills": existing.get('meanEmbeddings', {}).get('skills', []),
                            "workExperience": existing.get('meanEmbeddings', {}).get('workExperience'),
                            "certifications": existing.get('meanEmbeddings', {}).get('certifications')
                        },
                        "metrics": {
                            "totalExperienceYears": existing.get('metrics', {}).get('totalExperienceYears', 0)
                        }
                    }
        # Step 2: Fetch resume
        resume = get_resume_by_id(resume_id)
        if not resume:
            return {"error": f"Resume not found with ID: {resume_id}"}
        
        # Step 3: Extract embeddings using utils.py function
        mean_skill, mean_work, mean_cert, total_years = extract_resume_embeddings(resume)

        # Step 4: Convert PyTorch tensors to lists for JSON serialization
        def tensor_to_list(tensor):
            if tensor is None:
                return None
            if isinstance(tensor, torch.Tensor):
                return tensor.tolist()
            return tensor
        
        # Prepare response
        result = {
            "cached": False,
            "embeddings": {
                # For now, we'll just store mean embeddings
                # If you need individual embeddings, extract them separately
                "skills": [],
                "workExperience": [],
                "certifications": []
            },
            "meanEmbeddings": {
                "skills": tensor_to_list(mean_skill),
                "workExperience": tensor_to_list(mean_work),
                "certifications": tensor_to_list(mean_cert)
            },
            "metrics": {
                "totalExperienceYears": float(total_years)
            }
        }

    except Exception as e:
        return {
            "error": f"Error generating embeddings: {str(e)}",
            "traceback": traceback.format_exc(),
            "resume_id": resume_id
        }
    
if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({
                "error": "Missing mode argument. Usage: python resume_embeddings.py <mode> <resume_id>"
            }))
            sys.exit(1)
        
        mode = sys.argv[1]
        
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Missing resume_id argument"}))
            sys.exit(1)
        
        resume_id = sys.argv[2]
        
        # Validate resume_id format
        try:
            ObjectId(resume_id)
        except Exception as e:
            print(json.dumps({
                "error": f"Invalid resume_id format: {resume_id}",
                "details": str(e)
            }))
            sys.exit(1)
        
        # Process based on mode
        if mode == "generate":
            result = generate_embeddings(resume_id, force_regenerate=False)
            print(json.dumps(result))
            
        elif mode == "regenerate":
            result = generate_embeddings(resume_id, force_regenerate=True)
            print(json.dumps(result))
            
        else:
            print(json.dumps({
                "error": f"Invalid mode: {mode}. Must be 'generate' or 'regenerate'"
            }))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({
            "error": "Unexpected error in main",
            "details": str(e),
            "traceback": traceback.format_exc(),
            "argv": sys.argv
        }))
        sys.exit(1)
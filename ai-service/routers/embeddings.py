import sys
import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Make sure Python can find the parent ai-service/ folder
# so imports like `from main import ...` resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import the exact same functions main.py uses — zero logic duplication.
from main import (
    generate_resume_embeddings,
    generate_job_embeddings,
    generate_skill_embeddings,
    generate_job_title_embeddings,
    generate_location_embeddings,
    generate_industry_embeddings,
    score_resume
)

logger = logging.getLogger(__name__)

# ── Router ─────────────────────────────────────────────────────────────────────
router = APIRouter(prefix='/compute')


# ── Request body schema ────────────────────────────────────────────────────────
# Pydantic BaseModel = the shape of the request body.
# FastAPI automatically parses and validates the incoming JSON against this.
# extra="allow" means we accept any fields beyond what's defined here —
# important because Node sends the full resume document (skills, jobTitle, etc.)
# and we don't want to define every field explicitly.
#
# Think of it like a TypeScript interface, but with runtime validation built in.

class ComputeRequest(BaseModel):
   model_config = {"extra": "allow"}  # accept any JSON fields

# ── Response wrapper ───────────────────────────────────────────────────────────
# All main.py functions return either:
#   { "error": "something went wrong" }   ← on failure
#   { "resume_id": ..., "embeddings": ... } ← on success
#
# This normalizes both into the shape Node expects:
#   { "data": <result>, "error": null }   ← success
#   { "data": null, "error": "message" }  ← failure
#
# Node's aiClient.ts checks for res.data.error and throws if present.

def wrap(result: dict) -> dict:
    if "error" in result:
        return { "data": None, "error": result["error"] }
    return { "data": result, "error": None }


@router.post('/generate_resume_embeddings')
async def resume_embeddings(body: ComputeRequest) -> dict:
    # model_dump() converts the Pydantic model back to a plain dict
    # equivalent to req.body in Express
    payload = body.model_dump()
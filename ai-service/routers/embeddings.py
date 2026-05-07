from fastapi import APIRouter
from main import generate_location_embeddings
from routers.shared import ComputeRequest, wrap
from main_v2 import generate_job_title_embeddings_v2, generate_resume_embeddings_v2, generate_skill_embeddings_v2, generate_location_embeddings_v2

router = APIRouter(prefix='/compute')

@router.post('/generate_resume_embeddings')
async def resume_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_resume_embeddings_v2(body.model_dump()))

@router.post('/generate_skill_embeddings')
async def skill_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_skill_embeddings_v2(body.model_dump()))

@router.post('/generate_job_title_embeddings')
async def job_title_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_job_title_embeddings_v2(body.model_dump()))

@router.post('/generate_location_embeddings')
async def location_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_location_embeddings_v2(body.model_dump()))
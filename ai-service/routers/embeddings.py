from fastapi import APIRouter
from routers.shared import ComputeRequest, wrap
from main_v2 import generate_resume_embeddings_v2

router = APIRouter(prefix='/compute')

@router.post('/generate_resume_embeddings')
async def resume_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_resume_embeddings_v2(body.model_dump()))
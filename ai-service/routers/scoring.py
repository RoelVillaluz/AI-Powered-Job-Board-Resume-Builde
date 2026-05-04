from fastapi import APIRouter
from routers.shared import ComputeRequest, wrap
from main_v2 import score_resume_v2

router = APIRouter(prefix='/compute')

@router.post('/score_resume')
async def calculate_score(body: ComputeRequest) -> dict:
    return wrap(score_resume_v2(body.model_dump()))
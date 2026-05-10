from fastapi import APIRouter
from routers.shared import ComputeRequest, wrap
from main_v2 import generate_job_posting_embeddings_v2, generate_job_title_embeddings_v2, generate_resume_embeddings_v2, generate_skill_embeddings_v2, generate_location_embeddings_v2

router = APIRouter(prefix='/compute')

@router.post('/generate_resume_embeddings')
async def resume_embeddings(body: ComputeRequest) -> dict:
    data = body.model_dump()

    return wrap(generate_resume_embeddings_v2(
        resume_body=data.get("resume", data),
        skill_docs=data.get("skillDocs", []),
        job_title_doc=data.get("jobTitleDoc"),
        location_doc=data.get("locationDoc"),
        work_experience_title_docs=data.get("workExperienceTitleDocs", []),
    ))

@router.post('/generate_job_posting_embeddings')
async def job_posting_embeddings(body: ComputeRequest) -> dict:
    data = body.model_dump()

    return wrap(generate_job_posting_embeddings_v2(
        job_body=data.get("job", data),
        skill_docs=data.get("skillDocs", []),
        job_title_doc=data.get("jobTitleDoc"),
        location_doc=data.get("locationDoc"),
    ))

@router.post('/generate_skill_embeddings')
async def skill_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_skill_embeddings_v2(body.model_dump()))

@router.post('/generate_job_title_embeddings')
async def job_title_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_job_title_embeddings_v2(body.model_dump()))

@router.post('/generate_location_embeddings')
async def location_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_location_embeddings_v2(body.model_dump()))
from fastapi import APIRouter
from routers.shared import ComputeRequest, wrap
from handlers.resume_handlers import generate_resume_embeddings
from handlers.job_handlers import generate_job_posting_embeddings
from handlers.market_handlers import (
    generate_skill_embeddings,
    generate_job_title_embeddings,
    generate_location_embeddings,
)

router = APIRouter(prefix="/compute")


@router.post("/generate_resume_embeddings")
async def resume_embeddings(body: ComputeRequest) -> dict:
    data = body.model_dump()

    return wrap(
        generate_resume_embeddings(
            resume_body=data.get("resume", data),
            skill_docs=data.get("skillDocs", []),
            job_title_doc=data.get("jobTitleDoc"),
            location_doc=data.get("locationDoc"),
            work_experience_title_docs=data.get("workExperienceTitleDocs", []),
        )
    )


@router.post("/generate_job_posting_embeddings")
async def job_posting_embeddings(body: ComputeRequest) -> dict:
    data = body.model_dump()

    job = data.get("job", data)

    # Normalize: job postings store the title ref as 'title',
    # but the embedding task_registry reads doc.get("jobTitle").
    # Alias it here so the pipeline finds it without changing shared infrastructure.
    if "title" in job and "jobTitle" not in job:
        job["jobTitle"] = job["title"]

    return wrap(
        generate_job_posting_embeddings(
            job_body=job,
            skill_docs=data.get("skillDocs", []),
            job_title_doc=data.get("jobTitleDoc"),
            location_doc=data.get("locationDoc"),
        )
    )


@router.post("/generate_skill_embeddings")
async def skill_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_skill_embeddings(body.model_dump()))


@router.post("/generate_job_title_embeddings")
async def job_title_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_job_title_embeddings(body.model_dump()))


@router.post("/generate_location_embeddings")
async def location_embeddings(body: ComputeRequest) -> dict:
    return wrap(generate_location_embeddings(body.model_dump()))

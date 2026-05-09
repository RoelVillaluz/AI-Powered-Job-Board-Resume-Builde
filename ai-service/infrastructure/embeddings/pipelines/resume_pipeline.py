"""
Resume embedding pipeline definition.
Registers itself with pipeline_registry on import.
"""

from typing import Optional

from metrics.embedding_metrics import PipelineRun
from infrastructure.embeddings.pipelines import pipeline_registry
from infrastructure.embeddings.pipelines.base import EmbeddingPipeline, make_pipeline
from infrastructure.embeddings.tasks.tasks import (
    run_certifications,
    run_job_title,
    run_location,
    run_skills,
    run_work_experience,
)


def _task_factory(
    resume: dict,
    skill_docs: list[dict],
    job_title_doc: Optional[dict],
    location_doc: Optional[dict],
    work_experience_title_docs: list[dict],
    run: PipelineRun,
) -> dict:
    return {
        "skills":         lambda: run_skills(resume, skill_docs, run),
        "workExperience": lambda: run_work_experience(resume, work_experience_title_docs, run),
        "certifications": lambda: run_certifications(resume, run),
        "jobTitle":       lambda: run_job_title(resume, job_title_doc, run),
        "location":       lambda: run_location(resume, location_doc, run),
    }


_PIPELINE = EmbeddingPipeline(
    task_factory=_task_factory,
    result_keys={
        "skills":           "skills",
        "work_experience":  "workExperience",
        "certifications":   "certifications",
        "job_title":        ("jobTitle",  "single"),
        "location":         ("location",  "single"),
    },
)

pipeline_registry.register("resume", *make_pipeline(_PIPELINE))
"""
Job posting embedding pipeline definition.
Registers itself with pipeline_registry on import.
"""

from typing import Optional

from metrics.embedding_metrics import PipelineRun
from infrastructure.embeddings.pipelines import pipeline_registry
from infrastructure.embeddings.pipelines.base import EmbeddingPipeline, make_pipeline
from infrastructure.embeddings.tasks.tasks import (
    run_experience_level,
    run_job_title,
    run_location,
    run_requirements,
    run_skills,
)


def _task_factory(
    job: dict,
    skill_docs: list[dict],
    job_title_doc: Optional[dict],
    location_doc: Optional[dict],
    run: PipelineRun,
) -> dict:
    return {
        "skills":          lambda: run_skills(job, run, skill_docs=skill_docs),
        "requirements":    lambda: run_requirements(job, run),
        "jobTitle":        lambda: run_job_title(job, run, job_title_doc=job_title_doc),
        "location":        lambda: run_location(job, run, location_doc=location_doc),
        "experienceLevel": lambda: run_experience_level(job, run),
    }


_PIPELINE = EmbeddingPipeline(
    task_factory=_task_factory,
    result_keys={
        "skills":           "skills",
        "requirements":     "requirements",
        "job_title":        ("jobTitle",  "single"),
        "location":         ("location",  "single"),
        "experience_level": "experienceLevel",
    },
)

pipeline_registry.register("job_posting", *make_pipeline(_PIPELINE))
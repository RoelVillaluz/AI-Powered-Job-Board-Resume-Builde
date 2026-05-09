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
        "skills":          lambda: run_skills(job, skill_docs, run),
        "requirements":    lambda: run_requirements(job, run),
        "jobTitle":        lambda: run_job_title(job, job_title_doc, run),
        "location":        lambda: run_location(job, location_doc, run),
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

pipeline_registry.register("job", *make_pipeline(_PIPELINE))
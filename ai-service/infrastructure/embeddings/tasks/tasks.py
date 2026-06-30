"""
Embedding task shims.

Responsibility: provide named task callables that the pipeline files
(pipelines/resume.py, pipelines/job.py) pass into their task maps.
All logic lives in task_registry.run_task().

Adding a new section = add a TaskConfig to task_registry._TASKS.
No new function needed here.
"""

from metrics.embedding_metrics import PipelineRun
from infrastructure.embeddings.tasks.task_registry import run_task

def _make(section_key: str):
    """Return a named task function bound to a section key."""
    def task(doc: dict, run: PipelineRun, **kwargs):
        return run_task(section_key, doc, run, **kwargs)
    task.__name__ = f"run_{section_key}"
    return task


run_skills                = _make("skills")
run_work_experience       = _make("workExperience")
run_certifications        = _make("certifications")
run_job_title             = _make("jobTitle")
run_location              = _make("location")
run_requirements          = _make("requirements")
run_experience_level      = _make("experienceLevel")
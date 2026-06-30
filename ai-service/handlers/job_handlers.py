from handlers.base_handler import register, safe_call
from services.job_service import JobService
from serializers.job_serializers import serialize_job_embeddings


@register("generate_job_posting_embeddings")
def generate_job_posting_embeddings(
    job_body: dict,
    skill_docs: list[dict],
    job_title_doc: dict | None,
    location_doc: dict | None,
) -> dict:
    def _run():
        emb = JobService.extract_embeddings(
            job_body, skill_docs, job_title_doc, location_doc
        )
        return serialize_job_embeddings(job_body.get("_id"), emb)

    return safe_call(_run, label="generate_job_posting_embeddings")

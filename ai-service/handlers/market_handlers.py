from handlers.base_handler import register, safe_call
from infrastructure.embeddings.embed_text import embed_text


@register("generate_skill_embeddings")
def generate_skill_embeddings(payload: dict) -> dict:
    def _run() -> dict:
        name = payload.get("name")
        if not name:
            raise ValueError("payload.name is required for skill embedding generation")
        return {"skill_id": payload.get("_id"), "embedding": embed_text(name)}

    return safe_call(_run, label="generate_skill_embeddings")


@register("generate_job_title_embeddings")
def generate_job_title_embeddings(payload: dict) -> dict:
    def _run() -> dict:
        text = payload.get("normalizedTitle") or payload.get("title")
        if not text:
            raise ValueError(
                "payload.normalizedTitle or payload.title is required for job title embedding generation"
            )
        return {"title_id": payload.get("_id"), "embedding": embed_text(text)}

    return safe_call(_run, label="generate_job_title_embeddings")


@register("generate_location_embeddings")
def generate_location_embeddings(payload: dict) -> dict:
    def _run() -> dict:
        name = payload.get("name")
        if not name:
            raise ValueError("payload.name is required for location embedding generation")
        return {"location_id": payload.get("_id"), "embedding": embed_text(name)}

    return safe_call(_run, label="generate_location_embeddings")
from handlers.base_handler import register, safe_call
from infrastructure.embeddings.embed_text import embed_text


@register("generate_skill_embeddings")
def generate_skill_embeddings(payload: dict) -> dict:
    return safe_call(
        lambda: {"skill_id": payload.get("_id"), "embedding": embed_text(payload.get("name"))},
        label="generate_skill_embeddings",
    )


@register("generate_job_title_embeddings")
def generate_job_title_embeddings(payload: dict) -> dict:
    text = payload.get("normalizedTitle") or payload.get("title")
    return safe_call(
        lambda: {"title_id": payload.get("_id"), "embedding": embed_text(text)},
        label="generate_job_title_embeddings",
    )


@register("generate_location_embeddings")
def generate_location_embeddings(payload: dict) -> dict:
    return safe_call(
        lambda: {"location_id": payload.get("_id"), "embedding": embed_text(payload.get("name"))},
        label="generate_location_embeddings",
    )
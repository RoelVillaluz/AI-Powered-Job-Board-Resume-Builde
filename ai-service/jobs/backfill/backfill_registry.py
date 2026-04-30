from typing import Callable, Any, TypedDict, Optional
from jobs.backfill.job_title_backfill import backfill_job_title
from jobs.backfill.location_backfill import backfill_location
from jobs.backfill.skill_backfill import backfill_skills
from jobs.backfill.backfill_persistence import BackfillStatus


class BackfillConfig(TypedDict):
    handler:   Callable[..., BackfillStatus]
    validator: Callable[[Optional[dict]], bool]
    extractor: Callable[[dict], tuple]   # pulls args from data dict for handler
    error_msg: str


BACKFILL_REGISTRY: dict[str, BackfillConfig] = {
    "skills": {
        "handler":   backfill_skills,
        "validator": lambda data: (
            bool(data.get("skill_ids")) and
            bool(data.get("skill_embeddings")) and
            len(data["skill_ids"]) == len(data["skill_embeddings"])
        ),
        "extractor": lambda data: (data["skill_ids"], data["skill_embeddings"]),
        "error_msg": "skill_ids and skill_embeddings must be non-empty and same length",
    },
    "job_title": {
        "handler":   backfill_job_title,
        "validator": lambda data: bool(data.get("title_id") and data.get("title_embedding") is not None),
        "extractor": lambda data: (data["title_id"], data["title_embedding"]),
        "error_msg": "title_id and title_embedding are required",
    },
    "location": {
        "handler":   backfill_location,
        "validator": lambda data: bool(data.get("location_id") and data.get("location_embedding") is not None),
        "extractor": lambda data: (data["location_id"], data["location_embedding"]),
        "error_msg": "location_id and location_embedding are required",
    },
}
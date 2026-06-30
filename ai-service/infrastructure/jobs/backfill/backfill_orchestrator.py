from typing import Any, Dict, List, TypedDict
import logging
from infrastructure.jobs.backfill.backfill_registry import BACKFILL_REGISTRY

logger = logging.getLogger(__name__)


class SkillBackfillData(TypedDict):
    skill_ids: List[str]
    skill_embeddings: List[Any]  # list[torch.Tensor] at runtime


class JobTitleBackfillData(TypedDict):
    title_id: str
    title_embedding: Any  # torch.Tensor at runtime


class LocationBackfillData(TypedDict):
    location_id: str
    location_embedding: Any  # torch.Tensor at runtime


class BackfillInput(TypedDict, total=False):
    # Each key maps to the dict-shaped payload its validator/extractor
    # expects — NOT the NamedTuple of the same name. The registry's
    # validators call data.get(...) on plain dicts, so this must match.
    skills: SkillBackfillData
    job_title: JobTitleBackfillData
    location: LocationBackfillData


class BackfillResult(TypedDict):
    results: Dict[str, Any]
    errors: List[str]


def orchestrate_backfills(backfills: BackfillInput) -> BackfillResult:
    """
    backfills: { "skills": {...}, "job_title": {...}, "location": {...} }
    Each value is a plain dict matching the shape its registry validator
    and extractor expect (see backfill_registry.py).
    """
    if not any(backfills.values()):
        return BackfillResult(results={}, errors=[])

    results: Dict[str, Any] = {}
    errors: List[str] = []

    for key, data in backfills.items():
        config = BACKFILL_REGISTRY.get(key)

        if not config:
            errors.append(f"{key}: no handler registered")
            continue

        if not config["validator"](data):
            errors.append(f"{key}: {config['error_msg']}")
            continue

        try:
            args = config["extractor"](data)
            results[key] = config["handler"](*args)
        except Exception as e:
            logger.error(f"Backfill '{key}' failed: {e}")
            errors.append(f"{key}: {e}")

    return {
        "results": results,
        "errors": errors,
    }
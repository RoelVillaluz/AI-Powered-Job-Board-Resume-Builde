from typing import Any, Dict, List, NamedTuple, TypedDict
import logging
import torch
from jobs.backfill.backfill_registry import BACKFILL_REGISTRY

logger = logging.getLogger(__name__)

class SkillBackfill(NamedTuple):
    skill_ids:        List[str]
    skill_embeddings: List[torch.Tensor]


class JobTitleBackfill(NamedTuple):
    title_id:        str
    title_embedding: torch.Tensor


class LocationBackfill(NamedTuple):
    location_id:       str
    location_embedding: torch.Tensor

class BackfillInput(TypedDict, total=False):
    skills: SkillBackfill
    job_title: JobTitleBackfill
    location: LocationBackfill

class BackfillResult(TypedDict):
    results: Dict[str, Any]
    errors: List[str]

def orchestrate_backfills(backfills: BackfillInput) -> BackfillResult:
    """
    backfills: { "skills": SkillBackfill, "job_title": JobTitleBackfill, ... }
    """
    if not any(backfills.values()):
        return BackfillResult(results={}, errors=[])

    results = {}
    errors  = []

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
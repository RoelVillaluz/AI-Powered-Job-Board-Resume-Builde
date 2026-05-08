import logging
from typing import List
import torch
 
from config.database import db
from jobs.backfill.backfill_persistence import BackfillStatus, _backfill_batch
 
logger = logging.getLogger(__name__)

def backfill_skills(skill_ids: List[str], skill_embeddings: List[torch.Tensor]) -> BackfillStatus:
    return _backfill_batch(
        collection=db.skills,
        ids=skill_ids,
        embeddings=skill_embeddings,
        entity_name="skills",
    )
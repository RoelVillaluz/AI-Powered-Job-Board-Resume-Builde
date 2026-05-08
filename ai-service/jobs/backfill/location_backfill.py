"""
Backfill job for location embeddings.

Responsibility: persist a pre-computed location embedding to the DB.
Embedding generation is NOT done here — embeddings are computed upstream
in embedding_utils and passed in as arguments.
"""
import logging

from config.database import db
from jobs.backfill.backfill_persistence import BackfillStatus, _backfill_single

logger = logging.getLogger(__name__)


def backfill_location(location_id, location_embedding) -> BackfillStatus:
    return _backfill_single(
        collection=db.locations,
        doc_id=location_id,
        embedding=location_embedding,
        entity_name="location",
    )
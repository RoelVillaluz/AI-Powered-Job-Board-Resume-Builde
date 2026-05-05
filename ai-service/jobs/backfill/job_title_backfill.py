"""
Backfill job for job title embeddings.
 
Responsibility: persist pre-computed job title embeddings to the DB in a
single bulk write. Embedding generation is NOT done here — embeddings are
computed upstream in embedding_utils and passed in as arguments.
"""
import logging
 
from config.database import db
from jobs.backfill.backfill_persistence import BackfillStatus, _backfill_single
 
logger = logging.getLogger(__name__)

def backfill_job_title(title_id, title_embedding) -> BackfillStatus:
    return _backfill_single(
        collection=db.jobtitles,
        doc_id=title_id,
        embedding=title_embedding,
        entity_name="job_title",
    )
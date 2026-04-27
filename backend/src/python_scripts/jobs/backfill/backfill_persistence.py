import logging
from typing import NamedTuple

from bson import ObjectId
from pymongo import UpdateOne
import torch
from config.database import db

logger = logging.getLogger(__name__)

class BackfillStatus(NamedTuple):
    matched: int
    modified: int
    failed: int

def _backfill_single(
    collection,
    doc_id: str,
    embedding: torch.Tensor,
    entity_name: str,
) -> BackfillStatus:
    if not doc_id or embedding is None:
        return BackfillStatus(0, 0, 0)
    
    try:
        if isinstance(embedding, torch.Tensor):
            embedding = embedding.detach().cpu().tolist()

        result = collection.update_one(
            { "_id": ObjectId(doc_id) },
            { "$set": { "embedding": embedding } }
        )

        logger.info(
            f"Backfill {entity_name} complete: "
            f"matched={result.matched_count} modified={result.modified_count}"
        )

        return BackfillStatus(
            matched=result.matched_count,
            modified=result.modified_count,
            failed=0,
        )

    except Exception as e:
        logger.error(f"Backfill {entity_name} failed for {doc_id}: {e}")
        return BackfillStatus(0, 0, 1)
    
def _backfill_batch(
    collection,
    ids: list[str],
    embeddings: list[torch.Tensor],
    entity_name: str,
) -> BackfillStatus:
    if not ids or not embeddings:
        return BackfillStatus(0, 0, 0)

    if len(ids) != len(embeddings):
        logger.error(
            f"{entity_name}: ID count ({len(ids)}) != embedding count ({len(embeddings)})"
        )
        return BackfillStatus(0, 0, len(ids))

    operations = []
    failed = 0

    for doc_id, emb in zip(ids, embeddings):
        try:
            if isinstance(emb, torch.Tensor):
                emb = emb.detach().cpu().tolist()

            operations.append(
                UpdateOne(
                    {"_id": ObjectId(doc_id)},
                    {"$set": {"embedding": emb}},
                )
            )
        except Exception as e:
            logger.error(f"{entity_name}: failed for {doc_id}: {e}")
            failed += 1

    if not operations:
        return BackfillStatus(0, 0, failed)

    result = collection.bulk_write(operations, ordered=False)

    logger.info(
        f"{entity_name} backfill complete: "
        f"matched={result.matched_count} modified={result.modified_count} failed={failed}"
    )

    return BackfillStatus(
        matched=result.matched_count,
        modified=result.modified_count,
        failed=failed,
    )
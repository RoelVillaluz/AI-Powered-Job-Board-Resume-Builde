"""
Cache outcome taxonomy for embedding task instrumentation.
"""

from enum import StrEnum


class CacheOutcome(StrEnum):
    HIT = "hit"  # embedding loaded from pre-fetched doc, no model call
    MISS = "miss"  # entity absent from pre-fetched docs, model called
    NULL_BACKFILL = "null_backfill"  # doc exists but embedding was null, model called,
    # caller should write the new vector back to DB
    SKIPPED = "skipped"  # section absent from document, nothing to compute

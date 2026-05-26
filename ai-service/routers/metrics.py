from prometheus_client import CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
from metrics import registry
from fastapi import APIRouter, Response

registry = CollectorRegistry()

# ── Router ─────────────────────────────────────────────────────────────────────
router = APIRouter()

@router.get('/metrics')
async def metrics():
    """Prometheus metrics endpoint — scraped every 15s by Prometheus."""
    return Response(
        content=generate_latest(registry),
        media_type=CONTENT_TYPE_LATEST,
    )
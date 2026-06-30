from prometheus_client import generate_latest, CONTENT_TYPE_LATEST, REGISTRY
from fastapi import APIRouter, Response

router = APIRouter()


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint — scraped every 15s by Prometheus."""
    return Response(
        content=generate_latest(REGISTRY),
        media_type=CONTENT_TYPE_LATEST,
    )

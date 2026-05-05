# ── Health check ───────────────────────────────────────────────────────────────
# @app.get() is like app.get() in express.
# FastAPI automatically serializes the returned dict to JSON.
# No res.json() needed — whatever you return becomes the response body.
from fastapi import APIRouter

# ── Router ─────────────────────────────────────────────────────────────────────
router = APIRouter()

@router.get('/health')
async def health():
    return {
        'status': 'ok',
        'embedding_model': 'all-mpnet-base-v2'
    }
from fastapi import APIRouter
from routers.shared import ComputeRequest, wrap
from main_v2 import score_matches

router = APIRouter(prefix='/compute')

@router.post('/score_matches')
async def score_matches_endpoint(body: ComputeRequest) -> dict:
    data = body.model_dump()
    result = score_matches(
        resume=           data.get("resume", {}),
        job_matches=      data.get("jobMatches", []),
        skill_market_data=data.get("skillMarketData", []),  # ← added
    )
    if "error" not in result:
        result["usedPinecone"] = data.get("usedPinecone", False)
    return wrap(result)
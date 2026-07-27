from fastapi import APIRouter
from pydantic import BaseModel
from routers.shared import ComputeRequest, wrap
from handlers.matching_handler import score_matches
from handlers.match_insight_handler import generate_match_insight

router = APIRouter(prefix="/compute")

class MatchInsightRequest(BaseModel):
    resume: dict
    matches: list[dict]
    jobId: str


@router.post("/generate_match_insight")
async def generate_match_insight_endpoint(body: MatchInsightRequest) -> dict:
    result = generate_match_insight(
        resume=body.resume,
        matches=body.matches,
        job_id=body.jobId,
    )
    return wrap(result)


@router.post("/score_matches")
async def score_matches_endpoint(body: ComputeRequest) -> dict:
    data = body.model_dump()
    result = score_matches(
        resume=data.get("resume", {}),
        job_matches=data.get("jobMatches", []),
        skill_market_data=data.get("skillMarketData", []),  # ← added
    )
    if "error" not in result:
        result["usedPinecone"] = data.get("usedPinecone", False)
    return wrap(result)
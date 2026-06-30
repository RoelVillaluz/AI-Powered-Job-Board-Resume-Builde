from fastapi import APIRouter
from routers.shared import ComputeRequest, wrap
from handlers.resume_handlers import score_resume
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compute")


@router.post("/score_resume")
async def calculate_score(body: ComputeRequest) -> dict:
    data = body.model_dump()

    resume_body = data.get("resume", {})
    scoring_payload = {
        "resumeSkills": data.get("resumeSkills", []),
        "currentTitle": data.get("currentTitle"),
        "higherPayingTitles": data.get("higherPayingTitles", []),
        "skillMarketData": data.get("skillMarketData", []),
    }

    return wrap(score_resume(resume_body, scoring_payload))

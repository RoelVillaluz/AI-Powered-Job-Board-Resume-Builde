# routers/shared/auth.py
"""
Service-to-service auth.

Every /compute router is guarded by `verify_internal_service_key`. The Node
backend attaches `X-Internal-Service-Key` on every AI-service call (see
backend/src/infrastructure/clients/aiClientHandler.ts). The expected value is
configured via `AI_SERVICE_SHARED_SECRET` in `.env.dev` on both sides.

Infra routers (/health, /metrics) intentionally stay public.
"""

import os

from fastapi import Header, HTTPException

INTERNAL_SERVICE_KEY_HEADER = "X-Internal-Service-Key"
INTERNAL_SERVICE_KEY_ENV = "AI_SERVICE_SHARED_SECRET"


def verify_internal_service_key(
    x_internal_service_key: str | None = Header(
        default=None, alias=INTERNAL_SERVICE_KEY_HEADER
    ),
) -> None:
    expected = os.environ.get(INTERNAL_SERVICE_KEY_ENV, "")
    if not expected:
        raise HTTPException(
            status_code=500,
            detail=f"{INTERNAL_SERVICE_KEY_ENV} is not configured",
        )
    if x_internal_service_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")

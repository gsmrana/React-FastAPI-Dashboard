import time
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, status
from sqlalchemy import text
from app.db.database import engine
from app.schemas.health import (
    HealthLiveResponse, 
    HealthReadyResponse
)

START_TIME = time.time()
router = APIRouter()

@router.get(
    "/live",
    status_code=status.HTTP_200_OK,
    response_model=HealthLiveResponse,
)
async def liveness_check():
    """
    Check if the application is running
    """
    return HealthLiveResponse(
        status="alive",
        uptime_seconds=round(time.time() - START_TIME, 2),
        server_time=datetime.now(timezone.utc).isoformat(),
    )

@router.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    response_model=HealthReadyResponse,
)
async def readiness_check():
    """
    Check critical dependencies like database, redis
    """
    try:
        async with asyncio.timeout(5.0):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1;"))
        return HealthReadyResponse(
            status="ready", 
            detail="ok"
        )
    except Exception as e:
        return HealthReadyResponse(
            status="not_ready", 
            detail=str(e)
        )

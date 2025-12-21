from pydantic import BaseModel
from typing import List, Optional


class HealthLiveResponse(BaseModel):
    status: str    
    uptime_seconds: float
    server_time: str

class HealthReadyResponse(BaseModel):
    status: str
    detail: str

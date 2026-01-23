from pydantic import BaseModel


class HealthLiveResponse(BaseModel):
    status: str    
    uptime_seconds: float
    server_time: str

class HealthReadyResponse(BaseModel):
    status: str
    detail: str

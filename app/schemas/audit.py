import uuid
from typing import Optional
from datetime import datetime


class AuditSchema():
    created_at: datetime
    updated_at: Optional[datetime]
    deleted_at: Optional[datetime]
    
    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID]
    deleted_by: Optional[uuid.UUID]

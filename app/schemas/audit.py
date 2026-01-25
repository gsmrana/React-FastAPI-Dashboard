import uuid
from typing import Optional
from app.schemas.datetime_format import DbDatetime


class AuditSchema():
    created_at: DbDatetime
    updated_at: Optional[DbDatetime]
    deleted_at: Optional[DbDatetime]

    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID]
    deleted_by: Optional[uuid.UUID]

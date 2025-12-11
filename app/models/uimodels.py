from pydantic import BaseModel
from typing import List, Optional

class UploadResponse(BaseModel):
    document_id: str
    filename: str
    filesize: int
    message: str

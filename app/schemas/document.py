from pydantic import BaseModel
from typing import List, Optional


class FileOperation(BaseModel):
    file_name: str

class FileListResponse(BaseModel):
    count: int
    file_names: List[str]

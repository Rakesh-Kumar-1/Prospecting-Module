from pydantic import BaseModel
from typing import List

class NoteResponse(BaseModel):
    id: int
    note_text: str
    attachment_paths: List[str] | None

    class Config:
        orm_mode = True
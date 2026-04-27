from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os, shutil

from app.database import SessionLocal
from app.models import Note

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ================================
# POST /notes  (Add note + files)
# ================================
@router.post("/notes")
async def add_note(
    prospect_id: int = Form(...),
    note_text: str = Form(...),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):

    file_paths = []

    if files:
        for file in files:
            file_name = file.filename
            file_path = os.path.join(UPLOAD_DIR, file_name)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_paths.append(file_path)

    note = Note(
        prospect_id=prospect_id,
        note_text=note_text,
        attachment_paths=file_paths
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "message": "Note created",
        "data": note.id
    }


# ================================
# GET /notes/{prospectId}
# ================================
@router.get("/notes/{prospect_id}")
def get_notes(prospect_id: int, db: Session = Depends(get_db)):

    notes = db.query(Note).filter(
        Note.prospect_id == prospect_id
    ).all()

    result = []

    for n in notes:
        result.append({
            "id": n.id,
            "note_text": n.note_text,
            "attachments": n.attachment_paths
        })

    return result
from sqlalchemy import Column, Integer, Text, ForeignKey, JSON
from app.database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id"))
    note_text = Column(Text)
    attachment_paths = Column(JSON)   # multiple files
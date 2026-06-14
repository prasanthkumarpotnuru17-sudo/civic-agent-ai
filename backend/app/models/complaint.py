import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    email = Column(String, nullable=True)
    location = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    # AI Analysis & Assignment
    department = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    eta = Column(String, nullable=False)
    confidence = Column(Integer, default=100)
    summary = Column(String, nullable=False)
    reasoning = Column(String, nullable=False)
    
    # Workflow Status
    status = Column(String, default="Submitted", nullable=False)
    
    # Self-referencing link for multi-department child routing
    parent_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Self-referencing relationship
    parent = relationship("Complaint", remote_side=[id], backref="children")

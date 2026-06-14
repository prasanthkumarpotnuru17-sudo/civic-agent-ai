from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.database.database import get_db
from backend.app.models.complaint import Complaint
from backend.app.schemas.complaint import StatusUpdate

router = APIRouter(prefix="/api")

DEPARTMENT_MAP = {
    "electrical department": "Electrical Department",
    "electrical": "Electrical Department",
    "electricity": "Electrical Department",
    "water supply & sewerage board": "Water Supply & Sewerage Board",
    "water supply": "Water Supply & Sewerage Board",
    "water": "Water Supply & Sewerage Board",
    "sewerage": "Water Supply & Sewerage Board",
    "drainage": "Water Supply & Sewerage Board",
    "waste management corporation": "Waste Management Corporation",
    "sanitation": "Waste Management Corporation",
    "garbage": "Waste Management Corporation",
    "public works department (pwd)": "Public Works Department (PWD)",
    "public works department": "Public Works Department (PWD)",
    "pwd": "Public Works Department (PWD)",
    "roads": "Public Works Department (PWD)",
    "road": "Public Works Department (PWD)",
    "infrastructure": "Public Works Department (PWD)",
    "town planning / law enforcement": "Town Planning / Law Enforcement",
    "town planning": "Town Planning / Law Enforcement",
    "law enforcement": "Town Planning / Law Enforcement",
    "safety": "Town Planning / Law Enforcement",
    "public safety": "Town Planning / Law Enforcement"
}

@router.get("/department/{department}")
def get_department_complaints(department: str, db: Session = Depends(get_db)):
    normalized = department.strip().lower()
    mapped_name = DEPARTMENT_MAP.get(normalized)
    
    if not mapped_name:
        # Fallback to checking if the query string is a substring of any department name
        for key, value in DEPARTMENT_MAP.items():
            if normalized in key:
                mapped_name = value
                break

    if not mapped_name:
        mapped_name = department.title()  # Try title-casing as last resort

    complaints = db.query(Complaint).filter(Complaint.department == mapped_name).all()
    
    result = []
    for c in complaints:
        result.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "name": c.name,
            "mobile": c.mobile,
            "email": c.email,
            "location": c.location,
            "description": c.description,
            "department": c.department,
            "priority": c.priority,
            "eta": c.eta,
            "confidence": c.confidence,
            "summary": c.summary,
            "reasoning": c.reasoning,
            "status": c.status,
            "parent_id": c.parent_id,
            "submittedAt": c.created_at.isoformat()
        })
    return result

@router.put("/complaints/{complaintId}/status")
def update_complaint_status_endpoint(complaintId: str, payload: StatusUpdate, db: Session = Depends(get_db)):
    normalized = complaintId.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == normalized).first()
    
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaintId} not found."
        )

    complaint.status = payload.status
    if payload.remarks:
        complaint.reasoning = payload.remarks

    db.commit()
    db.refresh(complaint)

    return {
        "complaintId": complaint.complaint_id,
        "status": complaint.status,
        "remarks": complaint.reasoning
    }

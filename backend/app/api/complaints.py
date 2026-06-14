from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.complaint import Complaint
from backend.app.schemas.complaint import AnalysisRequest, AnalysisResponse, ComplaintCreate
from backend.app.services.gemini_service import analyze_complaint_via_gemini
from backend.app.services.routing_service import analyze_complaint_locally
from backend.app.services.complaint_service import create_citizen_complaint

router = APIRouter(prefix="/api")

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_complaint_endpoint(payload: AnalysisRequest):
    analysis = analyze_complaint_via_gemini(payload.description)
    if not analysis:
        print("Using local routing fallback in analyze endpoint...")
        analysis = analyze_complaint_locally(payload.description)

    # Map output fields according to the new spec
    return {
        "analysis_status": analysis.get("analysis_status", "success"),
        "detected_language": analysis.get("detected_language", "English"),
        "auto_category": analysis.get("auto_category", "Other / Unclassified"),
        "routed_department": analysis.get("routed_department", "Town Planning / Law Enforcement"),
        "priority_level": analysis.get("priority_level", "MEDIUM"),
        "estimated_resolution_eta": analysis.get("estimated_resolution_eta", "2-3 Days"),
        "severity_score_out_of_10": int(analysis.get("severity_score_out_of_10", 5)),
        "ai_generated_summary": analysis.get("ai_generated_summary", ""),
        "extracted_location_hints": analysis.get("extracted_location_hints", "None"),
        "immediate_next_steps": analysis.get("immediate_next_steps", ["Verify details."])
    }

@router.post("/complaints")
def create_complaint_endpoint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    try:
        complaint = create_citizen_complaint(db, payload)
        return {
            "complaintId": complaint.complaint_id,
            "department": complaint.department,
            "priority": complaint.priority
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting complaint: {e}"
        )

@router.get("/complaints")
def get_all_complaints_endpoint(db: Session = Depends(get_db)):
    try:
        complaints = db.query(Complaint).all()
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving complaints: {e}"
        )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.complaint import Complaint

router = APIRouter(prefix="/api")

STATUSES = [
    "Submitted",
    "AI Analysis Completed",
    "Department Assigned",
    "Officer Assigned",
    "Work Order Generated",
    "In Progress",
    "Resolved"
]

OFFICERS = {
    "Electrical Department": "Officer R. Srinivas",
    "Water Supply & Sewerage Board": "Officer K. Ramana",
    "Waste Management Corporation": "Officer M. Suresh",
    "Public Works Department (PWD)": "Officer G. Venkat",
    "Town Planning / Law Enforcement": "Officer T. Satish"
}

@router.get("/track/{complaintId}")
def track_complaint_endpoint(complaintId: str, db: Session = Depends(get_db)):
    normalized = complaintId.strip().upper()
    complaint = db.query(Complaint).filter(Complaint.complaint_id == normalized).first()
    
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaintId} not found."
        )

    # Calculate status index in timeline
    timeline_status = 0
    if complaint.status in STATUSES:
        timeline_status = STATUSES.index(complaint.status)

    # Generate dynamic officer
    officer = OFFICERS.get(complaint.department, "Officer In-Charge")

    # Generate dynamic officer notes
    if complaint.status == "Resolved":
        officer_notes = f"Resolution verified. Task completed by {officer}."
    elif timeline_status >= 3:
        officer_notes = f"Field inspection scheduled by {officer}. Equipment dispatched."
    else:
        officer_notes = "Awaiting officer dispatch and schedule."

    # Build history timeline dynamically
    history = []
    created_time = complaint.created_at.strftime("%I:%M %p, %d %b %Y")
    updated_time = complaint.updated_at.strftime("%I:%M %p, %d %b %Y")

    history.append({
        "label": "Submitted",
        "note": "Citizen complaint received and logged in governance portal.",
        "time": created_time
    })

    if timeline_status >= 1:
        history.append({
            "label": "AI Analysis Completed",
            "note": f"Grievance evaluated. AI Confidence: {complaint.confidence}%.",
            "time": created_time
        })
    if timeline_status >= 2:
        history.append({
            "label": "Department Assigned",
            "note": f"Auto-routed to {complaint.department}.",
            "time": created_time
        })
    if timeline_status >= 3:
        history.append({
            "label": "Officer Assigned",
            "note": f"Assigned to field manager {officer}.",
            "time": updated_time
        })
    if timeline_status >= 4:
        history.append({
            "label": "Work Order Generated",
            "note": "Municipal dispatch and logistics scheduled.",
            "time": updated_time
        })
    if timeline_status >= 5:
        history.append({
            "label": "In Progress",
            "note": "On-site restoration and engineering actions underway.",
            "time": updated_time
        })
    if timeline_status >= 6:
        history.append({
            "label": "Resolved",
            "note": "Issue rectified, safety confirmed, and ticket marked closed.",
            "time": updated_time
        })

    # Fetch linked child tickets for multi-department scenarios
    linked_records = []
    if not complaint.parent_id:  # Only parent tickets hold child relationships
        children = db.query(Complaint).filter(Complaint.parent_id == complaint.id).all()
        linked_records = [
            {
                "id": child.complaint_id,
                "department": child.department,
                "status": child.status
            }
            for child in children
        ]

    # Return output (Feature 5 format + extra metadata for React frontend!)
    return {
        "complaintId": complaint.complaint_id,
        "status": complaint.status,
        "department": complaint.department,
        "priority": complaint.priority,
        "eta": complaint.eta,
        "name": complaint.name,
        "mobile": complaint.mobile,
        "location": complaint.location,
        "description": complaint.description,
        "summary": complaint.summary,
        "assignedOfficer": officer,
        "officerNotes": officer_notes,
        "timelineStatus": timeline_status,
        "history": history,
        "reasoning": {
            "routing": complaint.reasoning,
            "priority": f"Priority set to {complaint.priority} due to civic safety markers.",
            "eta": f"Resolution SLA set to {complaint.eta} to comply with municipal directives."
        },
        "linkedRecords": linked_records,
        "submittedAt": complaint.created_at.isoformat()
    }

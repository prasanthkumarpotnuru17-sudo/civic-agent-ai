from sqlalchemy.orm import Session
from backend.app.models.complaint import Complaint
from backend.app.schemas.complaint import ComplaintCreate
from backend.app.services.gemini_service import analyze_complaint_via_gemini
from backend.app.services.routing_service import analyze_complaint_locally
from backend.app.utils.id_generator import generate_next_complaint_id

def create_citizen_complaint(db: Session, schema: ComplaintCreate) -> Complaint:
    # 1. Run AI analysis (Gemini with local fallback)
    analysis = analyze_complaint_via_gemini(schema.description)
    if not analysis:
        print("Using local routing engine fallback...")
        analysis = analyze_complaint_locally(schema.description)

    # If analysis was rejected (spam/offensive)
    if analysis.get("analysis_status") == "rejected":
        # Create a rejected complaint with minimal fields
        parent_complaint_id = generate_next_complaint_id(db)
        rejected_complaint = Complaint(
            complaint_id=parent_complaint_id,
            name=schema.name,
            mobile=schema.mobile,
            email=schema.email,
            location=schema.location,
            description=schema.description,
            department="Town Planning / Law Enforcement",
            priority="LOW",
            eta="5-7 Days",
            confidence=10,
            summary=analysis.get("ai_generated_summary", "Rejected as spam."),
            reasoning="Grievance flagged and rejected by AI spam detection system.",
            status="Rejected",
            parent_id=None
        )
        db.add(rejected_complaint)
        db.commit()
        db.refresh(rejected_complaint)
        return rejected_complaint

    primary_dept = analysis.get("routed_department", "Town Planning / Law Enforcement")
    
    # Extract departments list for multi-department splits
    # If Gemini ran: it returns a `departments` array.
    # If local routing ran: it returns a `_departments` array.
    departments = analysis.get("departments") or analysis.get("_departments") or [primary_dept]

    # Generate unique complaint ID
    parent_complaint_id = generate_next_complaint_id(db)

    # Format reasoning to include next steps and landmarks
    landmarks = analysis.get("extracted_location_hints", "None")
    next_steps = ", ".join(analysis.get("immediate_next_steps", []))
    full_reasoning = f"Category: {analysis.get('auto_category')}. Landmarks: {landmarks}. Next steps: {next_steps}"

    # Create parent complaint database record
    parent_complaint = Complaint(
        complaint_id=parent_complaint_id,
        name=schema.name,
        mobile=schema.mobile,
        email=schema.email,
        location=schema.location,
        description=schema.description,
        department=primary_dept,
        priority=analysis.get("priority_level", "MEDIUM"),
        eta=analysis.get("estimated_resolution_eta", "2-3 Days"),
        confidence=int(analysis.get("confidence", 10 * analysis.get("severity_score_out_of_10", 8))),
        summary=analysis.get("ai_generated_summary", ""),
        reasoning=full_reasoning,
        status="Submitted",
        parent_id=None
    )
    
    db.add(parent_complaint)
    db.commit()
    db.refresh(parent_complaint)

    # Handle multi-department child ticket creation
    if len(departments) > 1:
        for idx, dept in enumerate(departments):
            child_id = f"{parent_complaint_id}-{chr(65 + idx)}"
            child_complaint = Complaint(
                complaint_id=child_id,
                name=schema.name,
                mobile=schema.mobile,
                email=schema.email,
                location=schema.location,
                description=schema.description,
                department=dept,
                priority=parent_complaint.priority,
                eta=parent_complaint.eta,
                confidence=parent_complaint.confidence,
                summary=parent_complaint.summary,
                reasoning=parent_complaint.reasoning,
                status="Submitted",
                parent_id=parent_complaint.id
            )
            db.add(child_complaint)
        db.commit()
        db.refresh(parent_complaint)

    return parent_complaint

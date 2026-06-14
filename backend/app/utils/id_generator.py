import datetime
from sqlalchemy.orm import Session
from backend.app.models.complaint import Complaint

def generate_next_complaint_id(db: Session) -> str:
    current_year = datetime.datetime.now().year
    # Count how many parent complaints (where parent_id is NULL) exist for the current year
    year_prefix = f"CMP-{current_year}-"
    
    count = db.query(Complaint).filter(
        Complaint.complaint_id.like(f"{year_prefix}%"),
        Complaint.parent_id == None
    ).count()
    
    next_number = count + 1
    return f"CMP-{current_year}-{next_number:04d}"

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AnalysisRequest(BaseModel):
    description: str

class AnalysisResponse(BaseModel):
    analysis_status: str
    detected_language: str
    auto_category: str
    routed_department: str
    priority_level: str
    estimated_resolution_eta: str
    severity_score_out_of_10: int
    ai_generated_summary: str
    extracted_location_hints: str
    immediate_next_steps: List[str]

class ComplaintCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    email: Optional[str] = None
    location: str = Field(..., min_length=1)
    description: str = Field(..., min_length=12)

class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    name: str
    mobile: str
    email: Optional[str] = None
    location: str
    description: str
    department: str
    priority: str
    eta: str
    confidence: int
    summary: str
    reasoning: str
    status: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    children: List["ComplaintResponse"] = []

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None

import os
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.database import Base, engine, SessionLocal
from backend.app.models.complaint import Complaint
from backend.app.api import complaints, tracking, department

# Create Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CivicAgent AI Backend",
    description="Agentic Smart City Governance Platform API",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"  # Fallback helper for easy development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "CivicAgent AI Backend"
    }

# Include routers
app.include_router(complaints.router)
app.include_router(tracking.router)
app.include_router(department.router)

# Seed initial hackathon demo complaints
def seed_demo_data():
    db = SessionLocal()
    try:
        count = db.query(Complaint).count()
        if count > 0:
            return  # Data already seeded

        print("Seeding initial hackathon demo complaints...")
        now = datetime.datetime.utcnow()

        # Demo Complaint 1: Streetlight near school
        c1 = Complaint(
            complaint_id="CMP-2026-0001",
            name="Asha Reddy",
            mobile="9876543210",
            email="asha@example.com",
            location="Jubilee Hills, Road No 10, Hyderabad",
            description="Streetlight near the primary school is not working. The street is pitch dark at night, posing safety risks for children returning late.",
            department="Electrical Department",
            priority="HIGH",
            eta="12–24 Hours",
            confidence=96,
            summary="Streetlight near school not working",
            reasoning="Category: Streetlight Issues. Landmarks: near the primary school. Next steps: Dispatch inspector from Electrical Department to verify location, Perform site verification and safety assessment.",
            status="Submitted",
            created_at=now - datetime.timedelta(days=2),
            updated_at=now - datetime.timedelta(days=2)
        )
        db.add(c1)

        # Demo Complaint 2: Garbage not collected for 5 days
        c2 = Complaint(
            complaint_id="CMP-2026-0002",
            name="Satish Kumar",
            mobile="7013824419",
            email="satish@gmail.com",
            location="Gachibowli, Hyderabad",
            description="Garbage has not been collected for 5 days on our street. The dump yard is overflowing and causing a terrible smell in the entire area.",
            department="Waste Management Corporation",
            priority="MEDIUM",
            eta="2–3 Days",
            confidence=94,
            summary="Garbage not collected for 5 days",
            reasoning="Category: Garbage Collection. Landmarks: None. Next steps: Dispatch inspector from Waste Management Corporation to verify location, Perform site verification and safety assessment.",
            status="In Progress",
            created_at=now - datetime.timedelta(days=1),
            updated_at=now - datetime.timedelta(hours=6)
        )
        db.add(c2)

        # Demo Complaint 3: Water leakage damaged road (Multi-department)
        c3 = Complaint(
            complaint_id="CMP-2026-0003",
            name="Ramesh Reddy",
            mobile="8123456780",
            email="ramesh@outlook.com",
            location="Madhapur, Metro Station Area, Hyderabad",
            description="A major water pipe leak is flooding the road, which has now damaged the asphalt pavement causing major potholes near the metro staircase.",
            department="Water Supply & Sewerage Board",
            priority="CRITICAL",
            eta="2–6 Hours",
            confidence=92,
            summary="Water leakage damaged road",
            reasoning="Category: Water Leakage. Landmarks: near the metro staircase. Next steps: ALERT: Initiate emergency quick response team dispatch, Dispatch inspector from Water Supply & Sewerage Board to verify location, Perform site verification.",
            status="Officer Assigned",
            created_at=now - datetime.timedelta(hours=12),
            updated_at=now - datetime.timedelta(hours=4)
        )
        db.add(c3)
        db.commit()
        db.refresh(c3)

        # Child A: Water Supply & Sewerage Board
        c3_a = Complaint(
            complaint_id="CMP-2026-0003-A",
            name="Ramesh Reddy",
            mobile="8123456780",
            email="ramesh@outlook.com",
            location="Madhapur, Metro Station Area, Hyderabad",
            description="A major water pipe leak is flooding the road, which has now damaged the asphalt pavement causing major potholes near the metro staircase.",
            department="Water Supply & Sewerage Board",
            priority="CRITICAL",
            eta="2–6 Hours",
            confidence=92,
            summary="Water leakage damaged road",
            reasoning="Category: Water Leakage. Landmarks: near the metro staircase. Next steps: ALERT: Initiate emergency quick response team dispatch, Dispatch inspector from Water Supply & Sewerage Board to verify location, Perform site verification.",
            status="Officer Assigned",
            parent_id=c3.id,
            created_at=now - datetime.timedelta(hours=12),
            updated_at=now - datetime.timedelta(hours=4)
        )
        db.add(c3_a)

        # Child B: Public Works Department (PWD)
        c3_b = Complaint(
            complaint_id="CMP-2026-0003-B",
            name="Ramesh Reddy",
            mobile="8123456780",
            email="ramesh@outlook.com",
            location="Madhapur, Metro Station Area, Hyderabad",
            description="A major water pipe leak is flooding the road, which has now damaged the asphalt pavement causing major potholes near the metro staircase.",
            department="Public Works Department (PWD)",
            priority="CRITICAL",
            eta="2–6 Hours",
            confidence=92,
            summary="Water leakage damaged road",
            reasoning="Category: Road Damage. Landmarks: near the metro staircase. Next steps: ALERT: Initiate emergency quick response team dispatch, Dispatch inspector from Public Works Department (PWD) to verify location, Perform site verification.",
            status="Submitted",
            parent_id=c3.id,
            created_at=now - datetime.timedelta(hours=12),
            updated_at=now - datetime.timedelta(hours=12)
        )
        db.add(c3_b)
        db.commit()
        print("Demo complaints seeded successfully.")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

seed_demo_data()

import re

DEPARTMENTS_KEYWORDS = {
    "Electrical Department": ["streetlight", "electric", "wire", "transformer", "power", "light"],
    "Water Supply & Sewerage Board": ["water", "pipeline", "pipe", "leak", "leakage", "tap", "drain", "drainage", "sewage", "sewer", "overflow", "flooding"],
    "Waste Management Corporation": ["garbage", "waste", "trash", "clean", "cleaning", "dump"],
    "Public Works Department (PWD)": ["road", "pothole", "footpath", "bridge", "pavement", "infrastructure", "park"],
    "Town Planning / Law Enforcement": ["hazard", "danger", "risk", "accident", "unsafe", "emergency", "encroachment", "parking"]
}

CATEGORY_MAP = {
    "Electrical Department": "Streetlight Issues",
    "Waste Management Corporation": "Garbage Collection",
    "Water Supply & Sewerage Board": "Water Leakage", # Default to Water Leakage, will check below
    "Public Works Department (PWD)": "Road Damage",
    "Town Planning / Law Enforcement": "Public Safety"
}

PRIORITY_SIGNALS = {
    "CRITICAL": ["flood", "flooding", "manhole", "live wire", "structural collapse", "burst"],
    "HIGH": ["danger", "emergency", "unsafe", "accident", "fire", "shock", "risk", "school", "hospital", "child"],
    "MEDIUM": ["block", "blocked", "smell", "overflow", "leak", "leakage", "trash", "garbage", "pothole"],
    "LOW": ["request", "minor", "suggestion", "maintenance", "paint", "cleaning"]
}

def analyze_complaint_locally(description: str) -> dict:
    desc_lower = description.lower()
    
    # 1. Spam/Gibberish check
    if len(desc_lower.strip()) < 8 or not re.search(r'[a-zA-Z]', desc_lower):
        return {
            "analysis_status": "rejected",
            "detected_language": "English",
            "auto_category": "Other / Unclassified",
            "routed_department": "Town Planning / Law Enforcement",
            "priority_level": "LOW",
            "estimated_resolution_eta": "5-7 Days",
            "severity_score_out_of_10": 1,
            "ai_generated_summary": "Complaint rejected: Input too short or contains spam/gibberish.",
            "extracted_location_hints": "None",
            "immediate_next_steps": ["Verify citizen input credibility."]
        }

    # 2. Count keyword matches for each department
    matches = {}
    for dept, keywords in DEPARTMENTS_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower))
        if score > 0:
            matches[dept] = score

    # Sort matching departments by score descending
    sorted_depts = [dept for dept, _ in sorted(matches.items(), key=lambda item: item[1], reverse=True)]
    
    # Fallback if no department matches
    if not sorted_depts:
        sorted_depts = ["Town Planning / Law Enforcement"]

    primary_dept = sorted_depts[0]
    
    # 3. Category Auto-Detection
    category = CATEGORY_MAP.get(primary_dept, "Other / Unclassified")
    if primary_dept == "Water Supply & Sewerage Board":
        if any(w in desc_lower for w in ["drain", "sewage", "sewer", "overflow"]):
            category = "Drainage Issues"
        elif any(w in desc_lower for w in ["drinking", "shortage", "quality", "tap"]):
            category = "Water Supply"
        else:
            category = "Water Leakage"
    elif primary_dept == "Public Works Department (PWD)":
        if any(w in desc_lower for w in ["footpath", "park", "infrastructure", "fixture"]):
            category = "Public Infrastructure"
        else:
            category = "Road Damage"

    # 4. Priority Assessment
    priority = "LOW"
    severity_score = 3
    if any(sig in desc_lower for sig in PRIORITY_SIGNALS["CRITICAL"]):
        priority = "CRITICAL"
        severity_score = 9
    elif any(sig in desc_lower for sig in PRIORITY_SIGNALS["HIGH"]):
        priority = "HIGH"
        severity_score = 7
    elif any(sig in desc_lower for sig in PRIORITY_SIGNALS["MEDIUM"]):
        priority = "MEDIUM"
        severity_score = 5

    # 5. ETA Calculation
    if priority == "CRITICAL":
        eta = "2–6 Hours"
    elif priority == "HIGH":
        eta = "12–24 Hours"
    elif priority == "MEDIUM":
        eta = "2–3 Days"
    else:
        eta = "5–7 Days"

    # 6. Extract simple landmarks (like "near X", "opposite Y", "at Z")
    location_hints = "None"
    landmark_match = re.search(r'(?:near|opposite|behind|at|in|next to)\s+([a-zA-Z0-9\s]+)', description, re.IGNORECASE)
    if landmark_match:
        location_hints = landmark_match.group(0).strip()

    # Generate summary
    summary_words = description.split()
    summary = " ".join(summary_words[:8]) + "..." if len(summary_words) > 8 else description

    # Actions list
    next_steps = [
        f"Dispatch inspector from {primary_dept} to verify location.",
        "Perform site verification and safety assessment."
    ]
    if priority == "CRITICAL":
        next_steps.insert(0, "ALERT: Initiate emergency quick response team dispatch.")

    # We store the departments in a hidden dict value to support multi-department routing
    return {
        "analysis_status": "success",
        "detected_language": "English",
        "auto_category": category,
        "routed_department": primary_dept,
        "priority_level": priority,
        "estimated_resolution_eta": eta,
        "severity_score_out_of_10": severity_score,
        "ai_generated_summary": summary,
        "extracted_location_hints": location_hints,
        "immediate_next_steps": next_steps,
        "_departments": sorted_depts[:2]  # internal helper for multi-department split
    }

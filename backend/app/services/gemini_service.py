import os
import json
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def analyze_complaint_via_gemini(description: str) -> Optional[dict]:
    if not api_key:
        print("Gemini API key not configured.")
        return None

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        You are the core AI intelligence engine for CivicAgent AI, an Autonomous Smart City Governance Platform. 
        Your role is to analyze unstructured citizen grievances and convert them into structured, actionable, and routed data for city municipal departments.

        When a citizen submits a complaint, analyze the input and extract the required metrics with extreme precision.

        ---

        ### 1. CORE RESPONSIBILITIES

        1.  **Language Detection & Translation:**
            * Detect the input language (e.g., English, Telugu).
            * Always generate the "Cleaned Summary" and "Actionable Tasks" in English for administrative standardized tracking, while preserving local landmarks.

        2.  **Category Auto-Detection:**
            * Classify the complaint into exactly ONE of the following official categories:
                * `Streetlight Issues`
                * `Garbage Collection`
                * `Water Supply`
                * `Water Leakage`
                * `Road Damage`
                * `Drainage Issues`
                * `Public Safety`
                * `Public Infrastructure`
                * `Other / Unclassified`

        3.  **Department Routing:**
            * Route the ticket to the correct municipal wing:
                * `Electrical Department` (for Streetlight Issues)
                * `Waste Management Corporation` (for Garbage Collection)
                * `Water Supply & Sewerage Board` (for Water Supply, Water Leakage, Drainage Issues)
                * `Public Works Department (PWD)` (for Road Damage, Public Infrastructure)
                * `Town Planning / Law Enforcement` (for Public Safety, unclassified obstructions)

        4.  **Priority & Emergency Assessment:**
            * Assign a priority level: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
            * *Critical Criteria:* Severe flooding, open live electrical wires, missing manhole covers on main roads, or major water main bursts causing structural risk.

        5.  **ETA Calculation:**
            * Provide a realistic Estimated Time to Resolution (ETA) based on priority:
                * CRITICAL: 2–6 Hours
                * HIGH: 12–24 Hours
                * MEDIUM: 2–3 Days
                * LOW: 5–7 Days

        ---

        ### 2. GROUNDING & SAFETY RULES

        * **No Hallucinations:** Only extract landmarks and location hints explicitly stated in the text. Do not guess a city or pin if not provided.
        * **Tone:** Objective, administrative, and public-safety oriented.
        * **Profanity & Spam Handling:** If the input is gibberish, offensive, or clearly spam, set `"analysis_status": "rejected"`, leave other fields null, and add an explanation in `"ai_generated_summary"`.

        ---

        ### 3. INPUT TO ANALYZE

        Citizen Complaint Description: "{description}"

        ---

        ### 4. OUTPUT FORMAT

        You must output valid JSON only. Do not include conversational prose, markdown code block wrappers (like ```json), or extra text outside the JSON object.

        {{
          "analysis_status": "success",
          "detected_language": "string",
          "auto_category": "string",
          "routed_department": "string",
          "priority_level": "LOW | MEDIUM | HIGH | CRITICAL",
          "estimated_resolution_eta": "string",
          "severity_score_out_of_10": 7,
          "ai_generated_summary": "A concise, clear 1-2 sentence professional summary of the issue for the officer dashboard.",
          "extracted_location_hints": "Any specific landmarks, cross-streets, or zones mentioned in the text.",
          "immediate_next_steps": [
            "Actionable step 1 for the assigned field team",
            "Actionable step 2 for verification"
          ]
        }}
        """

        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Clean up markdown wrapping if present
        if text_response.startswith("```"):
            text_response = text_response.replace("```json", "", 1)
            if text_response.endswith("```"):
                text_response = text_response[:-3]
            text_response = text_response.strip()

        data = json.loads(text_response)
        
        # Validate that status is present
        if "analysis_status" in data:
            return data
            
        print("Gemini response missing analysis_status.")
        return None

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

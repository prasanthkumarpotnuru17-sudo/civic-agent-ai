import { GoogleGenerativeAI } from "@google/generative-ai";

const departments = [
  {
    name: "Roads & Infrastructure",
    label: "Roads & Infrastructure",
    etaDefault: "3 Days",
    keywords: ["road", "roads", "street", "pothole", "potholes", "repair", "footpath", "bridge", "highway", "tar road", "cement road", "pavement"],
    phrases: ["damaged road", "broken road", "road crack", "road maintenance", "road construction", "repair road"],
    synonyms: ["asphalt", "concrete", "cracks", "pave", "paving"],
    priorityKeywords: ["collapsed", "dangerous pothole", "accident risk", "blocked road"]
  },
  {
    name: "Sanitation",
    label: "Sanitation",
    etaDefault: "3 Days",
    keywords: ["garbage", "trash", "waste", "dump", "dumping", "litter", "unclean", "cleaning", "sweeping", "smell", "dirty"],
    phrases: ["waste collection", "dirty area", "garbage bin", "garbage truck"],
    synonyms: ["rubbish", "refuse", "debris", "stench", "odor", "filthy"],
    priorityKeywords: ["toxic waste", "biohazard", "rotting carcass", "garbage overflow"]
  },
  {
    name: "Water Supply",
    label: "Water Supply",
    etaDefault: "24 Hours",
    keywords: ["water", "pipeline", "tank", "valve", "tap", "leak", "leakage"],
    phrases: ["pipe leak", "water leak", "water supply", "drinking water", "water pressure", "tap water"],
    synonyms: ["burst", "dripping", "contamination", "chlorine"],
    priorityKeywords: ["pipe burst", "contaminated water", "no water supply", "flooding leak"]
  },
  {
    name: "Drainage",
    label: "Drainage",
    etaDefault: "24 Hours",
    keywords: ["drain", "drainage", "sewage", "gutter", "overflow"],
    phrases: ["water logging", "manhole overflow", "blocked drain", "drain blockage"],
    synonyms: ["clogged", "blocked", "sewer", "sinkhole", "stagnant", "manhole"],
    priorityKeywords: ["sewage flooding", "drainage collapse", "drain overflow"]
  },
  {
    name: "Electrical",
    label: "Electrical Department",
    etaDefault: "24 Hours",
    keywords: ["streetlight", "power", "electricity", "wire", "cable", "transformer", "current", "pole", "light"],
    phrases: ["street light", "electric pole", "power cut", "voltage fluctuation", "electric wire"],
    synonyms: ["flickering", "darkness", "sparking", "blackout", "hanging"],
    priorityKeywords: ["hanging wire", "wire sparking", "transformer blast", "live wire"]
  },
  {
    name: "Public Safety",
    label: "Public Safety",
    etaDefault: "12 Hours",
    keywords: ["accident", "hazard", "danger", "unsafe", "crime", "security", "risk", "school", "hospital"],
    phrases: ["fallen tree", "open manhole", "building collapse", "safety hazard"],
    synonyms: ["threat", "emergency", "harm"],
    priorityKeywords: ["immediate threat", "structural collapse", "falling debris", "accident risk"]
  }
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function detectIntents(text) {
  const intents = [];
  if (["road", "pothole", "footpath", "bridge", "highway", "repair", "pavement"].some(w => text.includes(w))) {
    intents.push("Infrastructure Issue");
  }
  if (["streetlight", "street light", "power", "electricity", "wire", "cable", "transformer", "utility", "electric"].some(w => text.includes(w))) {
    intents.push("Utility Issue");
  }
  if (["accident", "hazard", "danger", "unsafe", "crime", "security", "risk", "manhole", "fire", "hanging"].some(w => text.includes(w))) {
    intents.push("Safety Issue");
  }
  if (["garbage", "trash", "waste", "dump", "dumping", "litter", "unclean", "cleaning", "sweeping", "smell", "dirty", "filthy"].some(w => text.includes(w))) {
    intents.push("Sanitation Issue");
  }
  if (["water", "pipeline", "pipe", "leak", "leakage", "drinking water"].some(w => text.includes(w))) {
    intents.push("Water Issue");
  }
  if (["drain", "drainage", "sewage", "gutter", "overflow"].some(w => text.includes(w))) {
    intents.push("Drainage Issue");
  }
  if (intents.length === 0) {
    return ["General Service Request"];
  }
  return intents;
}

function extractLocation(text) {
  const patterns = [
    /near\s+([A-Za-z0-9'\s\-&]+)/i,
    /at\s+([A-Za-z0-9'\s\-&]+)/i,
    /opposite\s+([A-Za-z0-9'\s\-&]+)/i,
    /behind\s+([A-Za-z0-9'\s\-&]+)/i,
    /in\s+([A-Za-z0-9'\s\-&]+)/i,
    /close to\s+([A-Za-z0-9'\s\-&]+)/i
  ];
  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].split(/[.,;]/)[0].trim();
      if (extracted.length > 3 && extracted.length < 50) {
        return extracted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  return null;
}

function determineBasePriority(text) {
  const criticalSignals = ["danger", "accident", "hospital", "school", "fire", "electrical hazard", "open manhole"];
  const highSignals = ["major leakage", "large pothole", "overflow", "streetlight failure", "leakage", "pothole", "hanging wire"];
  const mediumSignals = ["repair request", "maintenance", "cleaning delay", "repair", "collected"];

  if (criticalSignals.some(s => text.includes(s))) return "Critical";
  if (highSignals.some(s => text.includes(s))) return "High";
  if (mediumSignals.some(s => text.includes(s))) return "Medium";
  return "Low";
}

function boostPriority(priority, text) {
  const boosters = ["school", "hospital", "government office", "high traffic area", "market"];
  if (boosters.some(b => text.includes(b))) {
    if (priority === "Low") return "Medium";
    if (priority === "Medium") return "High";
    if (priority === "High") return "Critical";
  }
  return priority;
}

function determineEta(priority) {
  if (priority === "Critical") return "0-12 Hours";
  if (priority === "High") return "24 Hours";
  if (priority === "Medium") return "3 Days";
  return "5 Days";
}

function scoreDepartment(text, category, dept) {
  let score = 0;
  let matchedList = [];

  dept.priorityKeywords.forEach(pk => {
    if (text.includes(pk)) {
      score += 35;
      matchedList.push(pk);
    }
  });

  dept.phrases.forEach(phrase => {
    if (text.includes(phrase) && !matchedList.includes(phrase)) {
      score += 25;
      matchedList.push(phrase);
    }
  });

  dept.keywords.forEach(kw => {
    if (text.includes(kw) && !matchedList.includes(kw)) {
      score += 10;
      matchedList.push(kw);
    }
  });

  dept.synonyms.forEach(syn => {
    if (text.includes(syn) && !matchedList.includes(syn)) {
      score += 10;
      matchedList.push(syn);
    }
  });

  if (category) {
    const normalizedCat = category.toLowerCase().trim();
    const normalizedDeptName = dept.name.toLowerCase();
    let isCategoryMatch = false;

    if (normalizedCat === "streetlight issues" && dept.name === "Electrical") isCategoryMatch = true;
    else if (normalizedCat === "garbage collection" && dept.name === "Sanitation") isCategoryMatch = true;
    else if ((normalizedCat === "water supply" || normalizedCat === "water leakage") && dept.name === "Water Supply") isCategoryMatch = true;
    else if ((normalizedCat === "road damage" || normalizedCat === "public infrastructure") && dept.name === "Roads & Infrastructure") isCategoryMatch = true;
    else if (normalizedCat === "drainage issues" && dept.name === "Drainage") isCategoryMatch = true;
    else if (normalizedCat === "public safety" && dept.name === "Public Safety") isCategoryMatch = true;
    else if (normalizedCat.includes(normalizedDeptName.split(" ")[0])) isCategoryMatch = true;

    if (isCategoryMatch) {
      score += 40;
    }
  }

  return { score, matchedList };
}

function analyzeLocal(payload) {
  const cleanDesc = normalize(payload.description);
  const cleanLoc = normalize(payload.location);
  const cleanCat = normalize(payload.category);
  const text = `${cleanDesc} ${cleanLoc} ${cleanCat}`;

  const scoredDepts = departments.map(dept => {
    const { score, matchedList } = scoreDepartment(text, payload.category, dept);
    return { ...dept, score, matchedKeywords: matchedList };
  });

  const sortedDepts = [...scoredDepts].sort((a, b) => b.score - a.score);
  const matchedDepts = sortedDepts.filter(d => d.score > 0);
  const finalMatched = matchedDepts.length ? matchedDepts : [scoredDepts.find(d => d.name === "Public Safety")];

  const primaryDept = finalMatched[0];
  const multi = finalMatched.slice(0, 2);

  const totalScore = scoredDepts.reduce((sum, d) => sum + d.score, 0);
  let confidence = totalScore > 0 ? Math.round((primaryDept.score / totalScore) * 100) : 95;
  if (confidence < 70) confidence = 70;
  if (confidence > 99) confidence = 99;

  const basePriority = determineBasePriority(text);
  const priority = boostPriority(basePriority, text);
  const eta = determineEta(priority);

  const extractedLocation = extractLocation(payload.description) || payload.location || "City Area";
  const intents = detectIntents(text);
  const intentString = intents.join(" + ");
  const allMatchedKeywords = Array.from(new Set(scoredDepts.flatMap(d => d.matchedKeywords)));

  const departmentScores = {};
  scoredDepts.forEach(d => {
    departmentScores[d.name] = d.score;
  });

  const reasoning = {
    routing: `Detected ${intentString} based on keywords (${allMatchedKeywords.join(", ") || "none"}). Routed to ${primaryDept.label} with ${confidence}% match score.`,
    priority: `Priority set to ${priority} due to safety risks and proximity to key areas.`,
    eta: `SLA ETA resolved to ${eta} under ${priority} priority guidelines.`,
    routingReasoning: `Detected keywords: ${allMatchedKeywords.join(", ") || "none"}. Matched ${primaryDept.label} with high confidence.`
  };

  const summary = `${intentString} requiring ${primaryDept.name.toLowerCase()} intervention.`;

  return {
    departments: multi,
    primaryDepartment: primaryDept,
    priority,
    eta,
    summary,
    confidence,
    isMultiDepartment: multi.length > 1,
    officerNotes: priority === "Critical" || priority === "High"
      ? "Auto-escalated by explainable AI engine for rapid field assignment."
      : "Assigned for scheduled department review.",
    intent: intentString,
    detectedKeywords: allMatchedKeywords,
    departmentScores,
    selectedDepartment: primaryDept.label,
    extractedLocation,
    reasoning
  };
}

async function analyzeComplaint(payload) {
  const apiKey = localStorage.getItem("gemini_api_key");
  if (!apiKey) {
    console.log("No Gemini API key found. Using local V3 routing engine.");
    return analyzeLocal(payload);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are the AI Routing Engine of CivicAgent AI, a Smart City Governance Platform.
      Analyze the following citizen complaint and output a structured JSON response.

      Complaint Description: "${payload.description || ""}"
      Location: "${payload.location || ""}"
      Category Selected by Citizen: "${payload.category || "Auto-detect with AI"}"
      Language: "${payload.language || "English"}"

      Identify the appropriate municipal department(s) from this list:
      1. "Electrical" (label: "Electrical Department", eta: "24 Hours") - Handles streetlight, power, wiring, transformers.
      2. "Water Supply" (label: "Water Supply", eta: "24 Hours") - Handles pipe leaks, tap water supply.
      3. "Sanitation" (label: "Sanitation", eta: "3 Days") - Handles garbage, waste, cleaning, odors.
      4. "Roads & Infrastructure" (label: "Roads & Infrastructure", eta: "3 Days") - Handles potholes, damaged footpaths, road safety.
      5. "Drainage" (label: "Drainage", eta: "24 Hours") - Handles blocked drains, sewage flooding.
      6. "Public Safety" (label: "Public Safety", eta: "12 Hours") - Handles immediate safety hazards, unsafe structures.

      Rules:
      - Multi-department routing: If a complaint affects multiple departments, list BOTH in the "departments" array. The first one will be the primary department.
      - Priority: Critical (0-12 Hours), High (24 Hours), Medium (3 Days), Low (5 Days).
      - Boost priority by 1 level if the complaint contains school, hospital, government office, high traffic area, or market.
      - Extract any location names if mentioned in description (e.g. "near Railway Station").
      - Determine intent: Infrastructure Issue, Utility Issue, Safety Issue, Sanitation Issue, Water Issue, Drainage Issue, or General Service Request.

      Return ONLY a raw JSON object matching this schema, without any markdown formatting or codeblocks:
      {
        "primaryDepartment": {
          "name": "Electrical" | "Water Supply" | "Sanitation" | "Roads & Infrastructure" | "Drainage" | "Public Safety",
          "label": "..."
        },
        "departments": [
          { "name": "...", "label": "..." }
        ],
        "priority": "Critical" | "High" | "Medium" | "Low",
        "eta": "0-12 Hours" | "24 Hours" | "3 Days" | "5 Days",
        "confidence": 95,
        "intent": "...",
        "extractedLocation": "...",
        "detectedKeywords": ["...", "..."],
        "departmentScores": {
          "Electrical": 0,
          "Water Supply": 0,
          "Sanitation": 0,
          "Roads & Infrastructure": 0,
          "Drainage": 0,
          "Public Safety": 0
        },
        "summary": "...",
        "reasoning": {
          "routing": "Reason why this department was selected.",
          "priority": "Reason why this priority was selected.",
          "eta": "Reason why this ETA was set."
        }
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const data = JSON.parse(text);

    const validatedDept = departments.find(d => d.name === data.primaryDepartment.name) || departments[5];
    const validatedDepts = (data.departments || []).map(d => departments.find(orig => orig.name === d.name)).filter(Boolean);

    return {
      departments: validatedDepts.length ? validatedDepts : [validatedDept],
      primaryDepartment: validatedDept,
      priority: data.priority || "Medium",
      eta: data.eta || validatedDept.etaDefault,
      summary: data.summary || payload.description.slice(0, 80),
      confidence: data.confidence || 95,
      isMultiDepartment: validatedDepts.length > 1,
      officerNotes: data.priority === "Critical" || data.priority === "High"
        ? "Auto-escalated by explainable AI engine for rapid field assignment."
        : "Assigned for scheduled department review.",
      intent: data.intent || "General Service Request",
      detectedKeywords: data.detectedKeywords || [],
      departmentScores: data.departmentScores || {},
      selectedDepartment: validatedDept.label,
      extractedLocation: data.extractedLocation || payload.location || "City Area",
      reasoning: {
        routing: data.reasoning?.routing || `Gemini routed to ${validatedDept.label}.`,
        priority: data.reasoning?.priority || `Gemini priority set to ${data.priority}.`,
        eta: data.reasoning?.eta || `Gemini ETA set to ${data.eta}.`
      }
    };
  } catch (err) {
    console.error("Gemini API error, falling back to local V3 routing:", err);
    return analyzeLocal(payload);
  }
}

export const CivicAgentRoutingEngine = {
  departments,
  analyzeComplaint,
  analyzeLocal
};

import { CivicAgentFirebase } from "./firebaseConfig";
import { CivicAgentRoutingEngine } from "./routingEngine";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, setDoc, query, orderBy } from "firebase/firestore";

const localStorageKey = "civicAgentComplaints";

// Local storage helpers
function getLocalComplaints() {
  try {
    return JSON.parse(localStorage.getItem(localStorageKey) || "[]");
  } catch {
    return [];
  }
}

function saveLocalComplaints(complaints) {
  localStorage.setItem(localStorageKey, JSON.stringify(complaints));
}

// Generate the next complaint ID
async function nextComplaintId() {
  const complaints = await readComplaints();
  const year = new Date().getFullYear();
  const count = complaints.filter((c) => c.id && c.id.includes(`CMP-${year}`)).length + 1;
  return `CMP-${year}-${String(count).padStart(3, "0")}`;
}

// Create linked sub-tickets for multi-department routing
function createLinkedRecords(baseId, analysis) {
  if (!analysis.isMultiDepartment) return [];
  return analysis.departments.map((dept, index) => ({
    id: `${baseId}-${String.fromCharCode(65 + index)}`,
    department: dept.label,
    name: dept.name,
    status: index === 0 ? "Assigned" : "Linked",
    timelineStatus: 1
  }));
}

// Read all complaints
async function readComplaints() {
  const db = CivicAgentFirebase.db;
  if (CivicAgentFirebase.isConfigured() && db) {
    try {
      const q = query(collection(db, "complaints"), orderBy("submittedAt", "desc"));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ docId: docSnap.id, ...docSnap.data() });
      });
      if (list.length > 0) return list;
    } catch (err) {
      console.error("Firestore read error, using localStorage fallback:", err);
    }
  }
  
  // Fallback to local storage (sorted by submittedAt desc)
  return getLocalComplaints().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

// Submit a new complaint
async function submitComplaint(payload) {
  const id = await nextComplaintId();
  const analysis = await CivicAgentRoutingEngine.analyzeComplaint(payload);
  const now = new Date();
  
  const complaint = {
    id,
    fullName: payload.fullName,
    mobile: payload.mobile,
    email: payload.email || "",
    location: payload.location,
    category: payload.category || "Auto-detect",
    description: payload.description,
    language: payload.language || "English",
    imageName: payload.imageName || "",
    imageUrl: payload.imageUrl || "", // URL or local object URL
    submittedAt: now.toISOString(),
    status: "Submitted",
    remarks: "",
    timelineStatus: 0,
    analysis,
    linkedRecords: createLinkedRecords(id, analysis),
    history: [
      { status: "Submitted", timestamp: now.toISOString() }
    ],

    // Target Document Structure properties:
    complaintId: id,
    userId: payload.userId || null,
    name: payload.fullName,
    department: analysis.primaryDepartment?.label || "",
    priority: analysis.priority || "",
    eta: analysis.eta || "",
    confidence: Number(analysis.confidence) || 96,
    summary: analysis.summary || "",
    reasoning: typeof analysis.reasoning === 'object'
      ? `Routing: ${analysis.reasoning?.routing || ""}; Priority: ${analysis.reasoning?.priority || ""}; ETA: ${analysis.reasoning?.eta || ""}`
      : String(analysis.reasoning || ""),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  // Assign officer name based on department
  const officerNames = {
    "Electrical": "Officer R. Srinivas",
    "Water Supply": "Officer K. Ramana",
    "Sanitation": "Officer M. Suresh",
    "Roads & Infrastructure": "Officer G. Venkat",
    "Drainage": "Officer P. Raju",
    "Public Safety": "Officer T. Satish"
  };
  complaint.assignedOfficer = officerNames[analysis.primaryDepartment?.name] || "Officer In-Charge";

  const db = CivicAgentFirebase.db;
  if (CivicAgentFirebase.isConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, "complaints"), complaint);
      complaint.docId = docRef.id;

      // If submitted by authenticated user, increment their totalComplaints count in Firestore
      if (complaint.userId) {
        try {
          const userDocRef = doc(db, "users", complaint.userId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const currentTotal = userSnap.data().totalComplaints || 0;
            await updateDoc(userDocRef, { totalComplaints: currentTotal + 1 });
          }
        } catch (err) {
          console.error("Error incrementing user complaint count:", err);
        }
      }

      return complaint;
    } catch (err) {
      console.error("Firestore save error, saving locally:", err);
    }
  }

  // Save to LocalStorage
  const localList = getLocalComplaints();
  localList.unshift(complaint);
  saveLocalComplaints(localList);
  return complaint;
}

// Get complaint by ID
async function getComplaint(id) {
  const list = await readComplaints();
  const normalized = String(id || "").trim().toUpperCase();
  return list.find((c) => c.id.toUpperCase() === normalized) || null;
}

// Update complaint status/remarks
async function updateComplaint(id, updates) {
  const list = await readComplaints();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = list[index];
  const now = new Date().toISOString();

  const historyUpdates = [];
  if (updates.status && updates.status !== current.status) {
    historyUpdates.push({ status: updates.status, timestamp: now });
  }

  const updated = {
    ...current,
    ...updates,
    updatedAt: now,
    history: [
      ...(current.history || []),
      ...historyUpdates
    ]
  };
  delete updated.historyItem; // Clean up temp key if passed

  const db = CivicAgentFirebase.db;
  if (CivicAgentFirebase.isConfigured() && db && current.docId) {
    try {
      const docRef = doc(db, "complaints", current.docId);
      await updateDoc(docRef, updated);

      if (updates.status === "Resolved" && current.status !== "Resolved" && current.userId) {
        try {
          const userDocRef = doc(db, "users", current.userId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const currentResolved = userSnap.data().resolvedComplaints || 0;
            await updateDoc(userDocRef, { resolvedComplaints: currentResolved + 1 });
          }
        } catch (err) {
          console.error("Error incrementing user resolved count:", err);
        }
      }

      return updated;
    } catch (err) {
      console.error("Firestore update error, updating locally:", err);
    }
  }

  // Local storage update
  const localList = getLocalComplaints();
  const localIndex = localList.findIndex((c) => c.id === id);
  if (localIndex !== -1) {
    localList[localIndex] = updated;
    saveLocalComplaints(localList);
  }
  return updated;
}

// Seed realistic demo complaints if empty
async function seedInitialData() {
  const currentList = await readComplaints();
  if (currentList.length > 0) return;

  console.log("Seeding initial demo data...");
  const sampleComplaints = [
    {
      fullName: "Anand Verma",
      mobile: "9123456789",
      email: "anand@gmail.com",
      location: "Gachibowli, Hyderabad",
      category: "Streetlight Issues",
      description: "Three streetlights near Oakridge School are flickering and completely dark. Children walking back from evening classes face safety risks.",
      language: "English",
      submittedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString() // 5 days ago
    },
    {
      fullName: "Kalyani Devi",
      mobile: "9848022338",
      email: "kalyani@yahoo.com",
      location: "Jubilee Hills, Road No 36, Hyderabad",
      category: "Water Leakage",
      description: "A major water leakage from the main pipeline is flooding the road and damaged a patch of infrastructure. Stagnant water is accumulating.",
      language: "English",
      submittedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString() // 3 days ago
    },
    {
      fullName: "Satish Kumar",
      mobile: "7013824419",
      email: "satish@outlook.com",
      location: "Madhapur, Hyderabad",
      category: "Garbage Collection",
      description: "Garbage collection truck has not visited our street for 6 days. The dump yard is overflowing and causing a terrible smell in the area.",
      language: "English",
      submittedAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
    },
    {
      fullName: "Ramesh Reddy",
      mobile: "8123456780",
      email: "ramesh@outlook.com",
      location: "Kukatpally, Metro Station Area, Hyderabad",
      category: "Road Damage",
      description: "Huge pothole formed on the main road just near the metro station staircase. It's causing massive traffic jams and two-wheelers are skidding.",
      language: "English",
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
    }
  ];

  for (const sample of sampleComplaints) {
    await submitComplaint(sample);
  }

  // Let's modify some of these newly seeded complaints to be In Progress or Resolved
  const updatedList = await readComplaints();
  
  // Resolve the streetlight issue
  const streetlightIssue = updatedList.find(c => c.category === "Streetlight Issues");
  if (streetlightIssue) {
    await updateComplaint(streetlightIssue.id, {
      status: "Resolved",
      timelineStatus: 6,
      remarks: "Streetlight LED bulb replaced and wiring repaired. Night safety restored.",
      "analysis": {
        ...streetlightIssue.analysis,
        officerNotes: "Grievance resolved. LED fixtures replaced by Electrical Team 4."
      }
    });
  }

  // Move the water leakage to "In Progress"
  const waterLeakage = updatedList.find(c => c.category === "Water Leakage");
  if (waterLeakage) {
    await updateComplaint(waterLeakage.id, {
      status: "In Progress",
      timelineStatus: 5,
      remarks: "Water supply team is on-site repairing pipeline leak. Road restoration requested.",
      "analysis": {
        ...waterLeakage.analysis,
        officerNotes: "Excavation and valve replacements underway. ETA for water supply restoration is 6 hours."
      }
    });
  }

  // Move the garbage collection to "Officer Assigned"
  const garbage = updatedList.find(c => c.category === "Garbage Collection");
  if (garbage) {
    await updateComplaint(garbage.id, {
      status: "Officer Assigned",
      timelineStatus: 3,
      remarks: "Field Inspector M. Suresh assigned to verify garbage pickup delay."
    });
  }
}

// Seed demo flow complaint on demand
async function seedDemoComplaint() {
  return submitComplaint({
    fullName: "Asha Reddy",
    mobile: "9876543210",
    email: "asha@example.com",
    location: "Jubilee Hills, Hyderabad",
    category: "Water Leakage",
    description: "Water leakage damaged road and caused flooding near the main junction.",
    language: "English",
    imageName: "demo-road-leakage.jpg"
  });
}

// Check for possible duplicate complaints at similar locations with overlapping descriptions
async function checkDuplicate(description, location) {
  const complaints = await readComplaints();
  if (!location || !description) return null;
  
  const normLoc = location.toLowerCase().trim();
  const words = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  return complaints.find(c => {
    const cLoc = (c.location || "").toLowerCase();
    if (!cLoc.includes(normLoc) && !normLoc.includes(cLoc)) return false;
    if (c.status === "Resolved") return false;
    const cDesc = (c.description || "").toLowerCase();
    const overlapCount = words.filter(w => cDesc.includes(w)).length;
    return overlapCount >= 2;
  });
}

export const CivicAgentComplaintService = {
  readComplaints,
  submitComplaint,
  getComplaint,
  updateComplaint,
  seedInitialData,
  seedDemoComplaint,
  checkDuplicate
};

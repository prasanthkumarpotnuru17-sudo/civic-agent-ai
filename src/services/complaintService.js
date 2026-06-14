import { CivicAgentFirebase } from "./firebaseConfig";
import { CivicAgentRoutingEngine } from "./routingEngine";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, orderBy } from "firebase/firestore";

// Generate the next complaint ID
async function nextComplaintId() {
  const complaints = await readComplaints();
  const year = new Date().getFullYear();
  const count = complaints.filter((c) => c.complaintId && c.complaintId.includes(`CMP-${year}`)).length + 1;
  return `CMP-${year}-${String(count).padStart(3, "0")}`;
}

// Read all complaints (fallback for non-realtime places, though dashboard uses onSnapshot)
async function readComplaints() {
  const db = CivicAgentFirebase.db;
  if (!db) return [];
  try {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({ docId: docSnap.id, ...docSnap.data() });
    });
    return list;
  } catch (err) {
    console.error("Firestore read error:", err);
    return [];
  }
}

// Submit a new complaint
async function submitComplaint(payload) {
  const id = await nextComplaintId();
  const analysis = await CivicAgentRoutingEngine.analyzeComplaint(payload);
  const now = new Date().toISOString();
  
  const complaint = {
    complaintId: id,
    uid: payload.userId || null,
    citizenName: payload.fullName,
    email: payload.email || "",
    mobile: payload.mobile,
    department: analysis.primaryDepartment?.label || "",
    category: payload.category || "Auto-detect",
    description: payload.description,
    location: payload.location,
    priority: analysis.priority || "",
    status: "Submitted",
    remarks: "",
    aiConfidence: Number(analysis.confidence) || 96,
    createdAt: now,
    updatedAt: now,
    history: [
      { status: "Submitted", timestamp: now }
    ]
  };

  const db = CivicAgentFirebase.db;
  if (!db) {
      throw new Error("Firestore is not configured. Cannot save complaint.");
  }
  
  console.log("db object before complaint submission: Present");

  const docRef = await addDoc(collection(db, "complaints"), complaint);
  complaint.docId = docRef.id;

  // If submitted by authenticated user, increment their totalComplaints count in Firestore
  if (complaint.uid) {
    try {
      const userDocRef = doc(db, "users", complaint.uid);
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
}

// Get complaint by ID
async function getComplaint(id) {
  const list = await readComplaints();
  const normalized = String(id || "").trim().toUpperCase();
  return list.find((c) => (c.complaintId || "").toUpperCase() === normalized) || null;
}

// Update complaint status/remarks
async function updateComplaint(docId, updates) {
  const db = CivicAgentFirebase.db;
  if (!CivicAgentFirebase.isConfigured() || !db || !docId) {
      throw new Error("Invalid update request or Firestore not configured.");
  }
  
  const docRef = doc(db, "complaints", docId);
  const currentSnap = await getDoc(docRef);
  
  if (!currentSnap.exists()) return null;
  const current = currentSnap.data();
  const now = new Date().toISOString();

  const historyUpdates = [];
  if (updates.status && updates.status !== current.status) {
    historyUpdates.push({ status: updates.status, timestamp: now });
  }

  const updated = {
    ...updates,
    updatedAt: now,
    history: [
      ...(current.history || []),
      ...historyUpdates
    ]
  };

  await updateDoc(docRef, updated);

  if (updates.status === "Resolved" && current.status !== "Resolved" && current.uid) {
    try {
      const userDocRef = doc(db, "users", current.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const currentResolved = userSnap.data().resolvedComplaints || 0;
        await updateDoc(userDocRef, { resolvedComplaints: currentResolved + 1 });
      }
    } catch (err) {
      console.error("Error incrementing user resolved count:", err);
    }
  }

  return { ...current, ...updated, docId };
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
  checkDuplicate
};

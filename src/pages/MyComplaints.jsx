import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Inbox, ExternalLink, Calendar, Layers, ShieldAlert } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { CivicAgentComplaintService } from "../services/complaintService";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export default function MyComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserComplaints();
    }
  }, [user]);

  const fetchUserComplaints = async () => {
    setLoading(true);
    try {
      if (db && user?.uid) {
        const q = query(
          collection(db, "complaints"), 
          where("uid", "==", user.uid), 
          orderBy("createdAt", "desc"), 
          limit(100)
        );
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ docId: docSnap.id, ...docSnap.data() });
        });
        setComplaints(list);
      }
    } catch (err) {
      if (err.message && err.message.includes("requires an index")) {
        console.error("Index missing for query: collection('complaints').where('uid', '==', '" + user?.uid + "').orderBy('createdAt', 'desc').limit(100)");
        console.error("Firebase instructions: " + err.message);
        setIndexError(true);
      } else {
        console.error("Error loading citizen complaints history:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (id) => {
    navigate("/track", { state: { prefilledId: id } });
  };

  return (
    <section className="section" style={{ minHeight: "80vh" }}>
      <div className="container">
        <div className="section-heading" style={{ textAlign: "left", marginLeft: 0, marginBottom: "36px" }}>
          <span className="section-kicker">Citizen Records</span>
          <h2>Your Personal Complaint History</h2>
          <p>Review details, department actions, routing priority, and track resolution timelines of your submitted complaints.</p>
        </div>

        {loading ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: "250px" }}>
            <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--muted)", fontWeight: "600" }}>
              Loading grievances history...
            </div>
          </div>
        ) : indexError ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center", border: "1px solid rgba(255, 100, 100, 0.2)" }}>
            <div className="feature-icon-wrapper" style={{ margin: "0 auto 16px", background: "rgba(255, 50, 50, 0.1)" }}>
              <ShieldAlert style={{ width: "24px", height: "24px", color: "#ff6b6b" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>Database Index Building</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "400px", margin: "0 auto 20px" }}>
              We are currently optimizing the database to load your complaint history faster. Please check back in a few minutes.
            </p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
            <div className="feature-icon-wrapper" style={{ margin: "0 auto 16px" }}>
              <Inbox style={{ width: "24px", height: "24px" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>No complaints logged</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "400px", margin: "0 auto 20px" }}>
              You have not submitted any complaints on this account yet. Submit a grievance to view and track it here.
            </p>
            <button className="button primary" onClick={() => navigate("/submit")}>
              Submit Complaint
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText style={{ color: "var(--blue)", width: "18px" }} /> Grievance Directory
              </h3>
              <span style={{ fontSize: "12.5px", color: "var(--muted)", fontWeight: "600" }}>
                {complaints.length} logged tickets
              </span>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table className="complaints-table">
                <thead>
                  <tr>
                    <th>Grievance ID</th>
                    <th>Department Portfolio</th>
                    <th>Priority Rating</th>
                    <th>Filing Date</th>
                    <th>Active Status</th>
                    <th style={{ textAlign: "right" }}>Operation</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.docId || c.complaintId}>
                      <td>
                        <strong>{c.complaintId || c.id}</strong>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Layers style={{ width: "14px", height: "14px", color: "var(--muted)" }} />
                          {c.department || c.analysis?.primaryDepartment?.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${(c.priority || c.analysis?.priority || "medium").toLowerCase()}`}>
                          {c.priority || c.analysis?.priority || "Medium"}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                          <Calendar style={{ width: "14px", height: "14px", color: "var(--muted)" }} />
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : (c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "")}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${c.status === "Resolved" ? "resolved" : c.status === "In Progress" ? "in-progress" : "assigned"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="button primary"
                          style={{ height: "32px", padding: "0 10px", fontSize: "12px", borderRadius: "6px", gap: "4px" }}
                          onClick={() => handleTrack(c.complaintId || c.id)}
                        >
                          <span>Track Case</span>
                          <ExternalLink style={{ width: "12px" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

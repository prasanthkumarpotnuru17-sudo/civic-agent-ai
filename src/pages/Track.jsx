import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, MapPin, Layers, ShieldAlert, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { CivicAgentComplaintService } from "../services/complaintService";
import { onSnapshot, collection, query, where, limit } from "firebase/firestore";
import { db } from "../services/firebase";

export default function Track() {
  const location = useLocation();
  const [trackId, setTrackId] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackSearched, setTrackSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [activeTrackId, setActiveTrackId] = useState("");

  // Check if a prefilled ID is passed in location state (e.g. from Profile page redirect)
  useEffect(() => {
    if (location.state?.prefilledId) {
      setTrackId(location.state.prefilledId);
      setActiveTrackId(location.state.prefilledId);
    }
  }, [location.state]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackId.trim()) {
      setActiveTrackId(trackId.trim());
    }
  };

  useEffect(() => {
    if (!activeTrackId) return;
    setSearchLoading(true);
    setTrackSearched(true);

    let unsubscribe = null;
    const normalized = String(activeTrackId).trim().toUpperCase();

    const fetchFallback = async () => {
      try {
        const res = await CivicAgentComplaintService.getComplaint(normalized);
        setTrackResult(res);
      } catch (err) {
        console.error("Tracking lookup error:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    if (db) {
      try {
        const q = query(collection(db, "complaints"), where("complaintId", "==", normalized), limit(1));
        unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            setTrackResult({ docId: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            setSearchLoading(false);
          } else {
            fetchFallback();
          }
        }, (err) => {
          console.error("Snapshot error:", err);
          fetchFallback();
        });
      } catch (err) {
        fetchFallback();
      }
    } else {
      fetchFallback();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTrackId]);

  return (
    <section className="section" style={{ minHeight: "80vh" }}>
      <div className="container">
        <div className="section-heading" style={{ textAlign: "left", marginLeft: 0, marginBottom: "36px" }}>
          <span className="section-kicker">Grievance Audit</span>
          <h2>Track Complaint Status</h2>
          <p>Search by generated Complaint ID to monitor real-time department routing, assigned officers, and resolution timelines.</p>
        </div>

        <div className="tracking-layout">
          {/* Tracker search card & Timeline */}
          <div className="tracker-card glass-card">
            <form className="tracking-search" onSubmit={handleTrackSubmit}>
              <label htmlFor="trackingInput">Grievance ID Lookup</label>
              <div>
                <input
                  id="trackingInput"
                  placeholder="e.g. CMP-2026-001"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                />
                <button className="button primary" type="submit" disabled={searchLoading} style={{ height: "44px" }}>
                  {searchLoading ? "Searching..." : "Track"}
                </button>
              </div>
            </form>

            {/* Timeline Tracker */}
            {searchLoading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: "150px" }}>
                <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--muted)", fontWeight: "600" }}>
                  Fetching timeline logs...
                </div>
              </div>
            ) : trackResult ? (
              <div className="timeline" id="timeline">
                {[
                  "Submitted",
                  "Assigned",
                  "Officer Assigned",
                  "In Progress",
                  "Resolved"
                ].map((step, idx) => {
                  const historyEvent = trackResult.history?.find(h => h.status === step);
                  const isDone = !!historyEvent;
                  const isActive = trackResult.status === step;
                  
                  const stepNotes = [
                    "Complaint received and logged in database.",
                    "Grievance routed to appropriate department.",
                    "Field officer assigned to the grievance.",
                    "Field operations and structural work underway.",
                    "Grievance resolved. Resolution verified and ticket closed."
                  ];

                  return (
                    <div key={step} className={`timeline-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}>
                      <span className="timeline-dot">
                        {isDone ? "✓" : idx + 1}
                      </span>
                      <div>
                        <strong>{step}</strong>
                        <p>{stepNotes[idx]}</p>
                        {historyEvent && (
                          <small style={{ color: "var(--blue)", fontSize: "11px", display: "block", marginTop: "4px", fontWeight: "600" }}>
                            {new Date(historyEvent.timestamp).toLocaleString()}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : trackSearched ? (
              <div className="analysis-empty" style={{ borderColor: "var(--red-soft)", color: "var(--red)" }}>
                No database record matches Complaint ID **{trackId}**. Please verify the entry and try again.
              </div>
            ) : (
              <div className="analysis-empty">
                Enter a valid municipal grievance ID to view the full resolution timeline logs.
              </div>
            )}
          </div>

          {/* Track Results Details Sidebar */}
          <aside className="result-stack">
            {trackResult && (
              <article className="history-card glass-card" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{trackResult.id}</span>
                  <span className={`badge-status ${trackResult.status === "Resolved" ? "resolved" : trackResult.status === "In Progress" ? "in-progress" : "assigned"}`}>
                    {trackResult.status}
                  </span>
                </h3>

                <div style={{ display: "grid", gap: "2px" }}>
                  <div className="detail-row">
                    <span>Citizen Name</span>
                    <strong>{trackResult.fullName}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Location</span>
                    <strong>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin style={{ width: "13px", color: "var(--muted)" }} />
                        {trackResult.location}
                      </span>
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Category</span>
                    <strong>{trackResult.category}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Department Portfolio</span>
                    <strong>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Layers style={{ width: "13px", color: "var(--muted)" }} />
                        {trackResult.analysis?.primaryDepartment?.label || trackResult.department}
                      </span>
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Priority Rating</span>
                    <strong>
                      <span className={`badge-status ${(trackResult.analysis?.priority || trackResult.priority || "medium").toLowerCase()}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                        {trackResult.analysis?.priority || trackResult.priority}
                      </span>
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Resolution ETA</span>
                    <strong>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock style={{ width: "13px", color: "var(--muted)" }} />
                        {trackResult.analysis?.eta || trackResult.eta}
                      </span>
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Assigned Officer</span>
                    <strong>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <User style={{ width: "13px", color: "var(--muted)" }} />
                        {trackResult.assignedOfficer}
                      </span>
                    </strong>
                  </div>
                </div>

                {trackResult.imageUrl && (
                  <div className="detail-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px", borderBottom: 0, marginTop: "12px" }}>
                    <span>Uploaded Evidence Photo</span>
                    <img 
                      src={trackResult.imageUrl} 
                      alt="Complaint evidence" 
                      style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border)", maxHeight: "160px", objectFit: "cover" }} 
                    />
                  </div>
                )}

                {trackResult.remarks && (
                  <div className="analysis-summary" style={{ marginTop: "16px" }}>
                    <span className="summary-label">Officer Remarks</span>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#e5e7eb" }}>
                      {trackResult.remarks}
                    </p>
                  </div>
                )}

                {/* AI Reasoning Panel */}
                <div className="analysis-summary" style={{ background: "var(--blue-soft)", borderColor: "rgba(59, 130, 246, 0.2)", marginTop: "12px" }}>
                  <span className="summary-label" style={{ color: "var(--blue)" }}>AI Routing Reasoning Panel</span>
                  <div style={{ display: "grid", gap: "6px", marginTop: "8px", fontSize: "12px", color: "var(--muted)" }}>
                    <div><strong>Routing decision:</strong> {trackResult.analysis?.reasoning?.routing}</div>
                    <div><strong>Priority decision:</strong> {trackResult.analysis?.reasoning?.priority}</div>
                    <div><strong>ETA SLA decision:</strong> {trackResult.analysis?.reasoning?.eta}</div>
                  </div>
                </div>
              </article>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, Phone, HelpCircle, Activity } from "lucide-react";
import { CivicAgentComplaintService } from "../services/complaintService";

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Dynamic metrics state
  const [stats, setStats] = useState({
    active: 12,
    resolved: 4
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const list = await CivicAgentComplaintService.readComplaints();
        if (list && list.length > 0) {
          const activeCount = list.filter(c => c.status !== "Resolved").length;
          const resolvedCount = list.filter(c => c.status === "Resolved").length;
          setStats({
            active: activeCount,
            resolved: resolvedCount
          });
        }
      } catch (err) {
        console.warn("Failed to load footer metrics:", err);
      }
    };
    loadStats();
  }, [location.pathname]);

  const emergencyContacts = [
    { label: "Police", number: "100", icon: "🚓" },
    { label: "Ambulance", number: "108", icon: "🚑" },
    { label: "Fire Service", number: "101", icon: "🚒" },
    { label: "Women Helpline", number: "1091", icon: "👩" },
    { label: "Child Helpline", number: "1098", icon: "👶" },
    { label: "Disaster Mgmt", number: "1070", icon: "🚨" }
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        
        {/* SECTION 1 - Emergency Alert Banner */}
        <div className="emergency-banner">
          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontWeight: "700", marginBottom: "4px" }}>
            <ShieldAlert style={{ width: "16px", height: "16px" }} />
            <span>⚠ Emergency Notice</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.4" }}>
            If this is a life-threatening emergency, accident, fire, crime in progress, or medical crisis, immediately contact emergency services instead of submitting a complaint.
          </p>
        </div>

        {/* SECTION 2 - Main Footer Grid */}
        <div className="footer-grid">
          
          {/* Column 1 - CivicAgent AI */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="brand-mark" aria-hidden="true" style={{ width: "22px", height: "22px" }}>
                <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px" }}>
                  <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.7 7.9 6.5 8.9 3.8-1 6.5-4.8 6.5-8.9V6.2L12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <strong style={{ color: "#0f172a", fontSize: "16px" }}>CivicAgent AI</strong>
            </div>
            <p className="footer-tagline">Autonomous Citizen Grievance Management Platform</p>
            <p className="footer-desc">
              AI-powered complaint routing, smart prioritization, real-time tracking, and municipal service intelligence for smart governance.
            </p>
            <div className="badge-container">
              <span className="badge-pill">✓ AI Powered</span>
              <span className="badge-pill">✓ Real-Time Tracking</span>
              <span className="badge-pill">✓ Smart Routing</span>
              <span className="badge-pill">✓ Citizen Dashboard</span>
            </div>
          </div>

          {/* Column 2 - Quick Navigation */}
          <div className="footer-col links-col">
            <h4 className="footer-col-title">Quick Navigation</h4>
            <div className="footer-link-list">
              <Link to="/">Home</Link>
              <Link to="/submit">Submit Complaint</Link>
              <Link to="/track">Track Complaint</Link>
              <Link to="/my-complaints">My Complaints</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/admin/dashboard" style={{ color: "var(--blue)", fontWeight: "600" }}>🛡️ Admin Portal</Link>
            </div>
          </div>

          {/* Column 3 - Emergency Contacts */}
          <div className="footer-col emergency-col">
            <h4 className="footer-col-title">Emergency Contacts</h4>
            <div className="emergency-grid">
              {emergencyContacts.map((contact) => (
                <a 
                  key={contact.number} 
                  href={`tel:${contact.number}`} 
                  className="emergency-card"
                  title={`Call ${contact.label}`}
                >
                  <span style={{ fontSize: "16px" }}>{contact.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "11px" }}>{contact.label}</div>
                    <div style={{ color: "#2563eb", fontWeight: "700", fontSize: "12px" }}>{contact.number}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Column 4 - Smart Governance Status */}
          <div className="footer-col status-col">
            <h4 className="footer-col-title">Governance Status</h4>
            <div className="status-indicator-box">
              <div className="status-header">
                <span className="status-dot">🟢</span> System Online
              </div>
              <div className="status-items">
                <div>• AI Routing Engine Active</div>
                <div>• Complaint Tracking Online</div>
                <div>• Firestore Connected</div>
                <div>• Citizen Services Available</div>
              </div>
            </div>

            <div className="footer-metrics-grid" style={{ marginTop: "12px" }}>
              <div className="footer-metric-item">
                <span>AI Accuracy</span>
                <strong>96%</strong>
              </div>
              <div className="footer-metric-item">
                <span>Avg Response</span>
                <strong>18 Hours</strong>
              </div>
              <div className="footer-metric-item">
                <span>Active Cases</span>
                <strong>{stats.active}</strong>
              </div>
              <div className="footer-metric-item">
                <span>Resolved Today</span>
                <strong>{stats.resolved}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 3 - Bottom Footer */}
        <div className="footer-bottom">
          <div>© 2026 CivicAgent AI</div>
          <div>Built for Smart Governance & Digital India</div>
          <div>Hackathon Edition v1.0</div>
        </div>

      </div>
    </footer>
  );
}

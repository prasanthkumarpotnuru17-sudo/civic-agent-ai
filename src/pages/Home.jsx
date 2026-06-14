import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield, ShieldAlert, Award, Compass, Activity, AlertCircle,
  Clock, FileText, ArrowRight, Lightbulb, Trash2, Droplet,
  Milestone, Layers, User, Play, Search, CheckCircle, Database, X
} from "lucide-react";
import { CivicAgentRoutingEngine } from "../services/routingEngine";
import useAuth from "../hooks/useAuth";

export default function Home({ onRunDemo }) {
  const navigate = useNavigate();
  const { user, openAuth } = useAuth();

  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Keydown listener for Escape key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setVideoModalOpen(false);
      }
    }
    if (videoModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [videoModalOpen]);

  // Instant AI Demo Banner state
  const [demoText, setDemoText] = useState("");
  const [demoAnalysis, setDemoAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Live Command Center state
  const [simIndex, setSimIndex] = useState(0);
  const [simLogs, setSimLogs] = useState([]);

  // Command Center Simulation Data
  const simData = [
    {
      description: "Streetlight near high school is flickering and completely dark at night.",
      dept: "Electrical Department",
      priority: "High",
      eta: "24 Hours",
      officer: "Officer R. Srinivas"
    },
    {
      description: "Drinking water pipe burst near metro station, causing massive leakage.",
      dept: "Water Supply Division",
      priority: "High",
      eta: "24 Hours",
      officer: "Officer K. Ramana"
    },
    {
      description: "Garbage collection truck missed our street for 6 consecutive days.",
      dept: "Sanitation Department",
      priority: "Medium",
      eta: "2 Days",
      officer: "Officer M. Suresh"
    },
    {
      description: "Huge pothole formed at the main road junction, causing traffic delay.",
      dept: "Roads & Infrastructure",
      priority: "Medium",
      eta: "3 Days",
      officer: "Officer G. Venkat"
    }
  ];

  // Run the Live AI Command Center logs loop
  useEffect(() => {
    const runSimulation = () => {
      const ticket = simData[simIndex];
      setSimLogs([]);
      
      const steps = [
        `[SYSTEM] Incoming grievance detected...`,
        `[CITIZEN] "${ticket.description}"`,
        `[AI ENG] Analyzing context & local metadata...`,
        `[AI ENG] Primary Department: ${ticket.dept} (96% confidence)`,
        `[AI ENG] Priority Level: ${ticket.priority} (SLA active)`,
        `[AI ENG] Estimated SLA Resolution: ${ticket.eta}`,
        `[SYSTEM] Routed. Dispatched ticket to ${ticket.officer}.`
      ];

      steps.forEach((step, index) => {
        setTimeout(() => {
          setSimLogs((prev) => [...prev, step]);
        }, index * 1200);
      });

      // Schedule next simulation cycle
      setTimeout(() => {
        setSimIndex((prev) => (prev + 1) % simData.length);
      }, steps.length * 1200 + 4000);
    };

    runSimulation();
  }, [simIndex]);

  // Debounced/Live Interactive Demo Banner analysis
  useEffect(() => {
    if (!demoText.trim()) {
      setDemoAnalysis(null);
      return;
    }
    
    setIsAnalyzing(true);
    const timer = setTimeout(async () => {
      const res = await CivicAgentRoutingEngine.analyzeLocal({
        description: demoText,
        location: "City Center",
        category: "Auto-detect"
      });
      setDemoAnalysis(res);
      setIsAnalyzing(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [demoText]);

  const handleMyComplaintsClick = (e) => {
    e.preventDefault();
    if (!user) {
      openAuth();
    } else {
      navigate("/my-complaints");
    }
  };

  const handleDemoClick = (text) => {
    setDemoText(text);
  };

  const scrollToDemo = (e) => {
    e.preventDefault();
    const el = document.getElementById("ai-demo-banner");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <div className="grid-overlay"></div>
      <div className="ambient-glow" style={{ top: "10%", left: "5%" }}></div>
      <div className="ambient-glow" style={{ top: "60%", right: "5%" }}></div>

      {/* HERO SECTION */}
      <section className="hero section-band" id="home">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Activity style={{ width: "14px", height: "14px" }} />
              Agentic AI Smart Governance
            </span>
            <h1>Autonomous City Governance Powered by AI Agents</h1>
            <p>
              Submit complaints, track resolutions, and let AI automatically route issues to the right departments in seconds.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/submit">
                Submit Complaint
                <ArrowRight style={{ width: "16px", height: "16px" }} />
              </Link>
              <button 
                className="button secondary" 
                onClick={() => setVideoModalOpen(true)}
                style={{ cursor: "pointer", border: "1px solid var(--border)" }}
                type="button"
              >
                <Play style={{ width: "14px", fill: "currentColor" }} />
                Watch AI Demo
              </button>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "32px", fontSize: "13px", color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle style={{ width: "14px", color: "var(--green)" }} /> Dual-lingual translation</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle style={{ width: "14px", color: "var(--green)" }} /> Instant routing audits</span>
            </div>
          </div>

          {/* LIVE AI COMMAND CENTER */}
          <article className="live-command-center glass-card">
            <div className="terminal-header">
              <div className="dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="terminal-title">live_ai_command_center.log</span>
              <span className="status-chip ready" style={{ fontSize: "9px", padding: "2px 6px" }}>Online</span>
            </div>

            <div className="terminal-body" style={{ minHeight: "190px" }}>
              {simLogs.map((log, idx) => {
                const isSystem = log.startsWith("[SYSTEM]");
                const isCitizen = log.startsWith("[CITIZEN]");
                return (
                  <div key={idx} className="terminal-line" style={{
                    color: isSystem ? "var(--muted)" : isCitizen ? "var(--text)" : "var(--blue)",
                    fontWeight: isCitizen ? "600" : "400"
                  }}>
                    <span className="terminal-prompt">&gt;</span>
                    <span>{log}</span>
                  </div>
                );
              })}
              <div className="terminal-line" style={{ animation: "flowPulse 1s infinite" }}>
                <span className="terminal-prompt">&gt;</span>
                <span style={{ width: "8px", height: "14px", background: "currentColor", display: "inline-block" }}></span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* QUICK ACTIONS BAR */}
      <section className="container" style={{ position: "relative", zIndex: "10" }}>
        <div className="quick-actions-bar">
          <Link className="quick-action-card glass-card" to="/submit">
            <div className="quick-action-icon"><FileText /></div>
            <div className="quick-action-info">
              <h4>Submit Complaint</h4>
              <p>Type or dictate your civic grievance. AI parses, classifies, and dispatches in real-time.</p>
            </div>
          </Link>
          <Link className="quick-action-card glass-card" to="/track">
            <div className="quick-action-icon"><Clock /></div>
            <div className="quick-action-info">
              <h4>Track Complaint</h4>
              <p>Search via generated ticket IDs to monitor real-time SLA completion and officer remarks.</p>
            </div>
          </Link>
          <a className="quick-action-card glass-card" href="/my-complaints" onClick={handleMyComplaintsClick}>
            <div className="quick-action-icon"><User /></div>
            <div className="quick-action-info">
              <h4>My Complaints</h4>
              <p>Sign in to view your logged complaints history, updates timeline, and fast tracking links.</p>
            </div>
          </a>
        </div>
      </section>

      {/* AI DEMO BANNER */}
      <section className="container" id="ai-demo-banner" style={{ marginBottom: "80px" }}>
        <div className="demo-banner glass-card" style={{ border: "1px solid rgba(59, 130, 246, 0.2)" }}>
          <div className="demo-banner-header">
            <span className="section-kicker">Interactive Playground</span>
            <h3>Try CivicAgent AI Instantly</h3>
            <p>Type a municipal grievance below or click a preset suggestion to observe the routing engine in action.</p>
          </div>

          <div className="demo-search-box">
            <Search style={{ position: "absolute", left: "16px", top: "14px", color: "var(--muted)", width: "20px" }} />
            <input 
              style={{ paddingLeft: "48px" }}
              placeholder="Describe a city problem... (e.g., Water leakage has damaged the asphalt road near high school)"
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
            />
          </div>

          <div className="demo-suggestions">
            <button className="demo-sugg-btn" onClick={() => handleDemoClick("Streetlight near school not working and flickering.")}>
              💡 Streetlight near school
            </button>
            <button className="demo-sugg-btn" onClick={() => handleDemoClick("Garbage has not been collected for 5 days. Terrible smell in the area.")}>
              🗑️ Garbage not collected
            </button>
            <button className="demo-sugg-btn" onClick={() => handleDemoClick("Major water leakage from main pipeline has damaged the road.")}>
              💧 Water leakage & road damage
            </button>
            <button className="demo-sugg-btn" onClick={() => handleDemoClick("Open manhole on main road causing serious danger.")}>
              ⚠️ Open manhole hazard
            </button>
          </div>

          {/* Analysis Card */}
          {isAnalyzing && (
            <div style={{ display: "grid", placeItems: "center", minHeight: "120px" }}>
              <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--blue)", fontWeight: "600", fontSize: "14px" }}>
                Analyzing routing parameters...
              </div>
            </div>
          )}

          {!isAnalyzing && demoAnalysis && (
            <div className="ai-scorecard">
              <div className="scorecard-header">
                <div className="scorecard-title">
                  <Activity style={{ width: "16px", color: "var(--blue)" }} />
                  Autonomous AI Dispatch Node
                </div>
                <span className="intent-badge">{demoAnalysis.intent}</span>
              </div>

              {/* Confidence Progress */}
              <div className="confidence-progress-section">
                <div className="confidence-header">
                  <span>Classification Confidence</span>
                  <strong>{demoAnalysis.confidence}%</strong>
                </div>
                <div className="confidence-progress-container">
                  <div className="confidence-progress-bar" style={{ width: `${demoAnalysis.confidence}%` }}></div>
                </div>
              </div>

              {/* Department Scores */}
              <div className="scorecard-dept-list">
                <h5 style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                  Department Classifier Match Scores
                </h5>
                {Object.entries(demoAnalysis.departmentScores || {})
                  .filter(([_, score]) => score > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, score]) => {
                    const isActive = name === demoAnalysis.primaryDepartment.name;
                    return (
                      <div key={name} className="scorecard-dept-item">
                        <div className={`scorecard-dept-info ${isActive ? "active" : ""}`}>
                          <span>{name}</span>
                          <span className="scorecard-dept-score">+{score}</span>
                        </div>
                        <div className="scorecard-dept-bar-bg">
                          <div className={`scorecard-dept-bar-fill ${isActive ? "active" : ""}`} style={{ width: `${Math.min(100, (score / 120) * 100)}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                }
                {Object.values(demoAnalysis.departmentScores || {}).reduce((s, v) => s + v, 0) === 0 && (
                  <div style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
                    No matching keywords detected. Defaulting to Public Safety.
                  </div>
                )}
              </div>

              {/* Matched Keywords */}
              {demoAnalysis.detectedKeywords && demoAnalysis.detectedKeywords.length > 0 && (
                <div style={{ display: "grid", gap: "6px" }}>
                  <h5 style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                    Extracted Semantic Tokens
                  </h5>
                  <div className="keyword-chips-container">
                    {demoAnalysis.detectedKeywords.map((kw, i) => (
                      <span key={i} className="keyword-chip">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Grid */}
              <div className="scorecard-meta-grid">
                <div className="meta-card">
                  <label>Selected Department</label>
                  <span>{demoAnalysis.primaryDepartment?.label}</span>
                </div>
                <div className="meta-card priority-card">
                  <label>Resolved Priority</label>
                  <span className={demoAnalysis.priority?.toLowerCase()}>{demoAnalysis.priority}</span>
                </div>
                <div className="meta-card">
                  <label>Resolution SLA</label>
                  <span>{demoAnalysis.eta}</span>
                </div>
                <div className="meta-card">
                  <label>Detected Location</label>
                  <span>{demoAnalysis.extractedLocation || "City Center"}</span>
                </div>
              </div>

              {/* Explainable Reasoning Panel */}
              <div className="scorecard-reasoning-panel">
                <h5 style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--blue)" }}>
                  Decision Audit Trail
                </h5>
                <p><strong>Routing Decision:</strong> {demoAnalysis.reasoning?.routing}</p>
                <div style={{ display: "grid", gap: "4px", fontSize: "12px", color: "var(--muted)" }}>
                  <div><strong>Priority Selection:</strong> {demoAnalysis.reasoning?.priority}</div>
                  <div><strong>SLA ETA Selection:</strong> {demoAnalysis.reasoning?.eta}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SMART CITY METRICS */}
      <section className="section soft-section" id="metrics" style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <div className="section-heading">
            <span className="section-kicker">Operational Telemetry</span>
            <h2>Live Smart City Grievance Metrics</h2>
            <p>Direct integration into municipal services monitoring, highlighting active SLAs and AI performance scores.</p>
          </div>

          <div className="metrics-grid">
            <div className="metric-card glass-card">
              <span>Active Complaints</span>
              <strong>142</strong>
              <p>Active citizen reports currently assigned to field engineers.</p>
            </div>
            <div className="metric-card glass-card accent">
              <span>Resolved Today</span>
              <strong>18</strong>
              <p>Tickets verified and resolved by field staff in the last 24 hours.</p>
            </div>
            <div className="metric-card glass-card">
              <span>AI Routing Accuracy</span>
              <strong>96.2%</strong>
              <p>Accuracy rate of autonomous department classification.</p>
            </div>
            <div className="metric-card glass-card accent">
              <span>Average Resolution Time</span>
              <strong>18.5 Hrs</strong>
              <p>Mean turnaround time from ticket submission to completion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI WORKFLOW PIPELINE */}
      <section className="section" id="workflow">
        <div className="container">
          <div className="section-heading">
            <span className="section-kicker">Process Automation</span>
            <h2>Automated Grievance Timeline Workflow</h2>
            <p>Our platform handles sorting, assignment, updates, and escalations autonomously without bureaucrat processing desks.</p>
          </div>

          <div className="workflow-pipeline">
            <div className="pipeline-node active">
              <strong>Citizen Complaint</strong>
              <span>Grievance received</span>
            </div>
            <span className="pipeline-arrow">&rarr;</span>
            <div className="pipeline-node">
              <strong>AI Parsing</strong>
              <span>Context understanding</span>
            </div>
            <span className="pipeline-arrow">&rarr;</span>
            <div className="pipeline-node">
              <strong>Routing & SLA</strong>
              <span>Dept & Priority set</span>
            </div>
            <span className="pipeline-arrow">&rarr;</span>
            <div className="pipeline-node">
              <strong>Dispatch</strong>
              <span>Officer assigned</span>
            </div>
            <span className="pipeline-arrow">&rarr;</span>
            <div className="pipeline-node">
              <strong>Resolution</strong>
              <span>Timeline closed</span>
            </div>
          </div>

          <div className="glass-card" style={{ marginTop: "40px", padding: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
            <div className="quick-action-icon" style={{ background: "var(--orange-soft)", color: "var(--orange)", flexShrink: 0 }}>
              <Database />
            </div>
            <div>
              <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>Multi-Department Coordination capability</h4>
              <p style={{ fontSize: "13.5px", color: "var(--muted)", lineHeight: "1.5" }}>
                When multiple impacts are parsed (e.g. pipe leakage causes sinkholes), the AI automatically spawns linked child tickets, assigning them to different departments with synchronized resolutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CIVICAGENT AI */}
      <section className="section soft-section" id="why-us" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <div className="section-heading">
            <span className="section-kicker">Core System Advantages</span>
            <h2>Why CivicAgent AI</h2>
            <p>Replacing slow, bureaucratic workflows with state-of-the-art AI-driven operations.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper"><Layers /></div>
              <h3>Agentic AI Routing</h3>
              <p>Natural language parsing autonomously maps unstructured descriptions directly to responsible municipal departments.</p>
            </div>
            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper" style={{ color: "var(--cyan)", background: "var(--cyan-soft)" }}><ShieldAlert /></div>
              <h3>Smart Prioritization</h3>
              <p>Identifies immediate safety hazards (e.g., shock risk, school zones) and auto-escalates tickets for instant SLAs.</p>
            </div>
            <div className="feature-card glass-card">
              <div className="feature-icon-wrapper"><Clock /></div>
              <h3>ETA Prediction</h3>
              <p>Generates resolution timelines using historical parameters, prioritizing high-risk cases for rapid response times.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11 - VIDEO DEMO MODAL */}
      {videoModalOpen && (
        <div className="video-modal-overlay" onClick={() => setVideoModalOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3 className="video-modal-title">🎬 CivicAgent AI Demo</h3>
              <p className="video-modal-subtitle">
                See how AI automatically classifies, prioritizes, and routes citizen complaints.
              </p>
              <button 
                className="video-modal-close" 
                onClick={() => setVideoModalOpen(false)} 
                aria-label="Close modal"
                type="button"
              >
                <X style={{ width: "20px", height: "20px", color: "#64748b" }} />
              </button>
            </div>
            
            <video 
              className="video-modal-player" 
              src="/demo.mp4" 
              controls 
              autoPlay 
              preload="metadata"
            />

            <div style={{ padding: "18px 24px", background: "#f8fbff", borderTop: "1px solid #e2e8f0" }}>
              <div className="video-feature-chips">
                <span className="video-feature-chip">✓ AI Routing</span>
                <span className="video-feature-chip">✓ Smart Prioritization</span>
                <span className="video-feature-chip">✓ Real-Time Tracking</span>
                <span className="video-feature-chip">✓ Citizen Dashboard</span>
                <span className="video-feature-chip">✓ AI Copilot</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

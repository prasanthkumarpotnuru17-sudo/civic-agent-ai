import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, ArrowUpRight, Loader } from "lucide-react";
import { CivicAgentComplaintService } from "../services/complaintService";
import { CivicAgentRoutingEngine } from "../services/routingEngine";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      content: "Hello! I am **CivicAgent AI Copilot**. How can I help you today? You can ask me how to submit a complaint, track a grievance ID, or describe a city problem to analyze routing."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const presetQuestions = [
    { text: "How do I submit a complaint?", type: "help" },
    { text: "Track CMP-2026-001", type: "track" },
    { text: "What departments are available?", type: "dept" },
    { text: "Explain ETA SLA rules", type: "eta" }
  ];

  const addMessage = (type, content, data = null) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), type, content, data }]);
  };

  const processResponse = async (text) => {
    setLoading(true);
    const normalizedText = text.trim().toUpperCase();

    // Check for ID tracking
    if (normalizedText.startsWith("TRACK ") || normalizedText.startsWith("CMP-")) {
      const matchId = normalizedText.replace("TRACK ", "").trim();
      try {
        const ticket = await CivicAgentComplaintService.getComplaint(matchId);
        if (ticket) {
          const content = `🔍 **Grievance Details for ${ticket.id}**:\n\n- **Citizen Name**: ${ticket.fullName}\n- **Department Assigned**: ${ticket.analysis?.primaryDepartment?.label || ticket.department}\n- **Priority Tag**: ${ticket.analysis?.priority || ticket.priority}\n- **Current Status**: **${ticket.status}**\n- **Assigned Officer**: ${ticket.assignedOfficer}\n- **Resolution ETA**: ${ticket.analysis?.eta || ticket.eta}\n\n*Timeline Status:* ${ticket.status === "Resolved" ? "Closed & Verified" : "Active work underway."}`;
          addMessage("bot", content, { ticket });
        } else {
          addMessage("bot", `❌ Complaint ID **${matchId}** not found. Please verify the ID format (e.g. CMP-2026-001) or try the demo flow.`);
        }
      } catch (err) {
        addMessage("bot", "An error occurred while fetching the complaint record. Please try again.");
      }
      setLoading(false);
      return;
    }

    // Check for help
    if (normalizedText.includes("HELP") || normalizedText.includes("SUBMIT A COMPLAINT") || normalizedText.includes("HOW DO I")) {
      addMessage("bot", "📝 **How to submit a complaint**:\n\n1. Click **Submit Complaint** in the navigation header or home hero.\n2. Fill out your name, mobile, and location details.\n3. Type your grievance in the description. Our AI analyzes and routes it instantly.\n4. Upload optional photo evidence or use voice input.\n5. Click Submit to instantly receive a tracking ID!");
      setLoading(false);
      return;
    }

    // Check for departments
    if (normalizedText.includes("DEPARTMENT")) {
      addMessage("bot", "🏢 **City Municipal Departments**:\n\n- **Electrical**: Streetlight Flickering, Power Issues\n- **Water Supply**: Pipeline leakages, Shortages\n- **Sanitation**: Garbage Pickup delays, Drains blockages\n- **Roads**: Potholes, damaged asphalt, divider repairs\n- **Drainage**: Manhole covers, waterlogging\n- **Public Safety**: Hazards, illegal structures");
      setLoading(false);
      return;
    }

    // Check for ETA rules
    if (normalizedText.includes("ETA") || normalizedText.includes("SLA") || normalizedText.includes("HOURS")) {
      addMessage("bot", "⏱️ **SLA Resolution Estimates**:\n\n- **CRITICAL Priority**: 2 to 6 Hours\n- **HIGH Priority**: 12 to 24 Hours\n- **MEDIUM Priority**: 2 to 3 Days\n- **LOW Priority**: 5 to 7 Days");
      setLoading(false);
      return;
    }

    // Default: Run Routing Engine Analysis
    try {
      const analysis = await CivicAgentRoutingEngine.analyzeComplaint({ description: text });
      
      const content = `🤖 **CivicAgent AI Active Routing Log**:\n\nI have parsed your description and generated autonomous routing metrics:`;
      addMessage("bot", content, { analysis, text });
    } catch (err) {
      addMessage("bot", "Could not analyze the input. Please try describing a specific infrastructure problem (e.g. *flickering streetlight* or *water leak*).");
    }
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userQuery = inputValue;
    addMessage("user", userQuery);
    setInputValue("");
    
    await processResponse(userQuery);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        className="copilot-floating-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Copilot"
      >
        <span style={{ position: "relative", display: "inline-block" }}>
          <MessageSquare style={{ width: "20px", height: "20px" }} />
          <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", border: "2px solid #fff" }}></span>
        </span>
        <span>CivicAgent AI Copilot</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="copilot-panel glass-card">
          <div className="copilot-head">
            <h4>
              <span className="brand-mark" style={{ width: "26px", height: "26px", borderRadius: "6px" }}>🤖</span>
              CivicAgent AI Copilot
            </h4>
            <button className="copilot-close" onClick={() => setIsOpen(false)} aria-label="Close panel">
              <X style={{ width: "18px", height: "18px" }} />
            </button>
          </div>

          <div className="copilot-chat">
            {messages.map((m) => (
              <React.Fragment key={m.id}>
                <div className={`copilot-msg ${m.type}`}>
                  {/* Markdown simulator */}
                  {m.content.split("\n\n").map((para, pIdx) => {
                    // Quick bold formatting
                    const parts = para.split("**");
                    return (
                      <p key={pIdx} style={{ margin: pIdx > 0 ? "8px 0 0" : 0 }}>
                        {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx}>{p}</strong> : p)}
                      </p>
                    );
                  })}
                </div>

                {/* Data specific templates */}
                {m.data?.analysis && (
                  <div className="ai-scorecard" style={{ margin: "0 16px 12px 16px", padding: "14px", fontSize: "12px", border: "1px solid rgba(37, 99, 235, 0.15)", background: "rgba(255, 255, 255, 0.85)" }}>
                    <div className="scorecard-header" style={{ paddingBottom: "6px", marginBottom: "8px" }}>
                      <span className="scorecard-title" style={{ fontSize: "12px" }}>AI Routing Analysis</span>
                      <span className="intent-badge" style={{ fontSize: "9.5px", padding: "2px 6px" }}>{m.data.analysis.intent}</span>
                    </div>

                    {/* Confidence Progress */}
                    <div className="confidence-progress-section" style={{ gap: "4px", marginBottom: "8px" }}>
                      <div className="confidence-header" style={{ fontSize: "11px" }}>
                        <span>Confidence</span>
                        <strong>{m.data.analysis.confidence}%</strong>
                      </div>
                      <div className="confidence-progress-container" style={{ height: "6px" }}>
                        <div className="confidence-progress-bar" style={{ width: `${m.data.analysis.confidence}%` }}></div>
                      </div>
                    </div>

                    {/* Department Scores */}
                    <div className="scorecard-dept-list" style={{ gap: "8px", padding: "8px", borderRadius: "8px", marginBottom: "8px" }}>
                      {Object.entries(m.data.analysis.departmentScores || {})
                        .filter(([_, score]) => score > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, score]) => {
                          const isActive = name === m.data.analysis.primaryDepartment.name;
                          return (
                            <div key={name} className="scorecard-dept-item">
                              <div className={`scorecard-dept-info ${isActive ? "active" : ""}`} style={{ fontSize: "11px" }}>
                                <span>{name}</span>
                                <span className="scorecard-dept-score">+{score}</span>
                              </div>
                              <div className="scorecard-dept-bar-bg" style={{ height: "4px" }}>
                                <div className={`scorecard-dept-bar-fill ${isActive ? "active" : ""}`} style={{ width: `${Math.min(100, (score / 120) * 100)}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>

                    {/* Keywords */}
                    {m.data.analysis.detectedKeywords && m.data.analysis.detectedKeywords.length > 0 && (
                      <div className="keyword-chips-container" style={{ gap: "4px", marginBottom: "8px" }}>
                        {m.data.analysis.detectedKeywords.map((kw, i) => (
                          <span key={i} className="keyword-chip" style={{ fontSize: "9.5px", padding: "2px 5px" }}>{kw}</span>
                        ))}
                      </div>
                    )}

                    {/* Meta Grid */}
                    <div className="scorecard-meta-grid" style={{ gap: "8px", padding: "8px 0 0 0", borderTop: "1px solid var(--line)" }}>
                      <div className="meta-card" style={{ padding: "6px" }}>
                        <label style={{ fontSize: "8px" }}>Primary Dept</label>
                        <span style={{ fontSize: "11px" }}>{m.data.analysis.primaryDepartment?.label}</span>
                      </div>
                      <div className="meta-card priority-card" style={{ padding: "6px" }}>
                        <label style={{ fontSize: "8px" }}>Priority</label>
                        <span className={m.data.analysis.priority?.toLowerCase()} style={{ fontSize: "11px" }}>{m.data.analysis.priority}</span>
                      </div>
                      <div className="meta-card" style={{ padding: "6px", gridColumn: "span 2" }}>
                        <label style={{ fontSize: "8px" }}>SLA ETA</label>
                        <span style={{ fontSize: "11px" }}>{m.data.analysis.eta}</span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
            {loading && (
              <div className="copilot-msg bot" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Loader className="animate-spin" style={{ width: "16px", height: "16px", color: "var(--blue)" }} />
                <span>Copilot is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Quick Preset Prompts */}
          <div className="copilot-suggestions">
            {presetQuestions.map((q) => (
              <button 
                key={q.text} 
                className="copilot-sugg-btn"
                onClick={() => {
                  addMessage("user", q.text);
                  processResponse(q.text);
                }}
              >
                {q.text}
                <ArrowUpRight style={{ width: "11px", height: "11px", display: "inline", marginLeft: "2px" }} />
              </button>
            ))}
          </div>

          <form className="copilot-input-bar" onSubmit={handleSend}>
            <input 
              placeholder="Ask Copilot..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !inputValue.trim()} aria-label="Send query">
              <Send style={{ width: "14px", height: "14px" }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

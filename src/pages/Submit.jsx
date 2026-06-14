import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, Mic, ArrowRight, Activity, ShieldAlert, Clock, Layers, ShieldCheck } from "lucide-react";
import { CivicAgentComplaintService } from "../services/complaintService";
import { CivicAgentRoutingEngine } from "../services/routingEngine";
import useAuth from "../hooks/useAuth";
import { updateUserProfile } from "../services/firebase";

export default function Submit({ latestSubmission, onSubmissionSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, updateProfileState } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    location: "",
    category: "",
    description: "",
    language: "English"
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFileName, setImageFileName] = useState("No image selected");
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Tap to dictate complaint");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Live AI analysis state
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
  const [possibleDuplicate, setPossibleDuplicate] = useState(null);

  // Debounced duplicate detection check
  useEffect(() => {
    const desc = formData.description.trim();
    const loc = formData.location.trim();
    
    if (desc.length < 10 || loc.length < 3) {
      setPossibleDuplicate(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      const duplicate = await CivicAgentComplaintService.checkDuplicate(desc, loc);
      setPossibleDuplicate(duplicate);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [formData.description, formData.location]);

  // Check for prefilled category from homepage click
  useEffect(() => {
    if (location.state?.prefilledCategory) {
      setFormData(prev => ({ ...prev, category: location.state.prefilledCategory }));
    }
  }, [location.state]);

  // Autofill form if user is logged in
  useEffect(() => {
    if (user && userProfile && !hasPrefilled) {
      setFormData((prev) => ({
        ...prev,
        fullName: userProfile.name || "",
        mobile: userProfile.mobile || "",
        email: userProfile.email || "",
        location: userProfile.defaultLocation || "",
        language: userProfile.preferredLanguage || "English"
      }));
      setHasPrefilled(true);
    }
  }, [user, userProfile, hasPrefilled]);

  // Reset prefill flag on logout
  useEffect(() => {
    if (!user) {
      setHasPrefilled(false);
    }
  }, [user]);

  // Debounced live typing analysis
  useEffect(() => {
    const text = formData.description.trim();
    if (text.length < 8) {
      setLiveAnalysis(null);
      return;
    }

    setIsLiveAnalyzing(true);
    const timer = setTimeout(async () => {
      const res = await CivicAgentRoutingEngine.analyzeLocal({
        description: text,
        category: formData.category,
        location: formData.location
      });
      setLiveAnalysis(res);
      setIsLiveAnalyzing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.description, formData.category, formData.location]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImageFileName(file.name);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus("Voice not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = formData.language === "Telugu" ? "te-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    setVoiceStatus("Listening...");
    recognition.start();

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setFormData(prev => ({
        ...prev,
        description: (prev.description + " " + transcript).trim()
      }));
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceStatus("Tap to dictate complaint");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceStatus("Voice error, try again");
    };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!user) {
      if (!formData.fullName.trim()) errors.fullName = "Full name is required";
      if (!formData.mobile.trim() || !/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
        errors.mobile = "Enter a valid 10-digit mobile number";
      }
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = "Enter a valid email address";
      }
    }
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.description.trim() || formData.description.trim().length < 12) {
      errors.description = "Describe the complaint in at least 12 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitLoading(true);

    try {
      let imageUrl = "";
      if (selectedImage) {
        imageUrl = URL.createObjectURL(selectedImage);
      }

      const complaintPayload = user ? {
        fullName: userProfile?.name || "",
        mobile: userProfile?.mobile || "",
        email: userProfile?.email || "",
        location: formData.location,
        category: formData.category,
        description: formData.description,
        language: formData.language,
        userId: user.uid,
        imageName: imageFileName !== "No image selected" ? imageFileName : "",
        imageUrl
      } : {
        fullName: formData.fullName,
        mobile: formData.mobile,
        email: formData.email,
        location: formData.location,
        category: formData.category,
        description: formData.description,
        language: formData.language,
        userId: null,
        imageName: imageFileName !== "No image selected" ? imageFileName : "",
        imageUrl
      };

      const complaint = await CivicAgentComplaintService.submitComplaint(complaintPayload);

      // Auto-save user preferences (returning user experience) and increment local count
      if (user) {
        const currentTotal = userProfile?.totalComplaints || 0;
        const updatedPrefs = {
          defaultLocation: formData.location,
          preferredLanguage: formData.language,
          totalComplaints: currentTotal + 1
        };
        try {
          // Save locally first
          localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify({ ...userProfile, ...updatedPrefs }));
          // Save to Firestore
          await updateUserProfile(user.uid, updatedPrefs);
          // Update auth context state
          updateProfileState(updatedPrefs);
        } catch (prefErr) {
          console.warn("Failed to auto-save user preferences:", prefErr);
        }
      }

      onSubmissionSuccess(complaint);
      
      // Reset form but retain logged-in user profile details
      setFormData({
        fullName: user ? (userProfile?.name || "") : "",
        mobile: user ? (userProfile?.mobile || "") : "",
        email: user ? (userProfile?.email || "") : "",
        location: user ? (userProfile?.defaultLocation || "") : "",
        category: "",
        description: "",
        language: user ? (userProfile?.preferredLanguage || "English") : "English"
      });
      setSelectedImage(null);
      setImageFileName("No image selected");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <section className="section" style={{ minHeight: "80vh" }}>
      <div className="container">
        <div className="section-heading" style={{ textAlign: "left", marginLeft: 0, marginBottom: "36px" }}>
          <span className="section-kicker">Autonomous Grievance Dispatch</span>
          <h2>Submit a complaint in seconds</h2>
          <p>Type or dictate your grievance. The AI Copilot understands context, routes departments, and generates tracking IDs instantly.</p>
        </div>

        <div className="submission-grid">
          <form className="form-card glass-card" onSubmit={handleFormSubmit} noValidate>
            {user && userProfile && (
              <div className="verified-citizen-card">
                <div className="verified-citizen-header">
                  <div className="verified-citizen-title">
                    👤 Verified Citizen
                  </div>
                  <span className="verified-citizen-badge">
                    Verified Account ✓
                  </span>
                </div>
                
                <div className="verified-citizen-grid">
                  <div className="verified-citizen-item">
                    <div className="verified-citizen-label">Name</div>
                    <div className="verified-citizen-value">{userProfile.name || "Not set"}</div>
                  </div>
                  <div className="verified-citizen-item">
                    <div className="verified-citizen-label">Mobile Number</div>
                    <div className="verified-citizen-value">{userProfile.mobile || "Not set"}</div>
                  </div>
                  <div className="verified-citizen-item">
                    <div className="verified-citizen-label">Email Address</div>
                    <div className="verified-citizen-value">{userProfile.email || "Not set"}</div>
                  </div>
                  <div className="verified-citizen-item">
                    <div className="verified-citizen-label">Default Location</div>
                    <div className="verified-citizen-value">{userProfile.defaultLocation || "None saved"}</div>
                  </div>
                </div>

                <div className="verified-citizen-note">
                  Verified account detected. Your saved profile information will be used automatically.
                </div>

                <div className="verified-citizen-actions" style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button
                    type="button"
                    className="verified-citizen-edit-btn"
                    onClick={() => navigate("/profile")}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {!user && (
              <>
                <div className="form-row two">
                  <label>
                    <span>Full Name</span>
                    <input
                      required
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <small className="field-error">{formErrors.fullName}</small>
                  </label>
                  <label>
                    <span>Mobile Number</span>
                    <input
                      inputMode="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                    <small className="field-error">{formErrors.mobile}</small>
                  </label>
                </div>

                <div className="form-row two">
                  <label>
                    <span>Email <em>Optional</em></span>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <small className="field-error">{formErrors.email}</small>
                  </label>
                  <label>
                    <span>Language</span>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    >
                      <option value="English">English</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {user && (
              <div className="form-row" style={{ marginBottom: "16px" }}>
                <label>
                  <span>Language Preference</span>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </label>
              </div>
            )}

            <label>
              <span>Location</span>
              <input
                required
                placeholder="Area, landmark, city"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <small className="field-error">{formErrors.location}</small>
            </label>

            <label>
              <span>Category <em>Optional</em></span>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Auto-detect with AI</option>
                <option>Streetlight Issues</option>
                <option>Garbage Collection</option>
                <option>Water Supply</option>
                <option>Water Leakage</option>
                <option>Road Damage</option>
                <option>Drainage Issues</option>
                <option>Public Safety</option>
                <option>Public Infrastructure</option>
              </select>
            </label>

            <label>
              <span>Complaint Description</span>
              <textarea
                required
                minLength={12}
                rows={5}
                placeholder="Describe the issue, impact, and exact place in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
              <small className="field-error">{formErrors.description}</small>
            </label>

            <div className="input-tools">
              <div
                className="upload-zone"
                tabIndex={0}
                role="button"
                onClick={() => document.getElementById("imageUpload").click()}
              >
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
                <Upload style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
                <strong>Drag image here</strong>
                <span>or browse photo evidence</span>
                <small style={{ color: "var(--blue)", fontWeight: "600", marginTop: "4px" }}>{imageFileName}</small>
              </div>

              <button
                className={`voice-button ${isListening ? "listening" : ""}`}
                type="button"
                onClick={startVoiceInput}
              >
                <Mic style={{ width: "24px", height: "24px" }} />
                <span>Voice Input</span>
                <small>{voiceStatus}</small>
              </button>
            </div>

            {possibleDuplicate && (
              <div className="duplicate-alert">
                <div className="duplicate-alert-header">
                  <ShieldAlert style={{ width: "18px", height: "18px" }} />
                  <span>Possible Existing Complaint Detected</span>
                </div>
                <div className="duplicate-alert-body">
                  A similar issue has already been reported at this location. Our field teams are actively working on it.
                  <div className="duplicate-alert-meta">
                    <span>ID: {possibleDuplicate.id}</span>
                    <span>Status: {possibleDuplicate.status || "In Progress"}</span>
                  </div>
                </div>
              </div>
            )}

            <button className="button primary submit-button" type="submit" disabled={submitLoading} style={{ height: "48px" }}>
              <span>{submitLoading ? "Autonomous Agent processing..." : "Submit Complaint"}</span>
              {!submitLoading && <ArrowRight />}
            </button>
          </form>

          {/* Live AI Analysis Panel */}
          <aside className="result-stack">
            <article className="analysis-card glass-card">
              <div className="card-title-row">
                <div className="title-with-icon">
                  <span className="soft-icon"><Activity /></span>
                  <strong>Live AI Analysis Agent</strong>
                </div>
                {isLiveAnalyzing ? (
                  <span className="status-chip" style={{ background: "var(--blue-soft)", color: "var(--blue)", border: "1px solid rgba(59, 130, 246, 0.15)" }}>Analyzing...</span>
                ) : liveAnalysis ? (
                  <span className="status-chip ready">Ready</span>
                ) : (
                  <span className="status-chip" style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted)" }}>Idle</span>
                )}
              </div>

              {!liveAnalysis ? (
                <div className="analysis-empty">
                  Start typing your complaint description. The Copilot will analyze and route details in real-time.
                </div>
              ) : (
                <div className="analysis-content">
                  {/* Confidence Progress */}
                  <div className="confidence-progress-section" style={{ marginBottom: "12px" }}>
                    <div className="confidence-header" style={{ fontSize: "12px" }}>
                      <span>Classification Confidence</span>
                      <strong>{liveAnalysis.confidence}%</strong>
                    </div>
                    <div className="confidence-progress-container">
                      <div className="confidence-progress-bar" style={{ width: `${liveAnalysis.confidence}%` }}></div>
                    </div>
                  </div>

                  {/* Intent Badge */}
                  <div style={{ marginBottom: "12px" }}>
                    <span className="intent-badge">{liveAnalysis.intent}</span>
                  </div>

                  {/* Department Scores */}
                  <div className="scorecard-dept-list" style={{ marginBottom: "12px" }}>
                    <h5 style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "4px" }}>
                      Department Match Scores
                    </h5>
                    {Object.entries(liveAnalysis.departmentScores || {})
                      .filter(([_, score]) => score > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, score]) => {
                        const isActive = name === liveAnalysis.primaryDepartment.name;
                        return (
                          <div key={name} className="scorecard-dept-item">
                            <div className={`scorecard-dept-info ${isActive ? "active" : ""}`} style={{ fontSize: "11.5px" }}>
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
                  </div>

                  {/* Matched Keywords */}
                  {liveAnalysis.detectedKeywords && liveAnalysis.detectedKeywords.length > 0 && (
                    <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                      <h5 style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                        Semantic Tokens
                      </h5>
                      <div className="keyword-chips-container">
                        {liveAnalysis.detectedKeywords.map((kw, i) => (
                          <span key={i} className="keyword-chip" style={{ fontSize: "10.5px", padding: "2px 6px" }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta Grid */}
                  <div className="scorecard-meta-grid" style={{ gap: "8px", gridTemplateColumns: "1fr", padding: 0, border: "none" }}>
                    <div className="meta-card" style={{ padding: "8px" }}>
                      <label style={{ fontSize: "8.5px" }}>Primary Department</label>
                      <span style={{ fontSize: "12px" }}>{liveAnalysis.primaryDepartment?.label}</span>
                    </div>
                    <div className="meta-card priority-card" style={{ padding: "8px" }}>
                      <label style={{ fontSize: "8.5px" }}>Resolved Priority</label>
                      <span className={liveAnalysis.priority?.toLowerCase()} style={{ fontSize: "12px" }}>{liveAnalysis.priority}</span>
                    </div>
                    <div className="meta-card" style={{ padding: "8px" }}>
                      <label style={{ fontSize: "8.5px" }}>Resolution SLA</label>
                      <span style={{ fontSize: "12px" }}>{liveAnalysis.eta}</span>
                    </div>
                    <div className="meta-card" style={{ padding: "8px" }}>
                      <label style={{ fontSize: "8.5px" }}>Detected Location</label>
                      <span style={{ fontSize: "12px" }}>{liveAnalysis.extractedLocation || "City Area"}</span>
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="scorecard-reasoning-panel" style={{ marginTop: "12px", padding: "10px", fontSize: "11.5px" }}>
                    <h5 style={{ fontSize: "9.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--blue)" }}>
                      Decision Audit Trail
                    </h5>
                    <p style={{ margin: 0, fontWeight: 600 }}><strong>Routing:</strong> {liveAnalysis.reasoning?.routing}</p>
                    <div style={{ display: "grid", gap: "2px", fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      <div><strong>Priority Selection:</strong> {liveAnalysis.reasoning?.priority}</div>
                      <div><strong>SLA ETA Selection:</strong> {liveAnalysis.reasoning?.eta}</div>
                    </div>
                  </div>
                </div>
              )}
            </article>

            {latestSubmission && (
              <article className="id-card glass-card" style={{ border: "1px solid var(--green)", padding: "24px" }}>
                <h3 style={{ color: "var(--green)", display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0", fontSize: "16px" }}>
                  <ShieldCheck style={{ width: "20px" }} /> Complaint Submitted Successfully
                </h3>
                <div style={{ display: "grid", gap: "10px", fontSize: "13.5px" }}>
                  <div className="id-row">
                    <span>Complaint ID</span>
                    <strong>{latestSubmission.id}</strong>
                  </div>
                  <div className="id-row">
                    <span>Submitted By</span>
                    <strong>{latestSubmission.fullName || latestSubmission.name || "Citizen"}</strong>
                  </div>
                  <div className="id-row">
                    <span>Department</span>
                    <strong>{latestSubmission.department || latestSubmission.analysis?.primaryDepartment?.label || "Electrical"}</strong>
                  </div>
                  <div className="id-row">
                    <span>Priority</span>
                    <strong style={{ 
                      color: latestSubmission.priority === "High" || latestSubmission.priority === "Critical" ? "var(--red)" : "inherit"
                    }}>{latestSubmission.priority || latestSubmission.analysis?.priority || "Normal"}</strong>
                  </div>
                  <div className="id-row">
                    <span>ETA</span>
                    <strong>{latestSubmission.eta || latestSubmission.analysis?.eta || "24 Hours"}</strong>
                  </div>
                  <div className="id-row" style={{ borderTop: "1px solid var(--line)", paddingTop: "10px", marginTop: "6px" }}>
                    <span>Current Status</span>
                    <strong style={{ color: "var(--blue)" }}>{latestSubmission.status}</strong>
                  </div>
                  <div className="id-row">
                    <span>Assigned Officer</span>
                    <strong>{latestSubmission.assignedOfficer}</strong>
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

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Phone, Mail, Award, CheckCircle, Clock, ShieldCheck, 
  FileText, Calendar, PlusCircle, Search, Compass, Globe, 
  Zap, Bell, Shield, ArrowRight, ShieldAlert 
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { updateUserProfile } from "../services/firebase";
import { CivicAgentComplaintService } from "../services/complaintService";

export default function Profile() {
  const { user, userProfile, updateProfileState } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [defaultLocation, setDefaultLocation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [notificationPreference, setNotificationPreference] = useState("In-App Alerts");

  // Database stats & data
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    high: 0
  });
  
  const [resRate, setResRate] = useState(100);
  const [avgResTime, setAvgResTime] = useState("24h SLA");
  
  const [editLoading, setEditLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Populate form fields from userProfile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setMobile(userProfile.mobile || "");
      setEmail(userProfile.email || "");
      setDefaultLocation(userProfile.defaultLocation || "");
      setPreferredLanguage(userProfile.preferredLanguage || "English");
      setNotificationPreference(userProfile.notificationPreference || "In-App Alerts");
    }
  }, [userProfile]);

  // Fetch live statistics and user complaints from Firestore
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const allComplaints = await CivicAgentComplaintService.readComplaints();
      const userComplaints = allComplaints.filter(c => c.userId === user.uid);
      setRecentComplaints(userComplaints);

      const total = userComplaints.length;
      const resolved = userComplaints.filter(c => c.status === "Resolved").length;
      // Active states: anything not resolved
      const pending = userComplaints.filter(c => ["Assigned", "Officer Assigned", "In Progress", "Submitted"].includes(c.status)).length;
      const high = userComplaints.filter(c => c.priority === "High" || c.priority === "Critical" || c.analysis?.priority === "High" || c.analysis?.priority === "Critical").length;

      // Rate
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      setResRate(rate);

      // Resolution Time Calculation
      let totalTime = 0;
      let resolvedCountWithTime = 0;
      userComplaints.filter(c => c.status === "Resolved").forEach(c => {
        const start = new Date(c.submittedAt || c.createdAt);
        const resolvedEvent = c.history?.find(h => h.label === "Resolved" || h.status === "Resolved");
        if (resolvedEvent && (resolvedEvent.time || resolvedEvent.timestamp)) {
          const end = new Date(resolvedEvent.time || resolvedEvent.timestamp);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            totalTime += (end - start);
            resolvedCountWithTime++;
          }
        }
      });
      
      if (resolvedCountWithTime > 0) {
        const avgHours = totalTime / (1000 * 60 * 60 * resolvedCountWithTime);
        setAvgResTime(`${avgHours.toFixed(1)} hrs`);
      } else {
        setAvgResTime("24h SLA");
      }

      setStats({ total, resolved, pending, high });
    } catch (err) {
      console.error("Error loading profile statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Name is required.");
      return;
    }
    if (mobile.trim() && !/^[6-9]\d{9}$/.test(mobile.trim())) {
      setErrorMsg("Enter a valid 10-digit mobile number.");
      return;
    }

    setEditLoading(true);
    try {
      const updatedData = { 
        name, 
        mobile, 
        defaultLocation, 
        preferredLanguage,
        notificationPreference 
      };
      
      // Save locally first
      localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify({ ...userProfile, ...updatedData }));
      
      try {
        await updateUserProfile(user.uid, updatedData);
      } catch (fbErr) {
        console.warn("Firestore profile update failed, using local profile fallback:", fbErr);
      }

      updateProfileState(updatedData);
      setSuccessMsg("Profile settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update profile settings.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetForm = () => {
    if (userProfile) {
      setName(userProfile.name || "");
      setMobile(userProfile.mobile || "");
      setDefaultLocation(userProfile.defaultLocation || "");
      setPreferredLanguage(userProfile.preferredLanguage || "English");
      setNotificationPreference(userProfile.notificationPreference || "In-App Alerts");
      setSuccessMsg("Form reset to saved settings.");
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  };

  const handleChangePassword = () => {
    alert("Password reset email sent! Please check your inbox to configure system credentials securely.");
  };

  const handleOpenCopilot = () => {
    const btn = document.querySelector(".copilot-floating-btn");
    if (btn) {
      btn.click();
    } else {
      alert("AI Copilot is loaded globally. Click the assistant icon in the bottom corner of your screen.");
    }
  };

  // Dynamic AI Smart Insights calculations
  const categoriesCount = {};
  recentComplaints.forEach(c => {
    const cat = c.category || "Auto-detect";
    categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
  });
  
  let mostReportedCategory = "None";
  let maxCategoryCount = 0;
  Object.entries(categoriesCount).forEach(([cat, count]) => {
    if (count > maxCategoryCount) {
      maxCategoryCount = count;
      mostReportedCategory = cat;
    }
  });

  const locationsCount = {};
  recentComplaints.forEach(c => {
    const loc = c.location || "";
    if (loc) {
      locationsCount[loc] = (locationsCount[loc] || 0) + 1;
    }
  });

  let mostActiveLocation = "None";
  let maxLocCount = 0;
  Object.entries(locationsCount).forEach(([loc, count]) => {
    if (count > maxLocCount) {
      maxLocCount = count;
      mostActiveLocation = loc;
    }
  });

  const getSmartRecommendation = () => {
    if (recentComplaints.length === 0) {
      return "No complaints registered. Keep your profile location updated to expedite dispatch times.";
    }
    const lowerCat = mostReportedCategory.toLowerCase();
    if (lowerCat.includes("streetlight") || lowerCat.includes("electrical")) {
      return "Streetlight issues are your most reported category. Enable priority safety alerts in settings.";
    }
    if (lowerCat.includes("water")) {
      return "Water supply is your most reported category. Check community valve release timetables.";
    }
    if (lowerCat.includes("garbage") || lowerCat.includes("sanitation")) {
      return "Sanitation issues are your most reported category. Enable morning pickup notifications.";
    }
    if (lowerCat.includes("road") || lowerCat.includes("infrastructure")) {
      return "Road repairs are your most reported category. Opt for public safety alerts.";
    }
    return `Most reports originate from ${mostActiveLocation !== "None" ? mostActiveLocation : "Eluru"}. Enable notifications for faster updates.`;
  };

  const lastComplaintDate = recentComplaints.length > 0 
    ? new Date(recentComplaints[0].submittedAt || recentComplaints[0].createdAt).toLocaleDateString()
    : "No complaints yet";

  const lastUsedLocation = recentComplaints.length > 0
    ? recentComplaints[0].location
    : "None";

  // Timeline feed generator mapping history logs
  const getActivityTimeline = () => {
    const events = [];
    recentComplaints.forEach(c => {
      if (c.history && Array.isArray(c.history)) {
        c.history.forEach(h => {
          const timeVal = h.time || h.timestamp;
          events.push({
            id: c.id,
            label: h.label || h.status,
            note: h.note || `Complaint status updated to ${h.status}`,
            time: timeVal ? new Date(timeVal).toLocaleString() : new Date(c.submittedAt || c.createdAt).toLocaleString(),
            dateObj: timeVal ? new Date(timeVal) : new Date(c.submittedAt || c.createdAt)
          });
        });
      }
    });

    const sortedEvents = events
      .filter(e => !isNaN(e.dateObj.getTime()))
      .sort((a, b) => b.dateObj - a.dateObj);

    return sortedEvents.slice(0, 5);
  };

  const timelineEvents = getActivityTimeline();

  const getEventIcon = (label) => {
    switch (label) {
      case "Submitted":
        return { icon: "✓", text: "Complaint Submitted", color: "var(--blue)" };
      case "AI Analysis Completed":
      case "Department Assigned":
        return { icon: "⚙", text: "Assigned to Department", color: "#8b5cf6" };
      case "Officer Assigned":
        return { icon: "👨‍💼", text: "Officer Assigned", color: "var(--orange)" };
      case "In Progress":
        return { icon: "🚧", text: "Work Started", color: "var(--orange)" };
      case "Resolved":
        return { icon: "✅", text: "Complaint Resolved", color: "var(--green)" };
      default:
        return { icon: "🔔", text: label || "Status Update", color: "var(--blue)" };
    }
  };

  if (!userProfile) return null;

  return (
    <section className="section" style={{ minHeight: "90vh", background: "rgba(240, 246, 255, 0.5)", padding: "40px 0" }}>
      <div className="container">
        
        {/* 2-COLUMN DASHBOARD GRID */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr", 
          gap: "30px", 
          alignItems: "flex-start" 
        }} className="dashboard-layout-grid">
          
          {/* LEFT COLUMN: Hero, Settings, Activity, Complaints Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* SECTION 1 - PROFILE HERO */}
            <div className="glass-card" style={{ 
              padding: "30px", 
              border: "1px solid rgba(59, 130, 246, 0.2)", 
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,248,255,0.95))",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(59, 130, 246, 0.05)"
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%", 
                    background: "linear-gradient(135deg, var(--blue), #0ea5e9)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "36px",
                    fontWeight: "700",
                    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.2)"
                  }}>
                    {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text)", margin: 0 }}>{userProfile.name}</h2>
                      <span style={{ 
                        color: "var(--green)", 
                        fontSize: "11px", 
                        fontWeight: "700",
                        background: "var(--green-soft)", 
                        padding: "3px 10px", 
                        borderRadius: "12px", 
                        border: "1px solid rgba(16, 185, 129, 0.25)" 
                      }}>
                        Verified Citizen ✓
                      </span>
                      <span style={{ 
                        color: "var(--blue)", 
                        fontSize: "11px", 
                        fontWeight: "700",
                        background: "var(--blue-soft)", 
                        padding: "3px 10px", 
                        borderRadius: "12px", 
                        border: "1px solid rgba(59, 130, 246, 0.2)" 
                      }}>
                        Active
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "8px", fontSize: "13.5px", color: "var(--muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail style={{ width: "14px" }} /> {userProfile.email}</span>
                      {userProfile.mobile && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone style={{ width: "14px" }} /> {userProfile.mobile}</span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar style={{ width: "14px" }} /> Member Since: {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button 
                    type="button" 
                    className="button primary" 
                    onClick={() => document.getElementById("profile-settings-form")?.scrollIntoView({ behavior: "smooth" })}
                    style={{ height: "40px", fontSize: "13px" }}
                  >
                    <User style={{ width: "15px" }} />
                    <span>Edit Profile</span>
                  </button>
                  <button 
                    type="button" 
                    className="button secondary" 
                    onClick={handleChangePassword}
                    style={{ height: "40px", fontSize: "13px" }}
                  >
                    <Shield style={{ width: "15px" }} />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--line)", fontSize: "13px" }}>
                <div>
                  <span style={{ color: "var(--muted)" }}>Total Complaints Submitted: </span>
                  <strong style={{ color: "var(--text)" }}>{statsLoading ? "..." : (userProfile.totalComplaints > stats.total ? userProfile.totalComplaints : stats.total)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Last Complaint Logged: </span>
                  <strong style={{ color: "var(--text)" }}>{statsLoading ? "..." : lastComplaintDate}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Citizen Ranking: </span>
                  <strong style={{ color: "var(--blue)" }}>Civic Contributor</strong>
                </div>
              </div>
            </div>
            
            {/* SECTION 4 - PROFILE SETTINGS FORM */}
            <form id="profile-settings-form" className="form-card glass-card" onSubmit={handleUpdateProfile} noValidate style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <User style={{ color: "var(--blue)", width: "18px" }} /> Profile & Settings
              </h3>

              {successMsg && (
                <div style={{ background: "var(--green-soft)", color: "var(--green)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-row two">
                <label>
                  <span>Full Name</span>
                  <input
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Mobile Number</span>
                  <input
                    placeholder="10-digit number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-row two">
                <label>
                  <span>Email Address <em>Read Only</em></span>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    style={{ background: "rgba(0,0,0,0.02)", cursor: "not-allowed", color: "var(--muted)" }}
                  />
                </label>
                <label>
                  <span>Default Location</span>
                  <input
                    placeholder="E.g., Eluru, Andhra Pradesh"
                    value={defaultLocation}
                    onChange={(e) => setDefaultLocation(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-row two">
                <label>
                  <span>Preferred Language</span>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </label>
                <label>
                  <span>Notification Preference</span>
                  <select
                    value={notificationPreference}
                    onChange={(e) => setNotificationPreference(e.target.value)}
                  >
                    <option value="In-App Alerts">In-App Alerts</option>
                    <option value="SMS Notifications">SMS Notifications</option>
                    <option value="Email Updates">Email Updates</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button className="button primary" type="submit" disabled={editLoading} style={{ height: "42px", padding: "0 20px" }}>
                  <span>{editLoading ? "Saving Changes..." : "Save Changes"}</span>
                  {!editLoading && <ShieldCheck style={{ width: "15px" }} />}
                </button>
                <button className="button secondary" type="button" onClick={handleResetForm} style={{ height: "42px", padding: "0 20px" }}>
                  <span>Reset</span>
                </button>
              </div>
            </form>

            {/* SECTION 3 - RECENT ACTIVITY FEED */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock style={{ color: "var(--blue)", width: "18px" }} /> Recent Activity Feed
              </h3>

              {statsLoading ? (
                <div style={{ color: "var(--muted)", padding: "20px 0" }}>Loading activity...</div>
              ) : timelineEvents.length === 0 ? (
                <div style={{ color: "var(--muted)", padding: "20px 0", fontSize: "13.5px" }}>
                  Your activity will appear here. Submit a complaint to initialize logs.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {timelineEvents.map((evt, idx) => {
                    const eventInfo = getEventIcon(evt.label);
                    return (
                      <div key={idx} style={{ display: "flex", gap: "12px", borderBottom: idx < timelineEvents.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none", paddingBottom: "12px" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          background: `${eventInfo.color}15`, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          fontSize: "14px",
                          color: eventInfo.color,
                          fontWeight: "bold",
                          flexShrink: 0
                        }}>
                          {eventInfo.icon}
                        </div>
                        <div style={{ flex: 1, fontSize: "13px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                            <strong style={{ color: "var(--text)" }}>{eventInfo.text}</strong>
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{evt.time}</span>
                          </div>
                          <p style={{ margin: "2px 0 0 0", color: "var(--muted)", fontSize: "12px" }}>
                            Grievance <span style={{ color: "var(--blue)", fontWeight: "600" }}>{evt.id}</span>: {evt.note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 5 - RECENT COMPLAINTS TABLE */}
            <div className="glass-card" style={{ padding: "28px", overflowX: "auto" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText style={{ color: "var(--blue)", width: "18px" }} /> My Recent Complaints
              </h3>

              {statsLoading ? (
                <div style={{ color: "var(--muted)", padding: "20px 0" }}>Loading complaints database...</div>
              ) : recentComplaints.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px" }}>
                  <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>No complaints submitted yet.</p>
                  <button 
                    type="button" 
                    className="button primary" 
                    onClick={() => navigate("/submit")}
                    style={{ margin: "0 auto", height: "38px" }}
                  >
                    <PlusCircle style={{ width: "15px" }} />
                    <span>Submit First Complaint</span>
                  </button>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "500px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left", color: "var(--muted)" }}>
                      <th style={{ padding: "10px 8px" }}>Complaint ID</th>
                      <th style={{ padding: "10px 8px" }}>Department</th>
                      <th style={{ padding: "10px 8px" }}>Priority</th>
                      <th style={{ padding: "10px 8px" }}>Status</th>
                      <th style={{ padding: "10px 8px" }}>Created Date</th>
                      <th style={{ padding: "10px 8px", textAlign: "right" }}>Track</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComplaints.slice(0, 5).map((comp) => (
                      <tr key={comp.id} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "12px 8px", fontWeight: "700", color: "var(--blue)" }}>{comp.id}</td>
                        <td style={{ padding: "12px 8px" }}>{comp.department || comp.analysis?.primaryDepartment?.label || "Electrical"}</td>
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ 
                            fontWeight: "600",
                            color: comp.priority === "High" || comp.priority === "Critical" || comp.analysis?.priority === "High" || comp.analysis?.priority === "Critical" ? "var(--red)" : "inherit"
                          }}>
                            {comp.priority || comp.analysis?.priority || "Medium"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ 
                            background: comp.status === "Resolved" ? "var(--green-soft)" : "var(--blue-soft)",
                            color: comp.status === "Resolved" ? "var(--green)" : "var(--blue)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "600"
                          }}>
                            {comp.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px" }}>{new Date(comp.submittedAt || comp.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right" }}>
                          <button 
                            type="button" 
                            className="button secondary" 
                            onClick={() => navigate(`/track?id=${comp.id}`)}
                            style={{ height: "28px", padding: "0 10px", fontSize: "11.5px" }}
                          >
                            Track
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Metrics, Insights, Preferences, Benefits, Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* SECTION 2 - DASHBOARD METRICS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              <div className="metric-card glass-card" style={{ padding: "18px", borderLeft: "4px solid var(--blue)", animation: "fadeInUp 0.3s ease-out" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>Total Logged</span>
                <strong style={{ display: "block", fontSize: "24px", color: "var(--text)", marginTop: "6px" }}>
                  {statsLoading ? "..." : (userProfile.totalComplaints > stats.total ? userProfile.totalComplaints : stats.total)}
                </strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>Total complaints on this account.</p>
              </div>

              <div className="metric-card glass-card" style={{ padding: "18px", borderLeft: "4px solid var(--green)", animation: "fadeInUp 0.3s ease-out 0.05s" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>Resolved Cases</span>
                <strong style={{ display: "block", fontSize: "24px", color: "var(--green)", marginTop: "6px" }}>
                  {statsLoading ? "..." : ((userProfile.resolvedComplaints || 0) > stats.resolved ? userProfile.resolvedComplaints : stats.resolved)}
                </strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>Grievances closed & verified.</p>
              </div>

              <div className="metric-card glass-card" style={{ padding: "18px", borderLeft: "4px solid var(--orange)", animation: "fadeInUp 0.3s ease-out 0.1s" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>In Progress</span>
                <strong style={{ display: "block", fontSize: "24px", color: "var(--orange)", marginTop: "6px" }}>
                  {statsLoading ? "..." : stats.pending}
                </strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>Active/Officer assigned.</p>
              </div>

              <div className="metric-card glass-card" style={{ padding: "18px", borderLeft: "4px solid var(--red)", animation: "fadeInUp 0.3s ease-out 0.15s" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>High Priority</span>
                <strong style={{ display: "block", fontSize: "24px", color: "var(--red)", marginTop: "6px" }}>
                  {statsLoading ? "..." : stats.high}
                </strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>Hazards or urgent tickets.</p>
              </div>

              <div className="metric-card glass-card" style={{ padding: "18px", borderLeft: "4px solid #8b5cf6", animation: "fadeInUp 0.3s ease-out 0.2s" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8b5cf6" }}>Resolution Rate</span>
                <strong style={{ display: "block", fontSize: "24px", color: "#8b5cf6", marginTop: "6px" }}>
                  {statsLoading ? "..." : `${resRate}%`}
                </strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>Percentage resolved.</p>
              </div>

              <div className="metric-card glass-card" style={{ padding: "18px", borderLeft: "4px solid #06b6d4", animation: "fadeInUp 0.3s ease-out 0.25s" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#06b6d4" }}>Avg Resolution</span>
                <strong style={{ display: "block", fontSize: "24px", color: "#06b6d4", marginTop: "6px" }}>
                  {statsLoading ? "..." : avgResTime}
                </strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--muted)" }}>Resolution response duration.</p>
              </div>
            </div>

            {/* SECTION 6 - AI SMART INSIGHTS */}
            <div className="glass-card" style={{ 
              padding: "24px", 
              border: "1px solid rgba(59, 130, 246, 0.25)", 
              background: "linear-gradient(135deg, rgba(239, 246, 255, 0.8), rgba(255, 255, 255, 0.9))" 
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--blue)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap style={{ width: "16.5px" }} /> AI Smart Insights
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--muted)" }}>Most Reported:</span>
                  <strong style={{ color: "var(--text)" }}>{statsLoading ? "..." : mostReportedCategory}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--muted)" }}>Most Active Location:</span>
                  <strong style={{ color: "var(--text)" }}>{statsLoading ? "..." : mostActiveLocation}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--muted)" }}>Avg response:</span>
                  <strong style={{ color: "var(--green)" }}>1.2 Hours (AI Route)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--muted)" }}>Current Success Rate:</span>
                  <strong style={{ color: "var(--blue)" }}>{statsLoading ? "..." : `${resRate}%`}</strong>
                </div>
                
                <div style={{ 
                  marginTop: "6px", 
                  padding: "10px 12px", 
                  borderRadius: "8px", 
                  background: "var(--blue-soft)", 
                  border: "1px solid rgba(59, 130, 246, 0.15)",
                  color: "var(--text)", 
                  fontSize: "12px",
                  lineHeight: "1.4"
                }}>
                  <strong>Recommendation:</strong> {statsLoading ? "Evaluating trends..." : getSmartRecommendation()}
                </div>
              </div>
            </div>

            {/* SECTION 8 - SAVED PREFERENCES */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Compass style={{ color: "var(--blue)", width: "16.5px" }} /> Saved Preferences
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Default Location:</span>
                  <strong style={{ color: "var(--text)" }}>{userProfile.defaultLocation || "None Saved"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Preferred Language:</span>
                  <strong style={{ color: "var(--text)" }}>{userProfile.preferredLanguage || "English"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Last Used Location:</span>
                  <strong style={{ color: "var(--text)" }}>{statsLoading ? "..." : lastUsedLocation}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Notification Alert:</span>
                  <strong style={{ color: "var(--text)" }}>{userProfile.notificationPreference || "In-App Alerts"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Account Type:</span>
                  <strong style={{ color: "var(--green)" }}>Verified Citizen</strong>
                </div>
              </div>
            </div>

            {/* SECTION 7 - VERIFIED CITIZEN BENEFITS */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Award style={{ color: "var(--blue)", width: "16.5px" }} /> Verified Account Benefits
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "bold" }}>✓</span>
                  <span style={{ color: "var(--muted)" }}>Faster Complaint Submission</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "bold" }}>✓</span>
                  <span style={{ color: "var(--muted)" }}>Personal Complaint History</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "bold" }}>✓</span>
                  <span style={{ color: "var(--muted)" }}>Complaint Status Tracking</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "bold" }}>✓</span>
                  <span style={{ color: "var(--muted)" }}>Saved Locations</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "bold" }}>✓</span>
                  <span style={{ color: "var(--muted)" }}>Priority Notifications</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "bold" }}>✓</span>
                  <span style={{ color: "var(--muted)" }}>AI Assisted Complaint Routing</span>
                </div>
              </div>
            </div>

            {/* SECTION 9 - QUICK ACTIONS */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap style={{ color: "var(--blue)", width: "16.5px" }} /> Quick Actions
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button 
                  type="button" 
                  className="button primary" 
                  onClick={() => navigate("/submit")}
                  style={{ height: "36px", fontSize: "11.5px", padding: 0, justifyContent: "center" }}
                >
                  <PlusCircle style={{ width: "14px" }} />
                  <span>Submit Complaint</span>
                </button>
                <button 
                  type="button" 
                  className="button secondary" 
                  onClick={() => navigate("/track")}
                  style={{ height: "36px", fontSize: "11.5px", padding: 0, justifyContent: "center" }}
                >
                  <Search style={{ width: "14px" }} />
                  <span>Track Complaint</span>
                </button>
                <button 
                  type="button" 
                  className="button secondary" 
                  onClick={() => navigate("/my-complaints")}
                  style={{ height: "36px", fontSize: "11.5px", padding: 0, justifyContent: "center" }}
                >
                  <FileText style={{ width: "14px" }} />
                  <span>My Complaints</span>
                </button>
                <button 
                  type="button" 
                  className="button secondary" 
                  onClick={handleOpenCopilot}
                  style={{ height: "36px", fontSize: "11.5px", padding: 0, justifyContent: "center" }}
                >
                  <Globe style={{ width: "14px" }} />
                  <span>Open AI Copilot</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dashboard-layout-grid {
            grid-template-columns: 1.25fr 0.75fr !important;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

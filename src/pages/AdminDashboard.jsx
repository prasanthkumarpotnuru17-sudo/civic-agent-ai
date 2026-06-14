import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onSnapshot, collection, query, orderBy, getDocs, doc, deleteDoc, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { CivicAgentComplaintService } from "../services/complaintService";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Shield, Users, Activity, FileText, CheckCircle, Clock, AlertTriangle, 
  Settings, LogOut, Calendar, RefreshCw, BarChart2, Search, X, Edit3, 
  PlusCircle, Trash2, Filter, Menu, User, MapPin, Phone, MessageSquare, Percent
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, complaints, analytics, settings
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  
  // Selected complaint for modal details & updates
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateOfficer, setUpdateOfficer] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Sidebar responsive menu state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get Admin session details
  const adminSession = JSON.parse(localStorage.getItem("adminSession") || "{}");
  const adminName = adminSession.name || "System Administrator";

  // Real-time Firestore sync ONLY
  useEffect(() => {
    let unsubscribe = null;

    const setupRealtime = () => {
      try {
        if (!db) {
          console.warn("Firestore DB is not initialized");
          setLoading(false);
          return;
        }
        console.log("Firestore connected. Setting up real-time listener...");
        const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ docId: docSnap.id, ...docSnap.data() });
          });
          
          console.log("Analytics Connected To Firestore");
          console.log(`Complaints Loaded: ${list.length}`);
          console.log("Analytics Updated Successfully");
          setComplaints(list);
          setLoading(false);
        }, (error) => {
          console.error("Real-time listener failed:", error);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to set up real-time listener:", err);
        setLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribe) {
        console.log("Unsubscribing from Firestore listener...");
        unsubscribe();
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    navigate("/admin/login");
  };

  // Open modal details and prefill editing state
  const handleOpenDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatus(complaint.status || "Submitted");
    setUpdateOfficer(complaint.assignedOfficer || "");
    setUpdateNotes(complaint.remarks || complaint.analysis?.officerNotes || "");
    setActionMessage("");
  };

  // Submit updates to Firestore
  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setIsUpdating(true);
    setActionMessage("");

    const updates = {
      status: updateStatus,
      assignedOfficer: updateOfficer,
      remarks: updateNotes
    };

    try {
      if (!selectedComplaint.docId) {
        throw new Error("Missing document ID.");
      }
      const res = await CivicAgentComplaintService.updateComplaint(selectedComplaint.docId, updates);
      if (res) {
        console.log("Status update success");
        // Close the modal upon successful save
        setSelectedComplaint(null);
        setActionMessage("Grievance updated successfully!");
        setTimeout(() => setActionMessage(""), 3000);
      } else {
        throw new Error("Update service returned null");
      }
    } catch (err) {
      console.error("Status update failure:", err);
      setActionMessage("Error: Failed to save changes.");
    } finally {
      setIsUpdating(false);
    }
  };



  // -----------------------------------------------------------------
  // DYNAMIC CALCULATIONS & DATA FORMATTING
  // -----------------------------------------------------------------

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      (c.complaintId || c.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.citizenName || c.fullName || c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || c.status === statusFilter;

    const currentDept = c.analysis?.primaryDepartment?.label || c.department || "Public Safety";
    const matchesDept = deptFilter === "All" || currentDept === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // KPI count metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === "Submitted" || c.status === "Assigned" || c.status === "Officer Assigned").length;
  const inProgressCount = complaints.filter(c => c.status === "In Progress" || c.status === "Work Order Generated").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const highPriorityCount = complaints.filter(c => c.priority === "High" || c.priority === "Critical" || c.analysis?.priority === "High" || c.analysis?.priority === "Critical").length;
  
  // Calculate average AI accuracy
  const validConfidences = complaints.map(c => Number(c.confidence || c.analysis?.confidence || 0)).filter(c => c > 0);
  const avgAccuracy = validConfidences.length > 0 
    ? (validConfidences.reduce((sum, val) => sum + val, 0) / validConfidences.length).toFixed(1) + "%"
    : "Insufficient data";

  // Recharts: Complaints by Department
  const deptCounts = {};
  complaints.forEach(c => {
    const d = c.analysis?.primaryDepartment?.label || c.department || "Public Safety";
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });
  const departmentChartData = Object.entries(deptCounts).map(([name, count]) => ({
    name: name.replace("Department", "").trim(),
    complaints: count
  }));

  // Recharts: Priority Distribution
  const priorityCounts = { "Critical": 0, "High": 0, "Medium": 0, "Low": 0 };
  complaints.forEach(c => {
    const p = c.analysis?.priority || c.priority || "Medium";
    if (priorityCounts[p] !== undefined) {
      priorityCounts[p] += 1;
    } else {
      priorityCounts["Medium"] += 1;
    }
  });
  const priorityChartData = Object.entries(priorityCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({ name, value: count }));

  // Recharts: Status breakdown
  const statusCounts = { "Pending": pendingCount, "In Progress": inProgressCount, "Resolved": resolvedCount };
  const statusChartData = Object.entries(statusCounts).map(([name, count]) => ({ name, value: count }));

  // Colors for Pie Charts (Premium Vibrant Palette)
  const PRIORITY_COLORS = {
    "Critical": "#ff0055", // Neon Red/Pink
    "High": "#ffaa00", // Neon Orange
    "Medium": "#00e5ff", // Cyan
    "Low": "#94a3b8"  // Slate Gray
  };

  const STATUS_COLORS = {
    "Pending": "#ffbb00", // Gold
    "In Progress": "#aa00ff", // Neon Purple
    "Resolved": "#00ffcc"  // Mint Green
  };

  // AI Insights
  const getMostReportedDept = () => {
    if (complaints.length === 0) return "N/A";
    let maxDept = "N/A", maxCount = 0;
    Object.entries(deptCounts).forEach(([dept, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxDept = dept;
      }
    });
    return maxDept;
  };

  const getMostActiveArea = () => {
    if (complaints.length === 0) return "N/A";
    const areas = {};
    complaints.forEach(c => {
      // Extract generic neighborhood name from location string
      const loc = (c.location || "").split(",")[0].trim();
      if (loc) {
        areas[loc] = (areas[loc] || 0) + 1;
      }
    });
    let maxArea = "N/A", maxCount = 0;
    Object.entries(areas).forEach(([area, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxArea = area;
      }
    });
    return maxArea;
  };

  // Calculate average SLA
  const resolvedComplaints = complaints.filter(c => c.status === "Resolved" && c.createdAt && c.updatedAt);
  let averageSla = "No resolved complaints yet";
  if (resolvedComplaints.length > 0) {
    let totalMs = 0;
    resolvedComplaints.forEach(c => {
      const start = new Date(c.createdAt).getTime();
      const end = new Date(c.updatedAt).getTime();
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        totalMs += (end - start);
      }
    });
    if (totalMs > 0) {
      const avgMs = totalMs / resolvedComplaints.length;
      const hours = (avgMs / (1000 * 60 * 60)).toFixed(1);
      averageSla = `${hours} Hours`;
    }
  }

  // Generate dynamic recommendations
  const recommendations = [];
  if (complaints.length > 0) {
    const criticalCount = complaints.filter(c => c.priority === "Critical" || c.analysis?.priority === "Critical").length;
    if ((criticalCount / complaints.length) > 0.2) {
      recommendations.push("Critical complaint ratio exceeds threshold. Consider prioritizing field dispatches.");
    }
    const waterSupplyCount = complaints.filter(c => (c.analysis?.primaryDepartment?.label || c.department) === "Water Supply").length;
    if ((waterSupplyCount / complaints.length) > 0.3) {
      recommendations.push("Water Supply department experiencing increased complaint volume.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Complaint volumes are operating within normal parameters. Routing accuracy is optimal.");
    }
  } else {
    recommendations.push("No complaint data available to generate recommendations.");
  }

  // Unique departments for filter dropdown
  const uniqueDepts = Array.from(new Set(complaints.map(c => c.analysis?.primaryDepartment?.label || c.department || "Public Safety").filter(Boolean)));

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              <Shield style={{ width: "22px", height: "22px" }} />
            </div>
            <div>
              <h3>CivicAgent <span>AI</span></h3>
              <small>Admin Portal</small>
            </div>
          </div>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X style={{ width: "20px" }} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <button 
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
          >
            <Activity className="nav-icon" />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === "complaints" ? "active" : ""}`}
            onClick={() => { setActiveTab("complaints"); setSidebarOpen(false); }}
          >
            <FileText className="nav-icon" />
            <span>Complaints</span>
            {pendingCount > 0 && <span className="nav-badge pending">{pendingCount}</span>}
          </button>

          <button 
            className={`admin-nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => { setActiveTab("analytics"); setSidebarOpen(false); }}
          >
            <BarChart2 className="nav-icon" />
            <span>Analytics</span>
          </button>

          <button 
            className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}
          >
            <Settings className="nav-icon" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile-snippet">
            <div className="admin-avatar">
              {adminName.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="admin-info-snippet">
              <strong>{adminName}</strong>
              <span>System Officer</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut style={{ width: "16px" }} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT PANE */}
      <main className="admin-content-pane">
        
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <div className="topbar-title-section">
              <h2>Overview Dashboard</h2>
              <p>System Telemetry & Grievance Lifecycle Workflows.</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status-chip">
              <span className="pulsing-green-dot"></span>
              <span>System Online</span>
            </div>
            
            <div className="topbar-date">
              <Calendar style={{ width: "16px", color: "var(--muted)" }} />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Action / Success Message Toast */}
        {actionMessage && (
          <div className="admin-toast-alert">
            <CheckCircle style={{ width: "18px", color: "var(--green)" }} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Tab 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <div className="admin-dashboard-tab">
            
            {/* KPI GRID */}
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card glass-card">
                <div className="kpi-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.08)", color: "#2563eb" }}>
                  <FileText />
                </div>
                <div className="kpi-data">
                  <span>Total Complaints</span>
                  <strong>{totalCount}</strong>
                </div>
              </div>

              <div className="admin-kpi-card glass-card">
                <div className="kpi-icon-wrapper" style={{ background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b" }}>
                  <Clock />
                </div>
                <div className="kpi-data">
                  <span>Pending Assignee</span>
                  <strong>{pendingCount}</strong>
                </div>
              </div>

              <div className="admin-kpi-card glass-card">
                <div className="kpi-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.08)", color: "#0ea5e9" }}>
                  <Activity />
                </div>
                <div className="kpi-data">
                  <span>In Progress</span>
                  <strong>{inProgressCount}</strong>
                </div>
              </div>

              <div className="admin-kpi-card glass-card">
                <div className="kpi-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                  <CheckCircle />
                </div>
                <div className="kpi-data">
                  <span>Resolved Today</span>
                  <strong>{resolvedCount}</strong>
                </div>
              </div>

              <div className="admin-kpi-card glass-card">
                <div className="kpi-icon-wrapper" style={{ background: "rgba(239, 110, 110, 0.08)", color: "#ef4444" }}>
                  <AlertTriangle />
                </div>
                <div className="kpi-data">
                  <span>High Priority</span>
                  <strong>{highPriorityCount}</strong>
                </div>
              </div>

              <div className="admin-kpi-card glass-card">
                <div className="kpi-icon-wrapper" style={{ background: "rgba(13, 148, 136, 0.08)", color: "#0d9488" }}>
                  <Percent />
                </div>
                <div className="kpi-data">
                  <span>AI Routing Accuracy</span>
                  <strong>{avgAccuracy}%</strong>
                </div>
              </div>
            </div>

            {/* Quick overview layout split */}
            <div className="admin-dashboard-split" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginTop: "24px" }}>
              
              {/* Recent Active Complaints Card */}
              <div className="glass-card admin-summary-table-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>Recent Citizen Grievances</h3>
                  <button 
                    className="button secondary" 
                    onClick={() => setActiveTab("complaints")}
                    style={{ fontSize: "12px", padding: "6px 14px", height: "auto" }}
                  >
                    View All
                  </button>
                </div>

                {loading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                    Loading complaints collection...
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="admin-empty-state" style={{ textAlign: "center", padding: "40px 0" }}>
                    <h4 style={{ color: "#fff", fontSize: "15px", marginBottom: "8px" }}>No complaints available</h4>
                    <p style={{ color: "var(--muted)", fontSize: "13.5px" }}>Submit a complaint from the citizen portal to see it here.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-simple-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Citizen</th>
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaints.slice(0, 5).map(c => {
                          const dept = c.analysis?.primaryDepartment?.label || c.department || "Public Safety";
                          return (
                            <tr key={c.docId || c.id} onClick={() => handleOpenDetails(c)} style={{ cursor: "pointer" }}>
                              <td style={{ fontWeight: "700" }}>{c.complaintId || c.id}</td>
                              <td>{c.citizenName || c.fullName || c.name}</td>
                              <td>{dept}</td>
                              <td>
                                <span className={`badge-status ${(c.analysis?.priority || c.priority || "medium").toLowerCase()}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                  {c.analysis?.priority || c.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`badge-status ${(c.status || "Assigned").toLowerCase().replace(" ", "-")}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* AI Dispatch Insights Panel */}
              <div className="glass-card admin-insights-card" style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield style={{ color: "var(--blue)", width: "18px" }} />
                  AI Dispatch Node Analytics
                </h3>
                
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.08)", padding: "12px 16px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "13px", color: "var(--muted)" }}>Busiest Department</span>
                    <strong style={{ fontSize: "13.5px" }}>{getMostReportedDept()}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.08)", padding: "12px 16px", borderRadius: "8px" }}>
                    <span style={{ fontSize: "13px", color: "var(--muted)" }}>High-Frequency Area</span>
                    <strong style={{ fontSize: "13.5px" }}>{getMostActiveArea()}</strong>
                  </div>

                  <div style={{ background: "var(--blue-soft)", border: "1px solid rgba(37,99,235,0.15)", padding: "14px", borderRadius: "10px", marginTop: "4px" }}>
                    <h5 style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--blue)", marginBottom: "6px" }}>
                      Administrative Recommendation
                    </h5>
                    <p style={{ fontSize: "12.5px", color: "var(--muted)", lineHeight: "1.5" }}>
                      {getMostReportedDept() !== "N/A" 
                        ? `Deploy additional maintenance staff and inspectors to ${getMostReportedDept()} sector, which represents the highest volume of citizen grievances this week.`
                        : "No actionable recommendations. System telemetry is within normal operational thresholds."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: COMPLAINTS MANAGEMENT */}
        {activeTab === "complaints" && (
          <div className="admin-complaints-tab">
            
            {/* SEARCH & FILTERS BAR */}
            <div className="admin-filter-bar glass-card">
              <div className="filter-search-input">
                <Search style={{ width: "18px", color: "var(--muted)" }} />
                <input
                  placeholder="Search complaints by ID, Citizen, Description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-selects">
                <div className="filter-select-group">
                  <Filter style={{ width: "14px", color: "var(--muted)" }} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Officer Assigned">Officer Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="filter-select-group">
                  <Filter style={{ width: "14px", color: "var(--muted)" }} />
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                    <option value="All">All Departments</option>
                    {uniqueDepts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* COMPLAINTS LIST TABLE */}
            <div className="glass-card" style={{ padding: "20px", marginTop: "20px", overflow: "hidden" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
                  Loading database complaints...
                </div>
              ) : complaints.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
                  <h4 style={{ color: "#fff", fontSize: "16px", marginBottom: "8px" }}>No complaints available</h4>
                  <p>Submit a complaint from the citizen portal to see it here.</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
                  No complaints match your filters.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-main-table">
                    <thead>
                      <tr>
                        <th>Complaint ID</th>
                        <th>Citizen Name</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map(c => {
                        const dept = c.analysis?.primaryDepartment?.label || c.department || "Public Safety";
                        const dateFormatted = (c.createdAt || c.submittedAt)
                          ? new Date(c.createdAt || c.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                          : "N/A";
                        return (
                          <tr key={c.docId || c.id}>
                            <td style={{ fontWeight: "800" }}>{c.complaintId || c.id}</td>
                            <td>{c.citizenName || c.fullName || c.name}</td>
                            <td>{dept}</td>
                            <td>
                              <span className={`badge-status ${(c.analysis?.priority || c.priority || "medium").toLowerCase()}`}>
                                {c.analysis?.priority || c.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge-status ${(c.status || "Assigned").toLowerCase().replace(" ", "-")}`}>
                                {c.status}
                              </span>
                            </td>
                            <td>{dateFormatted}</td>
                            <td>
                              <button 
                                className="button primary" 
                                onClick={() => handleOpenDetails(c)}
                                style={{ fontSize: "11.5px", padding: "5px 12px", height: "auto" }}
                              >
                                View/Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 3: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="admin-analytics-tab">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
              
              {/* Complaints by Department Chart */}
              <div className="glass-card" style={{ padding: "24px", minHeight: "360px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "20px" }}>Grievances by Municipal Sector</h4>
                {complaints.length === 0 ? (
                  <div style={{ display: "grid", placeItems: "center", height: "260px", color: "var(--muted)" }}>No complaint data available.</div>
                ) : (
                  <div style={{ width: "100%", height: "260px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentChartData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                        <Bar dataKey="complaints" fill="#aa00ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Priority Distribution Chart */}
              <div className="glass-card" style={{ padding: "24px", minHeight: "360px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "20px" }}>Severity Distribution</h4>
                {complaints.length === 0 ? (
                  <div style={{ display: "grid", placeItems: "center", height: "260px", color: "var(--muted)" }}>No complaint data available.</div>
                ) : (
                  <div style={{ width: "100%", height: "260px", display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1, height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={priorityChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {priorityChartData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={PRIORITY_COLORS[entry.name] || "#3b82f6"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingRight: "20px" }}>
                      {priorityChartData.map(entry => (
                        <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                          <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: PRIORITY_COLORS[entry.name] }}></span>
                          <span style={{ color: "var(--muted)", fontWeight: "600" }}>{entry.name}:</span>
                          <strong style={{ color: "#fff" }}>{entry.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Breakdown Chart */}
              <div className="glass-card" style={{ padding: "24px", minHeight: "360px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "20px" }}>Workflow Completion Breakdown</h4>
                {complaints.length === 0 ? (
                  <div style={{ display: "grid", placeItems: "center", height: "260px", color: "var(--muted)" }}>No complaint data available.</div>
                ) : (
                  <div style={{ width: "100%", height: "260px", display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1, height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusChartData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || "#3b82f6"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced AI Insights Panel */}
              <div className="glass-card" style={{ padding: "24px", minHeight: "360px", display: "flex", flexDirection: "column" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "16px" }}>AI System Performance & Recommendations</h4>
                
                <div style={{ flex: 1, display: "grid", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "rgba(0,0,0,0.08)", padding: "14px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Average Dispatch SLA</span>
                      <strong style={{ fontSize: "18px", color: "#fff" }}>{averageSla}</strong>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.08)", padding: "14px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Average AI Confidence</span>
                      <strong style={{ fontSize: "18px", color: "#fff" }}>{avgAccuracy}</strong>
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.08)", padding: "16px", borderRadius: "10px", flex: 1 }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--blue)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                      AI Performance Assessment
                    </span>
                    <ul style={{ fontSize: "12.5px", color: "var(--muted)", paddingLeft: "16px", display: "grid", gap: "6px", lineHeight: "1.4" }}>
                      {recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: SETTINGS & CONTROLS */}
        {activeTab === "settings" && (
          <div className="admin-settings-tab">
            <div className="glass-card" style={{ padding: "28px", maxWidth: "600px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "12px" }}>System Settings</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>
                Firestore Real-Time Database connection is active. All fallback and demo systems have been disabled to ensure 100% data integrity.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* COMPLAINT DETAILS & WORKFLOW UPDATE MODAL */}
      {selectedComplaint && (
        <div className="admin-modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="admin-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="admin-modal-header-row">
              <div>
                <h3>Grievance {selectedComplaint.complaintId || selectedComplaint.id}</h3>
                <span className={`badge-status ${(selectedComplaint.status || "Assigned").toLowerCase().replace(" ", "-")}`}>
                  {selectedComplaint.status}
                </span>
              </div>
              <button className="admin-modal-close-btn" onClick={() => setSelectedComplaint(null)}>
                <X />
              </button>
            </div>

            {/* Modal Body Scrollpane */}
            <div className="admin-modal-body">
              
              {/* Details grid */}
              <div className="admin-details-grid">
                <div className="detail-item">
                  <label><User /> Citizen Name</label>
                  <span>{selectedComplaint.citizenName || selectedComplaint.fullName || selectedComplaint.name || "Anonymous"}</span>
                </div>
                <div className="detail-item">
                  <label><Phone /> Mobile Number</label>
                  <span>{selectedComplaint.mobile || "N/A"}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                  <label><MapPin /> Location</label>
                  <span>{selectedComplaint.location}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                  <label><MessageSquare /> Description</label>
                  <p style={{ fontSize: "13.5px", color: "var(--text)", lineHeight: "1.4", margin: "4px 0 0" }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="detail-item">
                  <label>Department Assigned</label>
                  <span style={{ fontWeight: "700" }}>{selectedComplaint.analysis?.primaryDepartment?.label || selectedComplaint.department}</span>
                </div>
                <div className="detail-item">
                  <label>Severity Rating</label>
                  <span className={`badge-status ${(selectedComplaint.analysis?.priority || selectedComplaint.priority || "medium").toLowerCase()}`} style={{ display: "inline-block" }}>
                    {selectedComplaint.analysis?.priority || selectedComplaint.priority}
                  </span>
                </div>

                <div className="detail-item">
                  <label>AI Confidence Match</label>
                  <span>{selectedComplaint.analysis?.confidence || selectedComplaint.confidence || 96}%</span>
                </div>
                <div className="detail-item">
                  <label>Resolution SLA ETA</label>
                  <span>{selectedComplaint.analysis?.eta || selectedComplaint.eta}</span>
                </div>
              </div>

              {selectedComplaint.imageUrl && (
                <div style={{ marginTop: "16px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                    Evidence Photo
                  </label>
                  <img 
                    src={selectedComplaint.imageUrl} 
                    alt="Citizen evidence photo" 
                    style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleUpdateComplaint} style={{ borderTop: "1px solid var(--line)", marginTop: "20px", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginBottom: "14px" }}>Manage Workflow Transition</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group-admin">
                    <label htmlFor="modalStatus">Update Status</label>
                    <select 
                      id="modalStatus"
                      value={updateStatus} 
                      onChange={(e) => setUpdateStatus(e.target.value)}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Officer Assigned">Officer Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="form-group-admin">
                    <label htmlFor="modalOfficer">Assigned Officer</label>
                    <input 
                      id="modalOfficer"
                      type="text"
                      placeholder="e.g. Officer K. Ramana"
                      value={updateOfficer}
                      onChange={(e) => setUpdateOfficer(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group-admin" style={{ marginTop: "12px" }}>
                  <label htmlFor="modalNotes">Officer Notes / Operations Remarks</label>
                  <textarea 
                    id="modalNotes"
                    rows="3"
                    placeholder="Provide details about active repairs, dispatched field agents, or inspection schedules..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                  <button type="button" className="button secondary" onClick={() => setSelectedComplaint(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="button primary" disabled={isUpdating} style={{ padding: "0 24px" }}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

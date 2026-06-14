import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { CivicAgentComplaintService } from "../services/complaintService";

export default function Department() {
  const [selectedDept, setSelectedDept] = useState("Electrical");
  const [deptComplaints, setDeptComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [deptPriorityFilter, setDeptPriorityFilter] = useState("All");
  const [deptStatusFilter, setDeptStatusFilter] = useState("All");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [updateStatusVal, setUpdateStatusVal] = useState("");

  const refreshData = async () => {
    const data = await CivicAgentComplaintService.readComplaints();
    
    const deptData = data.filter(c => {
      const matchedDept = c.analysis?.primaryDepartment?.name === selectedDept;
      const matchesPriority = deptPriorityFilter === "All" || c.analysis?.priority === deptPriorityFilter;
      const matchesStatus = deptStatusFilter === "All" || c.status === deptStatusFilter;
      return matchedDept && matchesPriority && matchesStatus;
    });
    
    setDeptComplaints(deptData);

    // Keep the selected complaint updated if it exists
    if (selectedComplaint) {
      const updatedSelect = data.find(c => c.id === selectedComplaint.id);
      if (updatedSelect) setSelectedComplaint(updatedSelect);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedDept, deptPriorityFilter, deptStatusFilter]);

  const handleOfficerUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const updates = {
      officerNotes: officerRemarks || selectedComplaint.analysis?.officerNotes,
      status: updateStatusVal || selectedComplaint.status
    };

    const statusMap = {
      "Submitted": 0,
      "AI Analysis Completed": 1,
      "Department Assigned": 2,
      "Officer Assigned": 3,
      "Work Order Generated": 4,
      "In Progress": 5,
      "Resolved": 6
    };
    if (statusMap[updates.status] !== undefined) {
      updates.timelineStatus = statusMap[updates.status];
    }

    updates.historyItem = {
      label: updates.status,
      note: officerRemarks || `Status updated by ${selectedComplaint.assignedOfficer}`,
      time: new Date().toLocaleString()
    };

    const res = await CivicAgentComplaintService.updateComplaint(selectedComplaint.id, updates);
    setSelectedComplaint(res);
    setOfficerRemarks("");
    refreshData();
  };

  return (
    <div className="container section dashboard-mode">
      <div className="dashboard-nav">
        <div>
          <span className="section-kicker">Department Officer Portal</span>
          <h2>Grievance Dispatch Queue</h2>
        </div>
        <label style={{ marginBottom: 0 }}>
          <span>Viewing Department Portal</span>
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setSelectedComplaint(null);
            }}
            style={{ marginTop: "4px" }}
          >
            <option value="Electrical">Electrical Department</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Roads & Infrastructure">Roads & Infrastructure</option>
            <option value="Drainage">Drainage</option>
            <option value="Public Safety">Public Safety</option>
          </select>
        </label>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "14px", marginBottom: 0 }}>
          <span>Filter Priority</span>
          <select value={deptPriorityFilter} onChange={(e) => setDeptPriorityFilter(e.target.value)}>
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "14px", marginBottom: 0 }}>
          <span>Filter Status</span>
          <select value={deptStatusFilter} onChange={(e) => setDeptStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Officer Assigned">Officer Assigned</option>
            <option value="Work Order Generated">Work Order Generated</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </label>
        <button className="button secondary" style={{ minHeight: "40px" }} onClick={refreshData}>
          <RefreshCw style={{ width: "16px", height: "16px", marginRight: "4px" }} />
          Refresh
        </button>
      </div>

      <div className="dashboard-layout">
        {/* Complaints Table */}
        <div className="dashboard-sidebar">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Submitted Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deptComplaints.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    No complaints matching the criteria found.
                  </td>
                </tr>
              ) : (
                deptComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className={selectedComplaint?.id === c.id ? "selected" : ""}
                    onClick={() => {
                      setSelectedComplaint(c);
                      setUpdateStatusVal(c.status);
                    }}
                  >
                    <td><strong>{c.id}</strong></td>
                    <td>{c.category}</td>
                    <td>
                      <span className={`badge-status ${c.analysis?.priority?.toLowerCase()}`}>
                        {c.analysis?.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: "13.5px" }}>{new Date(c.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge-status ${c.status === "Resolved" ? "resolved" : c.status === "In Progress" ? "in-progress" : "assigned"}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail & Update Panel */}
        <aside className="dashboard-main">
          {!selectedComplaint ? (
            <div className="analysis-empty" style={{ marginTop: 0 }}>
              Select a complaint from the queue to view details, update status, and add remarks.
            </div>
          ) : (
            <div>
              <h3 style={{ margin: "0 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{selectedComplaint.id}</span>
                <span className={`badge-status ${selectedComplaint.status === "Resolved" ? "resolved" : selectedComplaint.status === "In Progress" ? "in-progress" : "assigned"}`}>
                  {selectedComplaint.status}
                </span>
              </h3>

              <div style={{ display: "grid", gap: "10px", marginBottom: "20px" }}>
                <div className="detail-row"><span>Citizen</span><strong>{selectedComplaint.fullName}</strong></div>
                <div className="detail-row"><span>Mobile</span><strong>{selectedComplaint.mobile}</strong></div>
                <div className="detail-row"><span>Location</span><strong>{selectedComplaint.location}</strong></div>
                <div className="detail-row"><span>Category</span><strong>{selectedComplaint.category}</strong></div>
                <div className="detail-row"><span>Priority</span><strong>{selectedComplaint.analysis.priority}</strong></div>
                <div className="detail-row"><span>Assigned Officer</span><strong>{selectedComplaint.assignedOfficer}</strong></div>
                <div className="detail-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                  <span>Description</span>
                  <p style={{ margin: "4px 0", fontSize: "14.5px", lineHeight: "1.5", color: "var(--muted)", fontWeight: "500" }}>
                    {selectedComplaint.description}
                  </p>
                </div>

                {selectedComplaint.imageUrl && (
                  <div className="detail-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                    <span>Evidence Photo</span>
                    <img src={selectedComplaint.imageUrl} alt="evidence" style={{ width: "100%", borderRadius: "10px", maxHeight: "150px", objectFit: "cover" }} />
                  </div>
                )}
              </div>

              <div className="analysis-summary" style={{ background: "#f8fbff", marginBottom: "20px" }}>
                <span className="summary-label">AI Summary & Routing</span>
                <p style={{ margin: "4px 0", fontSize: "13.5px" }}><strong>Summary:</strong> {selectedComplaint.analysis.summary}</p>
                <p style={{ margin: "4px 0", fontSize: "13.5px" }}><strong>AI Confidence:</strong> {selectedComplaint.analysis.confidence}%</p>
                <p style={{ margin: "4px 0", fontSize: "13.5px" }}><strong>ETA:</strong> {selectedComplaint.analysis.eta}</p>
              </div>

              {/* Action form */}
              <form onSubmit={handleOfficerUpdate} style={{ borderTop: "1px solid var(--line)", paddingTop: "18px" }}>
                <label>
                  <span>Update Status</span>
                  <select value={updateStatusVal} onChange={(e) => setUpdateStatusVal(e.target.value)}>
                    <option value="Department Assigned">Department Assigned</option>
                    <option value="Officer Assigned">Officer Assigned</option>
                    <option value="Work Order Generated">Work Order Generated</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </label>

                <label>
                  <span>Officer Remarks / Notes</span>
                  <textarea
                    rows={3}
                    placeholder="Type remarks or actions taken..."
                    value={officerRemarks}
                    onChange={(e) => setOfficerRemarks(e.target.value)}
                  />
                </label>

                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button className="button primary" style={{ flex: 1 }} type="submit">
                    Update Case
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    style={{ borderColor: "var(--green)", color: "var(--green)" }}
                    onClick={() => {
                      setUpdateStatusVal("Resolved");
                      setOfficerRemarks("Resolved: Issue verified and resolved on-site.");
                      // Wait briefly for state updates then submit form
                      setTimeout(() => {
                        const submitButton = document.querySelector("form button[type='submit']");
                        if (submitButton) submitButton.click();
                      }, 50);
                    }}
                  >
                    Resolve Case
                  </button>
                </div>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

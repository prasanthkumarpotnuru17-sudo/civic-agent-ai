import React, { useState, useEffect } from "react";
import { RefreshCw, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";
import { CivicAgentComplaintService } from "../services/complaintService";

export default function Commissioner() {
  const [allComplaints, setAllComplaints] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, pending: 0, resolved: 0 });

  const refreshAnalytics = async () => {
    const data = await CivicAgentComplaintService.readComplaints();
    setAllComplaints(data);
    
    const total = data.length;
    const resolved = data.filter(c => c.status === "Resolved").length;
    const pending = total - resolved;
    setKpis({ total, pending, resolved });
  };

  useEffect(() => {
    refreshAnalytics();
  }, []);

  const getDeptPerformanceData = () => {
    const departmentsList = [
      { name: "Electrical", label: "Electrical" },
      { name: "Water Supply", label: "Water Supply" },
      { name: "Sanitation", label: "Sanitation" },
      { name: "Roads & Infrastructure", label: "Roads" },
      { name: "Drainage", label: "Drainage" },
      { name: "Public Safety", label: "Safety" }
    ];

    return departmentsList.map(dept => {
      const deptCases = allComplaints.filter(c => c.analysis?.primaryDepartment?.name === dept.name);
      const total = deptCases.length;
      const resolved = deptCases.filter(c => c.status === "Resolved").length;
      const pending = total - resolved;
      return {
        name: dept.label,
        Total: total,
        Resolved: resolved,
        Pending: pending
      };
    });
  };

  const getPieChartData = () => {
    const totalCount = allComplaints.length || 1;
    const autoRoutedCount = allComplaints.filter(c => !c.manuallyReRouted).length;
    const manualRoutedCount = allComplaints.length - autoRoutedCount;

    return [
      { name: "Auto-Routed Accuracy", value: parseFloat(((autoRoutedCount / totalCount) * 100).toFixed(1)), color: "#08aa70" },
      { name: "Manual Override", value: parseFloat(((manualRoutedCount / totalCount) * 100).toFixed(1)), color: "#f38f12" }
    ];
  };

  const getLineChartData = () => {
    return [
      { month: "Jan", "Avg SLA (Hours)": 48 },
      { month: "Feb", "Avg SLA (Hours)": 42 },
      { month: "Mar", "Avg SLA (Hours)": 36 },
      { month: "Apr", "Avg SLA (Hours)": 28 },
      { month: "May", "Avg SLA (Hours)": 24 },
      { month: "Jun", "Avg SLA (Hours)": 18 }
    ];
  };

  return (
    <div className="container section dashboard-mode">
      <div className="dashboard-nav">
        <div>
          <span className="section-kicker">Municipal Commissioner Portal</span>
          <h2>Smart City Governance Analytics</h2>
        </div>
        <button className="button secondary" onClick={refreshAnalytics}>
          <RefreshCw style={{ width: "16px", height: "16px", marginRight: "4px" }} />
          Refresh Analytics
        </button>
      </div>

      {/* KPIs */}
      <div className="commissioner-grid">
        <div className="metric-card glass-card" style={{ padding: "24px" }}>
          <span>Total Grievances</span>
          <strong style={{ fontSize: "36px", marginTop: "6px" }}>{kpis.total}</strong>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>Log complaints in current period</p>
        </div>
        <div className="metric-card glass-card" style={{ padding: "24px", borderColor: "var(--orange)" }}>
          <span>Active / Pending Cases</span>
          <strong style={{ fontSize: "36px", marginTop: "6px", color: "var(--orange)" }}>{kpis.pending}</strong>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>Currently in dispatch or progress</p>
        </div>
        <div className="metric-card glass-card" style={{ padding: "24px", borderColor: "var(--green)" }}>
          <span>Resolved Complaints</span>
          <strong style={{ fontSize: "36px", marginTop: "6px", color: "var(--green)" }}>{kpis.resolved}</strong>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>Closed with verified resolution</p>
        </div>
      </div>

      {/* Charts using Recharts */}
      <div className="chart-grid">
        <div className="chart-card">
          <h4>Complaint Distribution by Department</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDeptPerformanceData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Resolved" fill="#08aa70" stackId="a" />
                <Bar dataKey="Pending" fill="#f38f12" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h4>AI Auto-Routing Accuracy</h4>
          <div className="chart-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getPieChartData().map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--green)" }}>96%</div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--muted)" }}>Accuracy</div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h4>Average Resolution Time Trend</h4>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getLineChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Avg SLA (Hours)" stroke="#0869d6" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h4>SLA Resolution & Performance</h4>
          <div className="dept-perf-list">
            {getDeptPerformanceData().map((d) => {
              const pct = d.Total > 0 ? Math.round((d.Resolved / d.Total) * 100) : 100;
              return (
                <div key={d.name} className="dept-perf-item">
                  <div style={{ display: "grid" }}>
                    <strong>{d.name} Department</strong>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      Resolved: {d.Resolved} / {d.Total} complaints
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "100px", height: "8px", background: "var(--line)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct > 75 ? "var(--green)" : pct > 40 ? "var(--orange)" : "var(--red)" }}></div>
                    </div>
                    <strong style={{ fontSize: "14px", color: pct > 75 ? "var(--green)" : "var(--text)" }}>{pct}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Officer Productivity Lists */}
      <div className="chart-card" style={{ marginTop: "24px" }}>
        <h4 style={{ marginBottom: "16px" }}>Operational Staff Productivity</h4>
        <table className="complaints-table" style={{ border: 0 }}>
          <thead>
            <tr>
              <th>Officer Name</th>
              <th>Department Portfolios</th>
              <th>Assigned Tickets</th>
              <th>Resolved Tickets</th>
              <th>Avg SLA Rate</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "Officer R. Srinivas", dept: "Electrical Department", pending: 1, resolved: 3, sla: "98%" },
              { name: "Officer K. Ramana", dept: "Water Supply Division", pending: 2, resolved: 4, sla: "95%" },
              { name: "Officer M. Suresh", dept: "Sanitation Department", pending: 1, resolved: 5, sla: "92%" },
              { name: "Officer G. Venkat", dept: "Roads & Infrastructure", pending: 2, resolved: 2, sla: "89%" },
              { name: "Officer P. Raju", dept: "Drainage Portfolios", pending: 0, resolved: 3, sla: "96%" }
            ].map((off) => (
              <tr key={off.name}>
                <td><strong>{off.name}</strong></td>
                <td>{off.dept}</td>
                <td>{off.pending} active</td>
                <td>{off.resolved} closed</td>
                <td><span style={{ color: "var(--green)", fontWeight: "700" }}>{off.sla}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

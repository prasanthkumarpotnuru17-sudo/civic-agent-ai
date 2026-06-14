import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function AdminProtectedRoute({ children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--muted)", fontWeight: "600" }}>
          Verifying administrator credentials...
        </div>
      </div>
    );
  }

  // Auto-login bypass for hackathon demonstration: seed session if not present
  let localSession = localStorage.getItem("adminSession");
  const isFirebaseAdmin = userProfile && userProfile.role === "admin";

  if (!localSession && !isFirebaseAdmin) {
    const autoSession = {
      email: "admin@civicagent.ai",
      name: "System Administrator",
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem("adminSession", JSON.stringify(autoSession));
  }

  return children;
}

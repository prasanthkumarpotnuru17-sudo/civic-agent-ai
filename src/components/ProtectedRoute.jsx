import React from "react";
import useAuth from "../hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading, openAuth } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--muted)", fontWeight: "600" }}>
          Loading active session...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="lock-screen-wrapper">
        <div className="lock-screen-card glass-card">
          <div className="feature-icon-wrapper" style={{ margin: "0 auto 16px", background: "var(--red-soft)", color: "var(--red)" }}>
            <ShieldAlert style={{ width: "24px", height: "24px" }} />
          </div>
          <h3>Authentication Required</h3>
          <p>You need to log in to access this municipal portal. Guest citizens can still submit and track complaints freely on the public site.</p>
          <button className="button primary" onClick={openAuth} style={{ width: "100%", height: "46px" }}>
            Log In / Create Account
          </button>
        </div>
      </div>
    );
  }

  return children;
}

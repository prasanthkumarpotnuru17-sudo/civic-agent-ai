import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Key, Mail, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout, user } = useAuth();

  const [email, setEmail] = useState("admin@civicagent.ai");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Automatically log out any citizen user if they open admin login to prevent session confusion
  useEffect(() => {
    if (user) {
      logout().catch((err) => console.error("Error clearing user session:", err));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all credentials.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check for Hackathon offline bypass credentials
      if (email.toLowerCase().trim() === "admin@civicagent.ai" && password === "admin123") {
        localStorage.setItem("adminSession", JSON.stringify({
          email: "admin@civicagent.ai",
          name: "System Administrator",
          loggedInAt: new Date().toISOString()
        }));
        navigate("/admin/dashboard");
        return;
      }

      // 2. Fall back to standard Firebase login
      const result = await login(email.trim(), password);
      
      if (result && result.profile && result.profile.role === "admin") {
        localStorage.setItem("adminSession", JSON.stringify({
          email: result.profile.email,
          name: result.profile.name || "Administrator",
          loggedInAt: new Date().toISOString()
        }));
        navigate("/admin/dashboard");
      } else {
        // Log out because the logged in account is not an administrator
        await logout();
        setError("Access Denied: You do not have administrator permissions.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      // Give a friendly error message
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email address or password.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="grid-overlay"></div>
      <div className="ambient-glow" style={{ top: "15%", left: "10%", width: "500px", height: "500px" }}></div>
      <div className="ambient-glow" style={{ bottom: "15%", right: "10%", width: "500px", height: "500px" }}></div>

      <div className="admin-login-card glass-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">
            <Shield style={{ width: "28px", height: "28px" }} />
          </div>
          <h2>Admin Portal</h2>
          <p>Authorize to access CivicAgent AI governance workspace.</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <AlertCircle style={{ width: "18px", height: "18px", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group-admin">
            <label htmlFor="email">Administrative Email</label>
            <div className="input-with-icon-admin">
              <Mail className="input-icon-admin" />
              <input
                id="email"
                type="email"
                placeholder="admin@civicagent.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group-admin" style={{ marginTop: "20px" }}>
            <label htmlFor="password">Security Password</label>
            <div className="input-with-icon-admin">
              <Key className="input-icon-admin" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="button primary admin-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="spinner-admin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight style={{ width: "16px", height: "16px" }} />
              </>
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <span>Demo Access: <strong>admin@civicagent.ai</strong> / <strong>admin123</strong></span>
        </div>
      </div>
    </div>
  );
}

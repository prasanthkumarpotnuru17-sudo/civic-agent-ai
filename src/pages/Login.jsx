import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Mail, Lock, Shield } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Determine where to redirect after successful login
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Google Sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section section-band" style={{ minHeight: "85vh", display: "grid", placeItems: "center" }}>
      <div className="container" style={{ maxWidth: "480px", width: "100%" }}>
        <div className="form-card glass-card" style={{ padding: "36px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span className="brand-mark" style={{ margin: "0 auto 16px" }}>
              <svg viewBox="0 0 24 24" style={{ width: "22px", height: "22px", color: "#fff" }}>
                <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.7 7.9 6.5 8.9 3.8-1 6.5-4.8 6.5-8.9V6.2L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <h2 style={{ fontSize: "28px", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Welcome Back</h2>
            <p style={{ margin: 0, fontSize: "14.5px", color: "var(--muted)" }}>Log in to access your dashboard and submit complaints</p>
          </div>

          {error && (
            <div style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid #fecaca", padding: "12px 14px", borderRadius: "14px", fontSize: "13.5px", fontWeight: "600", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
            <label style={{ margin: 0 }}>
              <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Mail style={{ width: "14px" }} /> Email Address</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginTop: "6px" }}
              />
            </label>

            <label style={{ margin: 0 }}>
              <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Lock style={{ width: "14px" }} /> Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ marginTop: "6px" }}
              />
            </label>

            <button className="button primary" type="submit" disabled={loading} style={{ minHeight: "48px", marginTop: "8px" }}>
              <span>{loading ? "Authenticating..." : "Log In"}</span>
              {!loading && <ArrowRight />}
            </button>
          </form>

          <div style={{ margin: "22px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--muted)", fontSize: "13px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
            <span>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
          </div>

          <button className="button secondary" onClick={handleGoogleSignIn} disabled={loading} style={{ width: "100%", minHeight: "48px", gap: "10px" }}>
            <svg viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: "center", marginTop: "24px", marginBottom: 0, fontSize: "14px", color: "var(--muted)" }}>
            Don't have an account? <Link to="/register" style={{ color: "var(--blue)", fontWeight: "700" }}>Register here</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

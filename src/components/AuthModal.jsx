import React, { useState } from "react";
import { X, Mail, Lock, User, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";

export default function AuthModal() {
  const { authModalOpen, closeAuth, login, register, loginWithGoogle } = useAuth();
  
  const [tab, setTab] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration specific
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (tab === "register") {
      if (!name.trim()) newErrors.name = "Full name is required.";
      if (!mobile.trim()) {
        newErrors.mobile = "Mobile number is required.";
      } else if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
        newErrors.mobile = "Enter a valid 10-digit mobile number.";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (tab !== "forgot") {
      if (!password) {
        newErrors.password = "Password is required.";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMsg("");

    if (!validate()) return;

    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else if (tab === "register") {
        await register(email, password, { name, mobile });
      } else if (tab === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Password reset email sent! Please check your inbox.");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setGlobalError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGlobalError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setGlobalError(err.message || "Google Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      closeAuth();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container glass-card">
        <button className="modal-close-btn" onClick={closeAuth} aria-label="Close modal">
          <X style={{ width: "20px", height: "20px" }} />
        </button>

        <div className="modal-header">
          <span className="brand-mark" style={{ margin: "0 auto 12px", width: "40px", height: "40px" }}>
            <ShieldCheck style={{ width: "20px", height: "20px", color: "#fff" }} />
          </span>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
            {tab === "login" ? "Welcome Back" : tab === "register" ? "Create Account" : "Reset Password"}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            {tab === "login" 
              ? "Access your dashboard to track and submit complaints." 
              : tab === "register" 
                ? "Join the autonomous smart city governance network." 
                : "Enter your email to receive a password reset link."}
          </p>
        </div>

        {tab !== "forgot" && (
          <div className="modal-tabs">
            <button 
              className={`modal-tab-btn ${tab === "login" ? "active" : ""}`}
              onClick={() => { setTab("login"); setGlobalError(""); setErrors({}); }}
            >
              Sign In
            </button>
            <button 
              className={`modal-tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => { setTab("register"); setGlobalError(""); setErrors({}); }}
            >
              Register
            </button>
          </div>
        )}

        <div className="modal-body">
          {globalError && (
            <div style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "10px 12px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "600", marginBottom: "16px" }}>
              {globalError}
            </div>
          )}

          {successMsg && (
            <div style={{ background: "var(--green-soft)", color: "var(--green)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "10px 12px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "600", marginBottom: "16px" }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }} noValidate>
            {tab === "register" && (
              <>
                <label>
                  <span><User style={{ width: "13px" }} /> Full Name</span>
                  <input
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <small className="field-error">{errors.name}</small>}
                </label>

                <label>
                  <span><Phone style={{ width: "13px" }} /> Mobile Number</span>
                  <input
                    placeholder="10-digit number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                  {errors.mobile && <small className="field-error">{errors.mobile}</small>}
                </label>
              </>
            )}

            <label>
              <span><Mail style={{ width: "13px" }} /> Email Address</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>

            {tab !== "forgot" && (
              <label>
                <span><Lock style={{ width: "13px" }} /> Password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password && <small className="field-error">{errors.password}</small>}
              </label>
            )}

            {tab === "register" && (
              <label>
                <span><Lock style={{ width: "13px" }} /> Confirm Password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
              </label>
            )}

            {tab === "login" && (
              <div style={{ textAlign: "right", marginTop: "-4px" }}>
                <button 
                  type="button" 
                  onClick={() => { setTab("forgot"); setGlobalError(""); setErrors({}); }}
                  style={{ background: "none", border: "none", color: "var(--blue)", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button className="button primary" type="submit" disabled={loading} style={{ height: "44px", marginTop: "6px", width: "100%" }}>
              <span>
                {loading 
                  ? "Processing..." 
                  : tab === "login" 
                    ? "Log In" 
                    : tab === "register" 
                      ? "Create Account" 
                      : "Send Reset Link"}
              </span>
              {!loading && <ArrowRight style={{ width: "16px" }} />}
            </button>
          </form>

          {tab === "forgot" && (
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button 
                type="button" 
                onClick={() => { setTab("login"); setGlobalError(""); setErrors({}); }}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
              >
                ← Back to Login
              </button>
            </div>
          )}

          {tab !== "forgot" && (
            <>
              <div style={{ margin: "18px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--muted)", fontSize: "11px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
                <span>OR</span>
                <div style={{ flex: 1, height: "1px", background: "var(--line)" }}></div>
              </div>

              <button className="button secondary" onClick={handleGoogleSignIn} disabled={loading} style={{ width: "100%", height: "44px", gap: "10px" }}>
                <svg viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, User, Phone, Mail, Lock } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      newErrors.mobile = "Enter a valid 10-digit mobile number.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setGlobalError("");
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      await register(email, password, { name, mobile });
      navigate("/");
    } catch (err) {
      console.error(err);
      setGlobalError(err.message || "Failed to create account. Email may be already in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section section-band" style={{ minHeight: "90vh", display: "grid", placeItems: "center" }}>
      <div className="container" style={{ maxWidth: "540px", width: "100%" }}>
        <div className="form-card glass-card" style={{ padding: "36px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span className="brand-mark" style={{ margin: "0 auto 16px" }}>
              <svg viewBox="0 0 24 24" style={{ width: "22px", height: "22px", color: "#fff" }}>
                <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.7 7.9 6.5 8.9 3.8-1 6.5-4.8 6.5-8.9V6.2L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <h2 style={{ fontSize: "28px", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Create Account</h2>
            <p style={{ margin: 0, fontSize: "14.5px", color: "var(--muted)" }}>Join the autonomous smart city grievance system</p>
          </div>

          {globalError && (
            <div style={{ background: "var(--red-soft)", color: "var(--red)", border: "1px solid #fecaca", padding: "12px 14px", borderRadius: "14px", fontSize: "13.5px", fontWeight: "600", marginBottom: "20px" }}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "grid", gap: "16px" }}>
            <div className="form-row two">
              <label style={{ margin: 0 }}>
                <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><User style={{ width: "14px" }} /> Full Name</span>
                <input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ marginTop: "6px" }}
                />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>

              <label style={{ margin: 0 }}>
                <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Phone style={{ width: "14px" }} /> Mobile Number</span>
                <input
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={{ marginTop: "6px" }}
                />
                {errors.mobile && <small className="field-error">{errors.mobile}</small>}
              </label>
            </div>

            <label style={{ margin: 0 }}>
              <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Mail style={{ width: "14px" }} /> Email Address</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginTop: "6px" }}
              />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>

            <div className="form-row two">
              <label style={{ margin: 0 }}>
                <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Lock style={{ width: "14px" }} /> Password</span>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ marginTop: "6px" }}
                />
                {errors.password && <small className="field-error">{errors.password}</small>}
              </label>

              <label style={{ margin: 0 }}>
                <span style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}><Lock style={{ width: "14px" }} /> Confirm Password</span>
                <input
                  type="password"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ marginTop: "6px" }}
                />
                {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
              </label>
            </div>

            <button className="button primary" type="submit" disabled={loading} style={{ minHeight: "48px", marginTop: "12px" }}>
              <span>{loading ? "Creating Account..." : "Register"}</span>
              {!loading && <ArrowRight />}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", marginBottom: 0, fontSize: "14px", color: "var(--muted)" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--blue)", fontWeight: "700" }}>Log in here</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

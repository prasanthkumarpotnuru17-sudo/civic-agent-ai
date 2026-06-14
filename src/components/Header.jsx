import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, FileText, LogOut, Shield } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function Header({ onOpenSettings }) {
  const [navOpen, setNavOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const { user, userProfile, logout, openAuth } = useAuth();
  
  const dropdownRef = useRef(null);

  const isPrivate = path.startsWith("/department") || path.startsWith("/commissioner");
  const isHome = path === "/";

  // Escape key and click outside closing logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setNavOpen(false);
      setDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getInitials = () => {
    const name = userProfile?.name || user?.displayName || "";
    if (!name) return user?.email?.substring(0, 2).toUpperCase() || "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getFirstName = () => {
    const name = userProfile?.name || user?.displayName || "";
    if (!name) return "Citizen";
    return name.trim().split(/\s+/)[0];
  };

  return (
    <header className={`site-header ${isHome ? "home-navbar-blue" : ""}`}>
      <nav className="nav-shell" aria-label="Primary navigation">
        <div className="nav-left">
          <Link className="brand" to="/" aria-label="CivicAgent AI home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" style={{ width: "20px", height: "20px" }}>
                <path d="M12 3.5 5.5 6.2v5.4c0 4.1 2.7 7.9 6.5 8.9 3.8-1 6.5-4.8 6.5-8.9V6.2L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span>
              <strong>CivicAgent <em>AI</em></strong>
              <small>Smart City Governance</small>
            </span>
          </Link>

          {!isPrivate ? (
            <div className={`nav-links ${navOpen ? "open" : ""}`} id="navLinks">
              <NavLink className={({ isActive }) => isActive && path === "/" ? "active" : ""} to="/" onClick={() => setNavOpen(false)}>
                Home
              </NavLink>
              <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/track" onClick={() => setNavOpen(false)}>
                Track Complaint
              </NavLink>

              {user && (
                <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/my-complaints" onClick={() => setNavOpen(false)}>
                  My Complaints
                </NavLink>
              )}

              {/* Mobile-only User Actions (hidden on desktop via css) */}
              <div className="mobile-only-actions">
                {user ? (
                  <>
                    <div className="mobile-welcome">Logged in as {userProfile?.name || user.displayName || "Citizen"}</div>
                    <NavLink to="/profile" onClick={() => setNavOpen(false)}>My Profile</NavLink>
                    <NavLink to="/my-complaints" onClick={() => setNavOpen(false)}>My Complaints</NavLink>
                    <button onClick={handleLogout} className="mobile-logout-btn">Logout</button>
                  </>
                ) : (
                  <button onClick={() => { setNavOpen(false); openAuth(); }} className="mobile-login-btn">Login</button>
                )}
              </div>
            </div>
          ) : (
            <div className={`nav-links ${navOpen ? "open" : ""}`} id="navLinks">
              <Link to="/" onClick={() => setNavOpen(false)}>← Back to Public Site</Link>
              <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/department" onClick={() => setNavOpen(false)}>
                Department Portal
              </NavLink>
              <NavLink className={({ isActive }) => isActive ? "active" : ""} to="/commissioner" onClick={() => setNavOpen(false)}>
                Commissioner Portal
              </NavLink>
            </div>
          )}
        </div>

        {/* Right Nav Actions (Desktop + Responsive Drops) */}
        <div className="header-right-actions">
          {user ? (
            <div className="navbar-user-section" ref={dropdownRef}>
              <button 
                className="navbar-avatar-trigger" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                type="button"
              >
                <div className="navbar-avatar-circle">
                  {getInitials()}
                </div>
                <span className="navbar-avatar-name">{getFirstName()}</span>
                <ChevronDown style={{ width: "14px", height: "14px", color: "var(--muted)", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "none" }} />
              </button>

              {dropdownOpen && (
                <div className="navbar-dropdown-card glass-card">
                  <div className="navbar-dropdown-header">
                    <strong>{userProfile?.name || user.displayName || "Citizen"}</strong>
                    <span className="navbar-dropdown-role">Verified Citizen ✓</span>
                    <small>{userProfile?.email || user.email}</small>
                  </div>
                  <div className="navbar-dropdown-menu">
                    <button 
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      className="navbar-dropdown-item"
                    >
                      <User style={{ width: "14px", height: "14px" }} />
                      <span>Profile</span>
                    </button>
                    <button 
                      onClick={() => { setDropdownOpen(false); navigate("/my-complaints"); }}
                      className="navbar-dropdown-item"
                    >
                      <FileText style={{ width: "14px", height: "14px" }} />
                      <span>My Complaints</span>
                    </button>
                    <div style={{ height: "1px", background: "var(--line)", margin: "4px 0" }} />
                    <button 
                      onClick={() => { setDropdownOpen(false); navigate("/admin/dashboard"); }}
                      className="navbar-dropdown-item"
                      style={{ color: "var(--blue)" }}
                    >
                      <Shield style={{ width: "14px", height: "14px" }} />
                      <span>Admin Dashboard</span>
                    </button>
                    <div style={{ height: "1px", background: "var(--line)", margin: "4px 0" }} />
                    <button 
                      onClick={handleLogout}
                      className="navbar-dropdown-item logout"
                    >
                      <LogOut style={{ width: "14px", height: "14px" }} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => { setNavOpen(false); openAuth(); }} className="desktop-login-btn">
              Login
            </button>
          )}
          <Link className="nav-cta" to="/submit" onClick={() => setNavOpen(false)}>Submit Complaint</Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
          onClick={() => setNavOpen(!navOpen)}
        >
          {navOpen ? <X /> : <Menu />}
        </button>
      </nav>
    </header>
  );
}

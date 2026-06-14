import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./components/AuthModal";
import AIAssistant from "./components/AIAssistant";

import Home from "./pages/Home";
import Submit from "./pages/Submit";
import Track from "./pages/Track";
import MyComplaints from "./pages/MyComplaints";
import Profile from "./pages/Profile";
import Department from "./pages/Department";
import Commissioner from "./pages/Commissioner";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CivicAgentComplaintService } from "./services/complaintService";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState(null);

  const handleSubmissionSuccess = (complaint) => {
    setLatestSubmission(complaint);
  };

  const handleDemoFlow = async () => {
    const demo = await CivicAgentComplaintService.seedDemoComplaint();
    setLatestSubmission(demo);
    // Redirect to submit page to show the result card
    navigate("/submit");
  };

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      {!isAdminRoute && <Header onOpenSettings={() => setSettingsOpen(true)} />}
      
      <main>
        <Routes>
          <Route path="/" element={<Home onRunDemo={handleDemoFlow} />} />
          <Route path="/submit" element={<Submit latestSubmission={latestSubmission} onSubmissionSuccess={handleSubmissionSuccess} />} />
          <Route path="/track" element={<Track />} />
          
          <Route path="/my-complaints" element={
            <ProtectedRoute>
              <MyComplaints />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/department" element={<Department />} />
          <Route path="/commissioner" element={<Commissioner />} />

          {/* Admin Portal Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />
        </Routes>
      </main>

      {!isAdminRoute && <Footer onOpenSettings={() => setSettingsOpen(true)} />}

      {/* Global Overlays */}
      {!isAdminRoute && <AuthModal />}
      {!isAdminRoute && <AIAssistant />}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </AuthProvider>
  );
}

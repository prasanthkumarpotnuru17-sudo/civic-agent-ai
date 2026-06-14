import React, { useState, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import SettingsModal from "./components/SettingsModal";
import AuthModal from "./components/AuthModal";
import AIAssistant from "./components/AIAssistant";

import Home from "./pages/Home";
import Department from "./pages/Department";
import Commissioner from "./pages/Commissioner";

const Submit = lazy(() => import("./pages/Submit"));
const Track = lazy(() => import("./pages/Track"));
const MyComplaints = lazy(() => import("./pages/MyComplaints"));
const Profile = lazy(() => import("./pages/Profile"));

import ProtectedRoute from "./components/ProtectedRoute";
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

  return (
    <AuthProvider>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      
      <main>
        <Suspense fallback={
          <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
            <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--muted)", fontWeight: "600" }}>
              Loading Module...
            </div>
          </div>
        }>
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
          </Routes>
        </Suspense>
      </main>

      <Footer onOpenSettings={() => setSettingsOpen(true)} />

      {/* Global Overlays */}
      <AuthModal />
      <AIAssistant />

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </AuthProvider>
  );
}

import React, { useState } from "react";
import { X } from "lucide-react";

export default function SettingsModal({ onClose }) {
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("gemini_api_key") || "");
  const [fbApiKey, setFbApiKey] = useState(localStorage.getItem("firebase_apiKey") || "");
  const [fbProjectId, setFbProjectId] = useState(localStorage.getItem("firebase_projectId") || "");
  const [fbAuthDomain, setFbAuthDomain] = useState(localStorage.getItem("firebase_authDomain") || "");
  const [fbStorageBucket, setFbStorageBucket] = useState(localStorage.getItem("firebase_storageBucket") || "");
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(localStorage.getItem("firebase_messagingSenderId") || "");
  const [fbAppId, setFbAppId] = useState(localStorage.getItem("firebase_appId") || "");

  const handleSettingsSave = (e) => {
    e.preventDefault();
    localStorage.setItem("gemini_api_key", geminiKey);
    localStorage.setItem("firebase_apiKey", fbApiKey);
    localStorage.setItem("firebase_projectId", fbProjectId);
    localStorage.setItem("firebase_authDomain", fbAuthDomain);
    localStorage.setItem("firebase_storageBucket", fbStorageBucket);
    localStorage.setItem("firebase_messagingSenderId", fbMessagingSenderId);
    localStorage.setItem("firebase_appId", fbAppId);
    onClose();
    window.location.reload();
  };

  const handleSettingsClear = () => {
    localStorage.removeItem("gemini_api_key");
    localStorage.removeItem("firebase_apiKey");
    localStorage.removeItem("firebase_projectId");
    localStorage.removeItem("firebase_authDomain");
    localStorage.removeItem("firebase_storageBucket");
    localStorage.removeItem("firebase_messagingSenderId");
    localStorage.removeItem("firebase_appId");
    onClose();
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close settings"><X /></button>
        <h3 style={{ margin: "0 0 10px", fontSize: "22px" }}>System Configuration</h3>
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "var(--muted)" }}>
          Configure your Gemini AI and Firebase credentials. In the absence of credentials, 
          the app runs in **Offline Hackathon Mode** using LocalStorage and keyword heuristics.
        </p>

        <form onSubmit={handleSettingsSave} style={{ display: "grid", gap: "16px" }}>
          <label>
            <span>Gemini API Key</span>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
            />
          </label>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
            <strong style={{ display: "block", marginBottom: "12px", fontSize: "15px" }}>Firebase Config Credentials</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                <span>API Key</span>
                <input type="password" placeholder="AIzaSy..." value={fbApiKey} onChange={(e) => setFbApiKey(e.target.value)} />
              </label>
              <label>
                <span>Project ID</span>
                <input placeholder="civicagent-ai-..." value={fbProjectId} onChange={(e) => setFbProjectId(e.target.value)} />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
              <label>
                <span>Auth Domain</span>
                <input placeholder="civicagent.firebaseapp.com" value={fbAuthDomain} onChange={(e) => setFbAuthDomain(e.target.value)} />
              </label>
              <label>
                <span>Storage Bucket</span>
                <input placeholder="civicagent.appspot.com" value={fbStorageBucket} onChange={(e) => setFbStorageBucket(e.target.value)} />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
              <label>
                <span>Messaging Sender ID</span>
                <input placeholder="1234567890" value={fbMessagingSenderId} onChange={(e) => setFbMessagingSenderId(e.target.value)} />
              </label>
              <label>
                <span>App ID</span>
                <input placeholder="1:1234:web:abcd" value={fbAppId} onChange={(e) => setFbAppId(e.target.value)} />
              </label>
            </div>
          </div>

          <div style={{ background: "#f8fbff", padding: "12px", borderRadius: "10px", fontSize: "13px", border: "1px solid var(--line)" }}>
            <div><strong>Gemini AI Router:</strong> {geminiKey ? <span style={{ color: "var(--green)" }}>Live Mode Enabled</span> : <span style={{ color: "var(--orange)" }}>Local Fallback Heuristics Mode</span>}</div>
            <div style={{ marginTop: "4px" }}><strong>Firebase Database:</strong> {fbApiKey && fbProjectId ? <span style={{ color: "var(--green)" }}>Firestore Live Sync</span> : <span style={{ color: "var(--orange)" }}>Offline LocalStorage Mode</span>}</div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="button primary" style={{ flex: 1 }} type="submit">
              Save & Connect
            </button>
            <button className="button secondary" type="button" onClick={handleSettingsClear} style={{ color: "var(--red)", borderColor: "var(--red)" }}>
              Clear Config
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

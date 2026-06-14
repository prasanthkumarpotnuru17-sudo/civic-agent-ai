import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localStorage.getItem("firebase_apiKey") || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localStorage.getItem("firebase_authDomain") || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localStorage.getItem("firebase_projectId") || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localStorage.getItem("firebase_storageBucket") || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localStorage.getItem("firebase_messagingSenderId") || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localStorage.getItem("firebase_appId") || ""
};

let app = null;
let db = null;
let auth = null;
let storage = null;

const isConfigured = () => {
  return Boolean(config.apiKey && config.projectId);
};

if (isConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log("Firebase app initialized:", app.name);
    console.log("Firestore connection status: Configured");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { app, db, auth, storage };

export const CivicAgentFirebase = {
  config,
  isConfigured,
  db,
  auth,
  storage
};

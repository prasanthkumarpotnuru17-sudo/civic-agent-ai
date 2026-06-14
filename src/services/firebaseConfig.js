import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const config = {
  apiKey: localStorage.getItem("firebase_apiKey") || "",
  authDomain: localStorage.getItem("firebase_authDomain") || "",
  projectId: localStorage.getItem("firebase_projectId") || "",
  storageBucket: localStorage.getItem("firebase_storageBucket") || "",
  messagingSenderId: localStorage.getItem("firebase_messagingSenderId") || "",
  appId: localStorage.getItem("firebase_appId") || ""
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
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export const CivicAgentFirebase = {
  config,
  isConfigured,
  db,
  auth,
  storage
};

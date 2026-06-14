import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, getUserProfile, loginWithEmail as fbLogin, registerWithEmail as fbRegister, loginWithGoogle as fbGoogle, logOutUser as fbLogout } from "../services/firebase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuth = () => setAuthModalOpen(true);
  const closeAuth = () => setAuthModalOpen(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          let profile = await getUserProfile(currentUser.uid);
          if (!profile) {
            const local = localStorage.getItem(`userProfile_${currentUser.uid}`);
            if (local) profile = JSON.parse(local);
          }
          setUser(currentUser);
          setUserProfile(profile || {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || "",
            mobile: "",
            defaultLocation: "",
            preferredLanguage: "English",
            role: "citizen",
            totalComplaints: 0,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to load user profile, using local storage fallback:", error);
          const local = localStorage.getItem(`userProfile_${currentUser.uid}`);
          setUser(currentUser);
          setUserProfile(local ? JSON.parse(local) : {
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || "",
            mobile: "",
            defaultLocation: "",
            preferredLanguage: "English",
            role: "citizen",
            totalComplaints: 0,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await fbLogin(email, password);
      setUser(result.user);
      setUserProfile(result.profile);
      setAuthModalOpen(false); // Auto close modal on login success
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (email, password, additionalData) => {
    setLoading(true);
    try {
      const result = await fbRegister(email, password, additionalData);
      setUser(result.user);
      setUserProfile(result.profile);
      setAuthModalOpen(false); // Auto close modal on register success
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await fbGoogle();
      setUser(result.user);
      setUserProfile(result.profile);
      setAuthModalOpen(false); // Auto close modal on Google login success
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fbLogout();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileState = (updatedFields) => {
    setUserProfile((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfileState,
    authModalOpen,
    setAuthModalOpen,
    openAuth,
    closeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

export default function AdminApp() {
  return (
    <AuthProvider>
      <main>
        <Suspense fallback={
          <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
            <div style={{ animation: "flowPulse 1.2s infinite", color: "var(--muted)", fontWeight: "600" }}>
              Loading Admin Portal...
            </div>
          </div>
        }>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>
    </AuthProvider>
  );
}

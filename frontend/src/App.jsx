import React, { useState } from "react";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/DashboardLayout";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [authMode, setAuthMode] = useState("signup");

  const [user, setUser] = useState({
    name: "",
    email: "",
  });

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setUser({
      name: "",
      email: "",
    });

    setCurrentPage("landing");
  };

  return (
    <>
      {currentPage === "landing" && (
        <LandingPage
          onLogin={() => {
            setAuthMode("login");
            setCurrentPage("auth");
          }}
          onGetStarted={() => {
            setAuthMode("signup");
            setCurrentPage("auth");
          }}
        />
      )}

      {currentPage === "auth" && (
        <Auth
          initialMode={authMode}
          onAuthSuccess={handleLogin}
          onNavigateHome={() => setCurrentPage("landing")}
        />
      )}

      {currentPage === "dashboard" && (
        <DashboardLayout
          user={user}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}


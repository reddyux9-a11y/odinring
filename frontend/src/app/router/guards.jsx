import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";

const Loader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export const ProtectedRoute = ({ children, requiredAuth = "user" }) => {
  const { user, admin, loading, authChecked } = useAuth();

  logger.debug("ProtectedRoute: Checking access", {
    requiredAuth,
    user: user ? user.email : null,
    admin: admin ? admin.email : null,
    loading,
    authChecked,
    currentPath: window.location.pathname,
  });

  if (!authChecked || loading) return <Loader />;
  if (requiredAuth === "user" && !user) return <Navigate to="/auth" replace />;
  if (requiredAuth === "admin" && !admin) return <Navigate to="/admin/login" replace />;
  return children;
};

export const AuthRedirect = ({ children, authType = "user" }) => {
  const { user, admin, loading, authChecked } = useAuth();

  logger.debug("AuthRedirect: Checking auth status", {
    authType,
    user: user ? user.email : null,
    admin: admin ? admin.email : null,
    loading,
    authChecked,
    currentPath: window.location.pathname,
  });

  if (!authChecked || loading) return <Loader />;
  if (authType === "user" && user) return <Navigate to="/dashboard" replace />;
  if (authType === "admin" && admin) return <Navigate to="/admin/dashboard" replace />;
  return children;
};

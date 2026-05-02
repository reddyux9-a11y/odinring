import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "@/features/dashboard/pages/Dashboard";
import Profile from "@/features/profile/pages/Profile";
import Install from "@/features/profile/pages/Install";
import AuthPage from "@/features/auth/pages/AuthPage";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import AdminLogin from "@/features/auth/pages/AdminLogin";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import Onboarding from "@/features/dashboard/pages/Onboarding";
import SubscriptionIndex from "@/features/billing/pages/SubscriptionIndex";
import Checkout from "@/features/billing/pages/Checkout";
import PaymentSuccess from "@/features/billing/pages/PaymentSuccess";
import PaymentFailed from "@/features/billing/pages/PaymentFailed";
import SubscriptionManagement from "@/features/billing/pages/SubscriptionManagement";
import CustomerSupport from "@/features/dashboard/pages/CustomerSupport";
import GlobalApiLoader from "@/components/GlobalApiLoader";
import { AuthRedirect, ProtectedRoute } from "./guards";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <GlobalApiLoader />
      <Routes>
        <Route path="/" element={<Navigate to="/odinring-landing.html" replace />} />
        <Route path="/install" element={<Install />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/ring/:ringId" element={<Profile />} />

        <Route path="/auth" element={<AuthRedirect authType="user"><AuthPage /></AuthRedirect>} />
        <Route path="/forgot-password" element={<AuthRedirect authType="user"><ForgotPassword /></AuthRedirect>} />
        <Route path="/reset-password" element={<AuthRedirect authType="user"><ResetPassword /></AuthRedirect>} />
        <Route path="/admin/login" element={<AuthRedirect authType="admin"><AdminLogin /></AuthRedirect>} />

        <Route path="/onboarding" element={<ProtectedRoute requiredAuth="user"><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute requiredAuth="user"><Dashboard /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute requiredAuth="user"><SubscriptionIndex /></ProtectedRoute>} />
        <Route path="/billing/choose-plan" element={<Navigate to="/subscription" replace />} />
        <Route path="/checkout" element={<ProtectedRoute requiredAuth="user"><Checkout /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute requiredAuth="user"><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/payment/failed" element={<ProtectedRoute requiredAuth="user"><PaymentFailed /></ProtectedRoute>} />
        <Route path="/subscription/manage" element={<ProtectedRoute requiredAuth="user"><SubscriptionManagement /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute requiredAuth="user"><CustomerSupport /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute requiredAuth="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

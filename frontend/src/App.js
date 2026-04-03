import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Landing from "./pages/Landing";
import Install from "./pages/Install";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Onboarding from "./pages/Onboarding";
import BillingChoosePlan from "./pages/BillingChoosePlan";
import SubscriptionIndex from "./pages/SubscriptionIndex";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import CustomerSupport from "./pages/CustomerSupport";
import MobileLanding from "./components/MobileLanding";
import { Toaster } from "./components/ui/sonner";
import { initializeMobileEnvironment, isMobileDevice } from "./utils/mobileUtils";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import logger from "./lib/logger";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Protected Route Component (now uses AuthContext)
const ProtectedRoute = ({ children, requiredAuth = 'user' }) => {
  const { user, admin, loading, authChecked } = useAuth();


  logger.debug('ProtectedRoute: Checking access', {
    requiredAuth,
    user: user ? user.email : null,
    admin: admin ? admin.email : null,
    loading,
    authChecked,
    currentPath: window.location.pathname
  });

  if (!authChecked || loading) {
    logger.debug('ProtectedRoute: Still loading, showing spinner...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requiredAuth === 'user' && !user) {
    logger.debug('ProtectedRoute: No user found, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (requiredAuth === 'admin' && !admin) {
    logger.debug('ProtectedRoute: No admin found, redirecting to /admin/login');
    return <Navigate to="/admin/login" replace />;
  }

  logger.debug('ProtectedRoute: Access granted!');
  return children;
};

// Redirect authenticated users away from auth pages (now uses AuthContext)
const AuthRedirect = ({ children, authType = 'user' }) => {
  const { user, admin, loading, authChecked } = useAuth();


  logger.debug('AuthRedirect: Checking auth status', {
    authType,
    user: user ? user.email : null,
    admin: admin ? admin.email : null,
    loading,
    authChecked,
    currentPath: window.location.pathname
  });

  if (!authChecked || loading) {
    logger.debug('AuthRedirect: Still loading, showing spinner...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (authType === 'user' && user) {
    logger.debug('AuthRedirect: User authenticated, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  if (authType === 'admin' && admin) {
    logger.debug('AuthRedirect: Admin authenticated, redirecting to /admin/dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  logger.debug('AuthRedirect: Not authenticated, showing auth page');
  return children;
};

// Main App component
function AppContent() {
  const { loading, authChecked, user } = useAuth();


  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OdinRing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          {/* Mobile Landing - Shows on mobile devices at root */}
          <Route 
            path="/" 
            element={
              isMobileDevice() ? <MobileLanding /> : <Landing />
            } 
          />
          <Route path="/install" element={<Install />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/ring/:ringId" element={<Profile />} />

          {/* Auth Routes - Redirect if already authenticated */}
          <Route
            path="/auth"
            element={
              <AuthRedirect authType="user">
                <AuthPage />
              </AuthRedirect>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthRedirect authType="user">
                <ForgotPassword />
              </AuthRedirect>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthRedirect authType="user">
                <ResetPassword />
              </AuthRedirect>
            }
          />
          <Route
            path="/admin/login"
            element={
              <AuthRedirect authType="admin">
                <AdminLogin />
              </AuthRedirect>
            }
          />

          {/* Protected User Routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requiredAuth="user">
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredAuth="user">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute requiredAuth="user">
                <SubscriptionIndex />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/choose-plan"
            element={
              <ProtectedRoute requiredAuth="user">
                <BillingChoosePlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requiredAuth="user">
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute requiredAuth="user">
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/failed"
            element={
              <ProtectedRoute requiredAuth="user">
                <PaymentFailed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/manage"
            element={
              <ProtectedRoute requiredAuth="user">
                <SubscriptionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute requiredAuth="user">
                <CustomerSupport />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredAuth="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Mobile-optimized toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '90vw',
            margin: '0 auto'
          }
        }}
      />
    </div>
  );
}

function App() {
  // Initialize mobile environment
  useEffect(() => {
    initializeMobileEnvironment();
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
import { useEffect } from "react";
import "./App.css";
import { Toaster } from "@/shared/ui/sonner";
import { initializeMobileEnvironment } from "@/utils/mobileUtils";
import { useAuth } from "@/contexts/AuthContext";
import AppProviders from "@/app/providers/AppProviders";
import AppRouter from "@/app/router/AppRouter";

function AppContent() {
  const { loading, authChecked } = useAuth();

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
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            maxWidth: "90vw",
            margin: "0 auto",
          },
        }}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    initializeMobileEnvironment();
  }, []);

  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
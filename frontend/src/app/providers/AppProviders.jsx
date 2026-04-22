import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ApiLoadingProvider } from "@/contexts/ApiLoadingContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ApiLoadingProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ApiLoadingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default AppProviders;

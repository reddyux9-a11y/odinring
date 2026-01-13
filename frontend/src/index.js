import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";

// Initialize Sentry if DSN is provided
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration({
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
        tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
    environment: process.env.NODE_ENV || "development",
  });
  console.log("✅ Sentry initialized for frontend");
} else {
  console.log("⚠️ Sentry DSN not configured - error tracking disabled");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

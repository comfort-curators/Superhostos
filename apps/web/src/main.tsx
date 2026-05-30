import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { CookieConsent } from "./components/CookieConsent";
import { ToastProvider } from "./components/Toast";
import { AppRouter } from "./router";
import "./index.css";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;
const authEnabled = Boolean(clerkKey);

const app = (
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppRouter authEnabled={authEnabled} />
          <CookieConsent />
        </ToastProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

ReactDOM.createRoot(rootElement).render(
  authEnabled ? (
    <ClerkProvider
      publishableKey={clerkKey as string}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      {app}
    </ClerkProvider>
  ) : (
    app
  ),
);

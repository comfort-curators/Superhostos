import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './index.css';

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const authEnabled = Boolean(clerkKey);

const app = (
  <React.StrictMode>
    <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppRouter authEnabled={authEnabled} />
    </QueryClientProvider>
      </AppErrorBoundary>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  authEnabled ? (
    <ClerkProvider publishableKey={clerkKey as string} signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      {app}
    </ClerkProvider>
  ) : (
    app
  )
);

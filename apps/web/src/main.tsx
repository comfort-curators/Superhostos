import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from './router';
import './index.css';

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!clerkKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to apps/web/.env.local or deployment environment.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkKey} signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);

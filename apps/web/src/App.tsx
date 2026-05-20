import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { Route, Router } from 'wouter';
import Dashboard from './pages/Dashboard';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route path="/" component={Dashboard} />
        {/* Add other routes here */}
      </Router>
      <Toaster position="top-right" />
      <Analytics />
    </QueryClientProvider>
  );
}

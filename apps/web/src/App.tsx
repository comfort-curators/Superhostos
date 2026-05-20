import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route } from 'wouter';
import { Toaster } from 'sonner';
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
    </QueryClientProvider>
  );
}
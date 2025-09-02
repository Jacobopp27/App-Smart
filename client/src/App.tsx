import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Main Router component handling application navigation
 * Uses wouter for client-side routing with protected routes
 */
function Router() {
  return (
    <Switch>
      {/* Public route - Login page accessible to all users */}
      <Route path="/login" component={LoginPage} />
      
      {/* Protected route - Dashboard requires authentication */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback for unknown routes - redirect to dashboard */}
      <Route>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

/**
 * Main App component providing global context providers
 * Wraps the entire application with necessary providers for:
 * - React Query for server state management
 * - Authentication context for user state
 * - UI components (tooltips, toasts)
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

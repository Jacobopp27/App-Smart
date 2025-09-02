import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import SetupPage from "./pages/SetupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "@/pages/not-found";

/**
 * Main Router component handling application navigation
 * Uses wouter for client-side routing with protected routes
 */
function Router() {
  return (
    <Switch>
      {/* Setup route - Initial admin user creation */}
      <Route path="/setup" component={SetupPage} />
      
      {/* Public route - Login page accessible to all users */}
      <Route path="/login" component={LoginPage} />
      
      {/* Protected route - Dashboard requires authentication */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 page for unknown routes */}
      <Route component={NotFound} />
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

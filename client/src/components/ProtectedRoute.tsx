import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

/**
 * Protected Route component that requires authentication
 * Displays loading state while checking authentication
 * Redirects unauthenticated users (handled by AuthContext)
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to render if authenticated
 */
interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, render children
  // If not authenticated, AuthContext will handle redirect to login
  return user ? <>{children}</> : null;
}

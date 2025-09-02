import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

/**
 * User interface matching the backend User type
 */
interface User {
  id: string;
  email: string;
  role: string;
}

/**
 * Authentication context interface defining available methods and state
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

/**
 * React Context for authentication state management
 * This context provides user authentication state and methods throughout the app
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access authentication context
 * Throws error if used outside of AuthProvider to prevent runtime errors
 * @returns {AuthContextType} Authentication context with user state and methods
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Authentication Provider component managing user session state
 * Handles token and user data persistence in localStorage
 * Automatically redirects based on authentication state
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  /**
   * Initialize authentication state from localStorage on component mount
   * This enables persistent login sessions across browser refreshes
   * localStorage is used instead of sessionStorage for longer session persistence
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        // Parse saved user data from JSON
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        // Clear corrupted data if JSON parsing fails
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  /**
   * Automatic redirection logic based on authentication state
   * Redirects authenticated users away from login page
   * Redirects unauthenticated users to login page
   */
  useEffect(() => {
    if (!isLoading) {
      const currentPath = window.location.pathname;
      
      if (user && token) {
        // User is authenticated - redirect from login page to dashboard
        if (currentPath === '/login') {
          setLocation('/');
        }
      } else {
        // User is not authenticated - redirect to login page
        if (currentPath !== '/login') {
          setLocation('/login');
        }
      }
    }
  }, [user, token, isLoading, setLocation]);

  /**
   * Login function to set user authentication state
   * Stores token and user data in both state and localStorage
   * 
   * @param {string} token - JWT authentication token
   * @param {User} user - User object with id, email, and role
   */
  const login = (token: string, user: User) => {
    // Update state immediately for UI responsiveness
    setToken(token);
    setUser(user);
    
    // Persist authentication data in localStorage
    // This allows the session to survive browser refreshes
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    // Redirect to dashboard after successful login
    setLocation('/');
  };

  /**
   * Logout function to clear user authentication state
   * Removes all authentication data from state and localStorage
   * Redirects user to login page
   */
  const logout = () => {
    // Clear state immediately
    setToken(null);
    setUser(null);
    
    // Remove persisted authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    // Redirect to login page
    setLocation('/login');
  };

  /**
   * Context value object containing all authentication state and methods
   */
  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

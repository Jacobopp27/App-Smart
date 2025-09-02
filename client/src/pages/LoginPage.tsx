import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChartLine, Eye, EyeOff, AlertCircle } from "lucide-react";

/**
 * Login page component handling user authentication
 * Features form validation, loading states, and error handling
 * Implements the design from the HTML reference with proper React patterns
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const { toast } = useToast();

  /**
   * Handle form submission with validation and API call
   * Demonstrates proper form handling with loading states and error management
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Basic client-side validation
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address");
        return;
      }

      // Call authentication API endpoint
      // Use absolute URL to ensure it works from any domain
      const apiUrl = window.location.origin + '/api/auth/login';
      const requestBody = { email, password };
      
      console.log('Login attempt:', { apiUrl, email: email, passwordLength: password.length });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Login response:', { status: response.status, statusText: response.statusText });

      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        // Handle different HTTP error status codes
        if (response.status === 401) {
          setError("Invalid email or password");
        } else if (response.status === 400) {
          setError("Please check your input and try again");
        } else {
          setError("An error occurred. Please try again.");
        }
        return;
      }

      // Successful login - update authentication context
      login(data.token, data.user);
      
      // Show success notification
      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
      });

    } catch (error) {
      console.error('Login error:', error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-border">
        <CardContent className="p-8">
          {/* Company Logo and Branding */}
          <div className="text-center mb-8">
            <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ChartLine className="text-primary-foreground text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TechTest</h1>
            <p className="text-muted-foreground mt-2">Operations Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input with Floating Label Effect */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
                data-testid="input-email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pr-10"
                  data-testid="input-password"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span data-testid="text-error">{error}</span>
              </div>
            )}

            {/* Submit Button with Loading State */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ChartLine className="mr-2 h-4 w-4" />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          {/* Demo Credentials Information */}
          <div className="mt-6 p-4 bg-muted/20 rounded-md">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Demo Credentials:</strong><br />
              Email: admin@app.com<br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * API Client utility for making authenticated requests to the backend
 * Implements the interceptor pattern for automatic token attachment
 * Provides centralized error handling and request/response processing
 */

/**
 * Base API request function with automatic token attachment
 * This function implements the Bearer token authentication pattern
 * and provides consistent error handling across all API calls
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} url - API endpoint URL
 * @param {any} data - Request body data (for POST, PUT requests)
 * @returns {Promise<Response>} Fetch response object
 */
export async function apiRequest(method: string, url: string, data?: any): Promise<Response> {
  // Get authentication token from localStorage
  // This enables persistent authentication across browser sessions
  const token = localStorage.getItem('auth_token');
  
  // Prepare request headers with authentication and content type
  const headers: Record<string, string> = {};
  
  // Attach Bearer token if available
  // The Bearer token pattern is widely used for JWT authentication
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Set content type for requests with body data
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    // Make the HTTP request with configured headers and body
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      // Include credentials for cross-origin requests
      credentials: 'include',
    });

    // Handle authentication errors by redirecting to login
    // This implements automatic logout on token expiration
    if (response.status === 401) {
      // Clear expired authentication data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Redirect to login page
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    // Check for other HTTP errors
    if (!response.ok) {
      // Extract error message from response body if available
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Fallback to status text if response body parsing fails
      }
      
      throw new Error(errorMessage);
    }

    return response;
    
  } catch (error) {
    // Handle network errors and other fetch failures
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Network error occurred');
    }
  }
}

/**
 * Convenience function for GET requests
 * @param {string} url - API endpoint URL
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiGet(url: string): Promise<any> {
  const response = await apiRequest('GET', url);
  return response.json();
}

/**
 * Convenience function for POST requests
 * @param {string} url - API endpoint URL
 * @param {any} data - Request body data
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiPost(url: string, data: any): Promise<any> {
  const response = await apiRequest('POST', url, data);
  return response.json();
}

/**
 * Convenience function for PUT requests
 * @param {string} url - API endpoint URL
 * @param {any} data - Request body data
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiPut(url: string, data: any): Promise<any> {
  const response = await apiRequest('PUT', url, data);
  return response.json();
}

/**
 * Convenience function for DELETE requests
 * @param {string} url - API endpoint URL
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiDelete(url: string): Promise<any> {
  const response = await apiRequest('DELETE', url);
  return response.json();
}

/**
 * Helper function to check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  return !!(token && user);
}

/**
 * Helper function to get current user from localStorage
 * @returns {any|null} User object or null if not authenticated
 */
export function getCurrentUser(): any | null {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

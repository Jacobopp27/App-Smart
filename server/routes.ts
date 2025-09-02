import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { operationService, ValidationError, BusinessRuleError, TransactionError } from "./services/operationService";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { insertOperationSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

// JWT secret key from environment variables with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Authentication middleware to protect routes
 * Validates JWT tokens and attaches user information to request object
 * This middleware explains the Bearer token pattern used in REST APIs
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Extract the actual token (remove "Bearer " prefix)
    const token = authHeader.substring(7);
    
    // Verify JWT token - this ensures the token hasn't been tampered with
    // JWT verification checks the signature using the secret key
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    
    // Fetch user from database to ensure they still exist
    const user = await storage.getUser(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request object for use in route handlers
    (req as any).user = user;
    next();
  } catch (error) {
    // JWT verification failed or other error occurred
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Error handling middleware for async routes
 * Wraps async route handlers to catch and forward errors to Express error handler
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Register all API routes with Express application
 * Implements RESTful API endpoints for authentication and operations management
 * @param {Express} app - Express application instance
 * @returns {Promise<Server>} HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  /**
   * GET /api/health
   * Simple health check endpoint to test connectivity
   */
  app.get('/api/health', (req: Request, res: Response) => {
    console.log('🟢 Health check requested');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'Server is running'
    });
  });

  /**
   * GET /api/setup/status
   * Check if setup is needed
   */
  app.get('/api/setup/status', asyncHandler(async (req: Request, res: Response) => {
    const existingUsers = await storage.getAllUsers();
    res.json({ 
      needsSetup: existingUsers.length === 0,
      userCount: existingUsers.length,
      environment: process.env.NODE_ENV || 'development'
    });
  }));

  /**
   * POST /api/setup/admin
   * Creates the first admin user for initial setup
   */
  app.post('/api/setup/admin', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        role: 'admin'
      });

      console.log('✅ Admin user created via setup:', newUser.email);
      
      res.status(201).json({ 
        message: 'Admin user created successfully',
        user: { id: newUser.id, email: newUser.email, role: newUser.role }
      });
    } catch (error) {
      console.error('❌ Setup failed:', error);
      res.status(500).json({ message: 'Setup failed' });
    }
  }));

  /**
   * POST /api/auth/login
   * Authenticates user credentials and returns JWT token
   * 
   * Body: { email: string, password: string }
   * Returns: { token: string, user: { id, email, role } }
   * 
   * This endpoint demonstrates:
   * - Password hashing verification with bcrypt
   * - JWT token generation with user claims
   * - Secure authentication flow
   */
  app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('🔐 Login request received:', {
        body: req.body,
        contentType: req.headers['content-type'],
        method: req.method,
        url: req.url
      });
      
      // Validate request body using Zod schema
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email address
      const user = await storage.getUserByEmail(email);
      console.log('👤 User found:', !!user);
      
      if (!user) {
        console.log('❌ User not found for email:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password using bcrypt
      // bcrypt.compare safely compares plaintext password with hashed password
      // This prevents timing attacks and ensures secure password verification
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate JWT token with user information
      // JWT payload contains subject (user ID) and role for authorization
      // Token expires in 24 hours for security
      const token = jwt.sign(
        { 
          sub: user.id,     // Subject: user identifier
          role: user.role,  // User role for role-based access control
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        JWT_SECRET
      );

      // Return successful authentication response
      console.log('✅ Login successful for user:', email);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      throw error;
    }
  }));

  /**
   * POST /api/operations
   * Creates a new financial operation (protected route)
   * 
   * Headers: Authorization: Bearer <token>
   * Body: { type: "BUY"|"SELL", amount: string, currency: string }
   * Returns: { id, type, amount, currency, createdAt }
   * 
   * This endpoint demonstrates:
   * - Protected route requiring authentication
   * - Input validation with Zod schemas
   * - Database transaction handling
   * - Proper error responses for different scenarios
   */
  app.post('/api/operations', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate operation data using Zod schema
      const operationData = insertOperationSchema.parse(req.body);
      
      // Create operation using service layer with transaction handling
      // This ensures proper business rules and database consistency
      const operation = await operationService.createOperation({
        ...operationData,
        userId: (req as any).user.id
      });

      // Return created operation with 201 status code
      res.status(201).json(operation);

    } catch (error) {
      // Handle different types of errors with appropriate status codes
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      if (error instanceof ValidationError) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          details: error.message 
        });
      }
      
      if (error instanceof BusinessRuleError) {
        return res.status(422).json({ 
          message: 'Business rule violation', 
          details: error.message 
        });
      }
      
      if (error instanceof TransactionError) {
        return res.status(500).json({ 
          message: 'Transaction failed', 
          details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
      
      throw error;
    }
  }));

  /**
   * GET /api/operations
   * Retrieves operations with filtering and pagination (protected route)
   * 
   * Headers: Authorization: Bearer <token>
   * Query params: type?, currency?, search?, page?, limit?
   * Returns: { operations: Operation[], total: number, page: number, limit: number }
   * 
   * This endpoint demonstrates:
   * - Query parameter parsing for filtering
   * - Pagination implementation
   * - Dynamic query building based on filters
   */
  app.get('/api/operations', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { type, currency, search, page = '1', limit = '10' } = req.query;
    
    // Parse and validate pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }

    // Fetch operations using service layer
    const result = await operationService.getOperations({
      userId: (req as any).user.id, // Only return operations for authenticated user
      type: type as string,
      currency: currency as string,
      search: search as string,
      page: pageNum,
      limit: limitNum
    });

    res.json({
      operations: result.operations,
      total: result.total,
      page: pageNum,
      limit: limitNum
    });
  }));

  /**
   * GET /api/operations/stats
   * Retrieves operation statistics for dashboard (protected route)
   * 
   * Headers: Authorization: Bearer <token>
   * Returns: { total: number, buys: number, sells: number }
   */
  app.get('/api/operations/stats', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const stats = await operationService.getOperationStats((req as any).user.id);
    res.json(stats);
  }));

  /**
   * Global error handler middleware
   * Handles all unhandled errors and returns appropriate HTTP responses
   * This middleware explains centralized error handling in Express applications
   */
  app.use((err: any, req: Request, res: Response, next: Function) => {
    console.error('Error:', err);
    
    // Handle different types of errors appropriately
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', details: err.message });
    }
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Default to 500 Internal Server Error
    res.status(500).json({ 
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  });

  // Create HTTP server instance
  const httpServer = createServer(app);
  return httpServer;
}

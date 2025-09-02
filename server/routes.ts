import type { Express, Request, Response } from "express";
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
const authMiddleware = async (req: Request, res: Response, next: Function) => {
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
const asyncHandler = (fn: (req: Request, res: Response, next: Function) => Promise<any>) => (req: Request, res: Response, next: Function) => {
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
      // Validate request body using Zod schema
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email address
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password using bcrypt
      // bcrypt.compare safely compares plaintext password with hashed password
      // This prevents timing attacks and ensures secure password verification
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
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
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
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

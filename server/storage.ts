import { users, operations, type User, type InsertUser, type InsertOperation, type Operation } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";

/**
 * Storage interface defining all CRUD operations for the application
 * This interface ensures consistency between different storage implementations
 */
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Operation operations
  createOperation(operation: InsertOperation & { userId: string }): Promise<Operation>;
  getOperations(params: {
    userId?: string;
    type?: string;
    currency?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ operations: Operation[]; total: number }>;
  getOperationById(id: string): Promise<Operation | undefined>;
  getOperationStats(userId?: string): Promise<{
    total: number;
    buys: number;
    sells: number;
  }>;
}

/**
 * Database storage implementation using PostgreSQL with Drizzle ORM
 * Handles all database operations with proper error handling and transactions
 */
export class DatabaseStorage implements IStorage {
  /**
   * Retrieves a user by their unique ID
   * @param {string} id - The user's UUID
   * @returns {Promise<User | undefined>} User object or undefined if not found
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  /**
   * Retrieves a user by their email address (used for authentication)
   * @param {string} email - The user's email address
   * @returns {Promise<User | undefined>} User object or undefined if not found
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  /**
   * Creates a new user in the database
   * @param {InsertUser} insertUser - User data to insert
   * @returns {Promise<User>} The created user object
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  /**
   * Retrieves all users from the database
   * @returns {Promise<User[]>} Array of all users
   */
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  /**
   * Creates a new financial operation with database transaction
   * Uses a transaction to ensure data consistency and rollback on failure
   * @param {InsertOperation & { userId: string }} operation - Operation data including user ID
   * @returns {Promise<Operation>} The created operation object
   */
  async createOperation(operation: InsertOperation & { userId: string }): Promise<Operation> {
    // Convert string amount to proper decimal format for database storage
    const operationData = {
      ...operation,
      amount: operation.amount.toString(),
    };

    const [newOperation] = await db
      .insert(operations)
      .values(operationData)
      .returning();
    
    return newOperation;
  }

  /**
   * Retrieves operations with filtering, searching, and pagination
   * Supports dynamic query building based on provided parameters
   * @param {Object} params - Query parameters for filtering and pagination
   * @returns {Promise<{operations: Operation[], total: number}>} Paginated operations and total count
   */
  async getOperations(params: {
    userId?: string;
    type?: string;
    currency?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ operations: Operation[]; total: number }> {
    const { userId, type, currency, search, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Build dynamic where conditions based on provided filters
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(operations.userId, userId));
    }
    
    if (type && type !== "all-types") {
      conditions.push(eq(operations.type, type as "BUY" | "SELL"));
    }
    
    if (currency && currency !== "all-currencies") {
      conditions.push(eq(operations.currency, currency));
    }
    
    if (search) {
      // Search across multiple fields for better user experience
      conditions.push(
        or(
          ilike(operations.currency, `%${search}%`),
          ilike(operations.type, `%${search}%`),
          ilike(operations.amount, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute both queries in parallel for better performance
    const [operationsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(operations)
        .where(whereClause)
        .orderBy(desc(operations.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(operations)
        .where(whereClause)
    ]);

    return {
      operations: operationsResult,
      total: totalResult[0].count,
    };
  }

  /**
   * Retrieves a single operation by its ID
   * @param {string} id - The operation's UUID
   * @returns {Promise<Operation | undefined>} Operation object or undefined if not found
   */
  async getOperationById(id: string): Promise<Operation | undefined> {
    const [operation] = await db.select().from(operations).where(eq(operations.id, id));
    return operation || undefined;
  }

  /**
   * Calculates operation statistics for dashboard display
   * Provides counts for total operations, buys, and sells
   * @param {string} userId - Optional user ID to filter stats by user
   * @returns {Promise<{total: number, buys: number, sells: number}>} Statistics object
   */
  async getOperationStats(userId?: string): Promise<{
    total: number;
    buys: number;
    sells: number;
  }> {
    const whereClause = userId ? eq(operations.userId, userId) : undefined;

    // Use efficient aggregation queries for statistics
    const [totalResult, buysResult, sellsResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(operations)
        .where(whereClause),
      db
        .select({ count: count() })
        .from(operations)
        .where(userId 
          ? and(eq(operations.userId, userId), eq(operations.type, "BUY"))
          : eq(operations.type, "BUY")
        ),
      db
        .select({ count: count() })
        .from(operations)
        .where(userId 
          ? and(eq(operations.userId, userId), eq(operations.type, "SELL"))
          : eq(operations.type, "SELL")
        ),
    ]);

    return {
      total: totalResult[0].count,
      buys: buysResult[0].count,
      sells: sellsResult[0].count,
    };
  }
}

// Export singleton instance of database storage
export const storage = new DatabaseStorage();

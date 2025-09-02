/**
 * Operation Service - Business logic layer for financial operations
 * 
 * This service implements the business rules and transaction handling
 * for financial operations, following the controller → service → repository pattern.
 * 
 * Key features:
 * - Database transactions with proper rollback
 * - Business validation rules
 * - Error handling with specific error types
 * - Separation of concerns from controllers
 */

import { db } from "../db";
import { operations, users } from "@shared/schema";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
import type { InsertOperation, Operation } from "@shared/schema";

/**
 * Type definitions for service layer
 */
interface CreateOperationInput {
  type: string;
  amount: string;
  currency: string;
  userId: string;
}

/**
 * Custom error types for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Operation Service Class
 * Handles all business logic for financial operations
 */
export class OperationService {
  
  /**
   * Creates a new financial operation with database transaction
   * Uses proper transaction handling with rollback on failure
   * 
   * This method demonstrates:
   * - Database transactions for data consistency
   * - Business rule validation
   * - Proper error handling and rollback
   * 
   * @param {InsertOperation & { userId: string }} operationData - Operation data including user ID
   * @returns {Promise<Operation>} The created operation object
   * @throws {ValidationError} When operation data is invalid
   * @throws {BusinessRuleError} When business rules are violated
   * @throws {TransactionError} When database transaction fails
   */
  async createOperation(operationData: CreateOperationInput): Promise<Operation> {
    // Start database transaction
    // Using Drizzle's transaction method ensures ACID properties
    return await db.transaction(async (tx) => {
      try {
        // 1. Validate business rules before proceeding
        await this.validateOperationData(operationData, tx);
        
        // 2. Check if user exists and is active
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, operationData.userId))
          .limit(1);
          
        if (!user) {
          throw new BusinessRuleError('User not found or inactive');
        }
        
        // 3. Apply business-specific transformations
        const processedData = await this.processOperationData(operationData);
        
        // 4. Insert operation with database constraints
        const [newOperation] = await tx
          .insert(operations)
          .values(processedData)
          .returning();
        
        // 5. Log operation for audit trail (optional)
        console.log(`Operation created: ${newOperation.id} - ${newOperation.type} ${newOperation.amount} ${newOperation.currency}`);
        
        return newOperation;
        
      } catch (error) {
        // Transaction will automatically rollback on any error
        console.error('Transaction failed, rolling back:', error);
        
        if (error instanceof ValidationError || 
            error instanceof BusinessRuleError || 
            error instanceof TransactionError) {
          throw error;
        }
        
        // Wrap unexpected errors
        throw new TransactionError(`Failed to create operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
  
  /**
   * Validates operation data according to business rules
   * 
   * @param {InsertOperation & { userId: string }} data - Operation data to validate
   * @param {any} tx - Database transaction context
   * @throws {ValidationError} When validation fails
   */
  private async validateOperationData(data: CreateOperationInput, tx: any): Promise<void> {
    // Amount validation - must be positive
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new ValidationError('Amount must be a positive number greater than 0');
    }
    
    // Amount precision validation - max 2 decimal places for most currencies
    if (!this.isValidCurrencyPrecision(amount, data.currency)) {
      throw new ValidationError(`Invalid amount precision for currency ${data.currency}`);
    }
    
    // Currency validation
    if (!this.isValidCurrency(data.currency)) {
      throw new ValidationError(`Invalid currency code: ${data.currency}`);
    }
    
    // Operation type validation
    if (!['BUY', 'SELL'].includes(data.type)) {
      throw new ValidationError('Operation type must be BUY or SELL');
    }
    
    // Business rule: Check daily operation limits (example)
    await this.validateDailyLimits(data.userId, amount, tx);
  }
  
  /**
   * Processes and transforms operation data
   * 
   * @param {InsertOperation & { userId: string }} data - Raw operation data
   * @returns {Promise<any>} Processed operation data ready for database
   */
  private async processOperationData(data: CreateOperationInput): Promise<any> {
    return {
      type: data.type,
      amount: parseFloat(data.amount).toFixed(2), // Ensure 2 decimal places
      currency: data.currency.toUpperCase(), // Normalize currency to uppercase
      userId: data.userId,
    };
  }
  
  /**
   * Validates currency precision rules
   * 
   * @param {number} amount - Operation amount
   * @param {string} currency - Currency code
   * @returns {boolean} True if precision is valid
   */
  private isValidCurrencyPrecision(amount: number, currency: string): boolean {
    const cryptoCurrencies = ['BTC', 'ETH', 'ADA', 'SOL'];
    
    if (cryptoCurrencies.includes(currency.toUpperCase())) {
      // Crypto currencies can have up to 8 decimal places
      return /^\d+(\.\d{1,8})?$/.test(amount.toString());
    } else {
      // Fiat currencies typically have 2 decimal places
      return /^\d+(\.\d{1,2})?$/.test(amount.toString());
    }
  }
  
  /**
   * Validates currency codes
   * 
   * @param {string} currency - Currency code to validate
   * @returns {boolean} True if currency is valid
   */
  private isValidCurrency(currency: string): boolean {
    const validCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', // Fiat
      'BTC', 'ETH', 'ADA', 'SOL' // Crypto
    ];
    
    return validCurrencies.includes(currency.toUpperCase());
  }
  
  /**
   * Validates daily operation limits (example business rule)
   * 
   * @param {string} userId - User ID
   * @param {number} amount - Operation amount
   * @param {any} tx - Database transaction context
   * @throws {BusinessRuleError} When daily limits are exceeded
   */
  private async validateDailyLimits(userId: string, amount: number, tx: any): Promise<void> {
    // Get today's operations for the user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [dailyTotal] = await tx
      .select({ total: count() })
      .from(operations)
      .where(
        and(
          eq(operations.userId, userId),
          // Note: This is a simplified date check
          // In production, you'd use proper date range filtering
        )
      );
    
    // Example business rule: Maximum 10 operations per day
    if (dailyTotal.total >= 10) {
      throw new BusinessRuleError('Daily operation limit exceeded (10 operations per day)');
    }
    
    // Example: Maximum $10,000 total per day for USD operations
    // (This would require summing amounts, simplified here)
    if (amount > 10000) {
      throw new BusinessRuleError('Single operation amount exceeds daily limit ($10,000)');
    }
  }
  
  /**
   * Retrieves operations with filtering and pagination
   * Delegates to repository layer but adds business logic
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<{operations: Operation[], total: number}>} Paginated operations
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

    // Build dynamic where conditions
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
      conditions.push(
        or(
          ilike(operations.currency, `%${search}%`),
          ilike(operations.type, `%${search}%`),
          ilike(operations.amount, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute queries in parallel for better performance
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
   * Gets operation statistics for dashboard
   * 
   * @param {string} userId - Optional user ID to filter stats
   * @returns {Promise<{total: number, buys: number, sells: number}>} Statistics
   */
  async getOperationStats(userId?: string): Promise<{
    total: number;
    buys: number;
    sells: number;
  }> {
    const whereClause = userId ? eq(operations.userId, userId) : undefined;

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

// Export singleton instance
export const operationService = new OperationService();
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operations table for financial transactions
export const operations = pgTable("operations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type", { enum: ["BUY", "SELL"] }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  operations: many(operations),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  user: one(users, {
    fields: [operations.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

export const insertOperationSchema = createInsertSchema(operations).pick({
  type: true,
  amount: true,
  currency: true,
}).extend({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  currency: z.string().min(3).max(10),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOperation = z.infer<typeof insertOperationSchema>;
export type Operation = typeof operations.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;

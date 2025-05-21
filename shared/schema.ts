import { pgTable, text, serial, integer, date, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passwordHash: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Plumber model
export const plumbers = pgTable("plumbers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  commissionRate: doublePrecision("commission_rate").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  startDate: date("start_date").notNull(),
});

export const insertPlumberSchema = createInsertSchema(plumbers).pick({
  name: true,
  email: true,
  phone: true,
  commissionRate: true,
  isActive: true,
  startDate: true,
});

export type InsertPlumber = z.infer<typeof insertPlumberSchema>;
export type Plumber = typeof plumbers.$inferSelect;

// Job model
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  customerName: text("customer_name").notNull(),
  revenue: doublePrecision("revenue").notNull(),
  partsCost: doublePrecision("parts_cost").notNull(),
  outsideLabor: doublePrecision("outside_labor").notNull(),
  commissionAmount: doublePrecision("commission_amount").notNull(),
  plumberId: integer("plumber_id").notNull(),
  payrollId: integer("payroll_id").notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  date: true,
  customerName: true,
  revenue: true,
  partsCost: true,
  outsideLabor: true,
  commissionAmount: true,
  plumberId: true,
  payrollId: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Payroll model
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  weekEndingDate: date("week_ending_date").notNull(),
  status: text("status").notNull().default("draft"), // draft or finalized
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPayrollSchema = createInsertSchema(payrolls)
  .pick({
    weekEndingDate: true,
    status: true,
  })
  // Allow string values that can be parsed as dates
  .extend({
    weekEndingDate: z.coerce.date(),
  });

export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrolls.$inferSelect;

// Update schemas
export const updatePlumberSchema = insertPlumberSchema.partial();
export type UpdatePlumber = z.infer<typeof updatePlumberSchema>;

export const updateJobSchema = insertJobSchema.partial();
export type UpdateJob = z.infer<typeof updateJobSchema>;

export const updatePayrollSchema = insertPayrollSchema.partial();
export type UpdatePayroll = z.infer<typeof updatePayrollSchema>;

// Validation schemas
export const jobFormSchema = z.object({
  date: z.coerce.date(),
  customerName: z.string().min(1, "Customer name is required"),
  revenue: z.coerce.number().min(0, "Revenue must be greater than or equal to 0"),
  partsCost: z.coerce.number().min(0, "Parts cost must be greater than or equal to 0"),
  outsideLabor: z.coerce.number().min(0, "Outside labor must be greater than or equal to 0"),
  plumberId: z.coerce.number().min(1, "Plumber is required"),
});

export const plumberFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  commissionRate: z.coerce.number().min(0, "Commission rate must be greater than or equal to 0").max(100, "Commission rate must be less than or equal to 100"),
  isActive: z.boolean(),
  startDate: z.coerce.date(),
});

// Helper types
export type JobWithPlumber = Job & { plumber: Plumber };
export type PayrollSummary = {
  plumberId: number;
  plumberName: string;
  jobCount: number;
  totalRevenue: number;
  totalCosts: number;
  totalCommission: number;
};

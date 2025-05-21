import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPlumberSchema, updatePlumberSchema,
  insertJobSchema, updateJobSchema,
  insertPayrollSchema, updatePayrollSchema,
  jobFormSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API routes
  app.use("/api", (req, res, next) => {
    res.header("Cache-Control", "no-store");
    next();
  });

  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(validated.username);
      if (existing) {
        return res.status(400).json({ message: "Username taken" });
      }
      const user = await storage.createUser({
        username: validated.username,
        passwordHash: hashPassword(validated.passwordHash),
      });
      req.session.userId = user.id;
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = z
        .object({ username: z.string(), password: z.string() })
        .parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });

  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).end();
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).end();
    res.json({ id: user.id, username: user.username });
  });

  // Plumber routes
  app.get("/api/plumbers", async (req, res) => {
    try {
      const plumbers = await storage.getPlumbers();
      res.json(plumbers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plumbers" });
    }
  });

  app.get("/api/plumbers/active", async (req, res) => {
    try {
      const plumbers = await storage.getActivePlumbers();
      res.json(plumbers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active plumbers" });
    }
  });

  app.get("/api/plumbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plumber ID" });
      }

      const plumber = await storage.getPlumber(id);
      if (!plumber) {
        return res.status(404).json({ message: "Plumber not found" });
      }

      res.json(plumber);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plumber" });
    }
  });

  app.post("/api/plumbers", async (req, res) => {
    try {
      const validatedData = insertPlumberSchema.parse(req.body);
      const plumber = await storage.createPlumber(validatedData);
      res.status(201).json(plumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plumber data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create plumber" });
    }
  });

  app.patch("/api/plumbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plumber ID" });
      }

      const validatedData = updatePlumberSchema.parse(req.body);
      const plumber = await storage.updatePlumber(id, validatedData);
      
      if (!plumber) {
        return res.status(404).json({ message: "Plumber not found" });
      }

      res.json(plumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid plumber data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update plumber" });
    }
  });

  app.delete("/api/plumbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plumber ID" });
      }

      const success = await storage.deletePlumber(id);
      if (!success) {
        return res.status(404).json({ message: "Plumber not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete plumber" });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get("/api/jobs/plumber/:plumberId", async (req, res) => {
    try {
      const plumberId = parseInt(req.params.plumberId);
      if (isNaN(plumberId)) {
        return res.status(400).json({ message: "Invalid plumber ID" });
      }

      const jobs = await storage.getJobsByPlumber(plumberId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/payroll/:payrollId", async (req, res) => {
    try {
      const payrollId = parseInt(req.params.payrollId);
      if (isNaN(payrollId)) {
        return res.status(400).json({ message: "Invalid payroll ID" });
      }

      const jobs = await storage.getJobsByPayroll(payrollId);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const validatedData = updateJobSchema.parse(req.body);
      const job = await storage.updateJob(id, validatedData);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const success = await storage.deleteJob(id);
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Payroll routes
  app.get("/api/payrolls", async (req, res) => {
    try {
      const payrolls = await storage.getPayrolls();
      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  });

  app.get("/api/payrolls/current", async (req, res) => {
    try {
      const payroll = await storage.getCurrentPayroll();
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current payroll" });
    }
  });

  app.get("/api/payrolls/latest-finalized", async (_req, res) => {
    try {
      const payroll = await storage.getLatestFinalizedPayroll();
      if (!payroll) {
        return res.status(404).json({ message: "No finalized payroll" });
      }
      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.get("/api/payrolls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payroll ID" });
      }

      const payroll = await storage.getPayroll(id);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }

      res.json(payroll);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post("/api/payrolls", async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse(req.body);
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payroll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payroll" });
    }
  });

  app.patch("/api/payrolls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payroll ID" });
      }

      const validatedData = updatePayrollSchema.parse(req.body);
      const payroll = await storage.updatePayroll(id, validatedData);
      
      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }

      res.json(payroll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payroll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payroll" });
    }
  });

  // Summary route
  app.get("/api/payrolls/:id/summary", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payroll ID" });
      }

      const summary = await storage.getPayrollSummary(id);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll summary" });
    }
  });

  // Calculate commission route
  app.post("/api/calculate-commission", async (req, res) => {
    try {
      const { revenue, partsCost, outsideLabor, commissionRate } = req.body;
      
      // Validate the input data
      const validatedData = z.object({
        revenue: z.number().min(0),
        partsCost: z.number().min(0),
        outsideLabor: z.number().min(0),
        commissionRate: z.number().min(0).max(100),
      }).parse(req.body);
      
      // Apply markup to costs
      const adjustedCosts = (validatedData.partsCost + validatedData.outsideLabor) * 1.25;
      
      // Calculate commission base
      const commissionBase = Math.max(0, validatedData.revenue - adjustedCosts);
      
      // Calculate commission amount
      const commissionAmount = commissionBase * (validatedData.commissionRate / 100);
      
      res.json({
        revenue: validatedData.revenue,
        partsCostWithMarkup: validatedData.partsCost * 1.25,
        outsideLaborWithMarkup: validatedData.outsideLabor * 1.25,
        adjustedCosts,
        commissionBase,
        commissionAmount,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calculation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to calculate commission" });
    }
  });

  return httpServer;
}

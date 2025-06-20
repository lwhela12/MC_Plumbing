import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import { plumbers } from "@shared/schema";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration - use memory store for now to avoid connection issues
app.use(session({
  secret: process.env.SESSION_SECRET || 'mc-plumbing-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function initializeDatabase() {
  if (!process.env.DATABASE_URL || !db) {
    log("Database URL not configured, skipping database setup");
    return;
  }

  let retries = 3;
  while (retries > 0) {
    try {
      log("Migrating database schema...");
      
      // Test connection first
      await db.execute(sql`SELECT 1`);
      
      // Create users table for authentication
      await db.execute(sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      )`);
      
      // Push schema changes to the database
      await db.execute(sql`CREATE TABLE IF NOT EXISTS plumbers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        commission_rate DOUBLE PRECISION NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        start_date DATE NOT NULL
      )`);
      
      await db.execute(sql`CREATE TABLE IF NOT EXISTS payrolls (
        id SERIAL PRIMARY KEY,
        week_ending_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )`);
      
      await db.execute(sql`CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        customer_name TEXT NOT NULL,
        revenue DOUBLE PRECISION NOT NULL,
        parts_cost DOUBLE PRECISION NOT NULL,
        outside_labor DOUBLE PRECISION NOT NULL,
        commission_amount DOUBLE PRECISION NOT NULL,
        plumber_id INTEGER NOT NULL,
        payroll_id INTEGER NOT NULL
      )`);

      // Check if there's any data in the database
      const plumbersCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(plumbers);
      const plumbersCount = Number(plumbersCountResult[0]?.count ?? 0);

      if (plumbersCount === 0) {
        log("Database initialized and empty.");
      } else {
        log(`Database already has ${plumbersCount} plumbers.`);
      }
      
      log("Database setup complete!");
      return; // Success, exit retry loop
      
    } catch (error) {
      retries--;
      log(`Database migration error (${3 - retries}/3): ${error}`);
      
      if (retries === 0) {
        log("Database migration failed after 3 attempts. Starting server without database connection.");
        console.error("Database migration error:", error);
      } else {
        log(`Retrying in 2 seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

(async () => {
  await initializeDatabase();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { plumbers } from "@shared/schema";
import session from "express-session";
import connectMem from "memorystore";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const MemStore = connectMem(session);
app.use(
  session({
    store: new MemStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

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

(async () => {
  // If using PostgreSQL, perform migration
  if (process.env.DATABASE_URL) {
    try {
      log("Migrating database schema...");
      await db.execute(sql`CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamptz DEFAULT now()
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

      await db.execute(sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        login_token TEXT
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
    } catch (error) {
      log(`Database migration error: ${error}`);
      console.error("Database migration error:", error);
    }
  }
  
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

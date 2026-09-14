import express, { type ErrorRequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { ZodError } from "zod";
import { pool } from "./db.js";
import { registerRoutes, registerBusinessRoutes } from "./routes.js";
import { storage } from "./storage.js";
import { BusinessError } from "./pgStorage.js";

export function createApp() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required; temporary memory storage is disabled");
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  const app = express();
  app.disable("x-powered-by"); app.set("trust proxy", 1);
  app.use((_req, res, next) => {
    res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin" });
    if (process.env.VERCEL) res.set("Strict-Transport-Security", "max-age=31536000");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      const expected = process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
      if (!origin || origin !== expected || req.get("sec-fetch-site") === "cross-site") return res.status(403).json({ message: "Request origin is not allowed" });
      if (req.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return res.status(415).json({ message: "Use application/json" });
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  const PgSession = connectPg(session);
  app.use(session({ name: "mc.sid", secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
    store: new PgSession({ pool, tableName: "sessions", createTableIfMissing: false, pruneSessionInterval: false }),
    cookie: { httpOnly: true, secure: Boolean(process.env.VERCEL) || process.env.COOKIE_SECURE === "true", sameSite: "lax", maxAge: 12 * 60 * 60 * 1000, path: "/" }
  }));
  registerRoutes(app);
  app.use("/api", (req, res, next) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    storage.getUserById(req.session.userId).then(user => {
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      next();
    }).catch(next);
  });
  registerBusinessRoutes(app);
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) return void res.status(400).json({ message: "Invalid input", errors: error.issues.map(({ path, message }) => ({ path, message })) });
    if (error instanceof BusinessError) return void res.status(error.status).json({ message: error.message });
    if (error.type === "entity.parse.failed") return void res.status(400).json({ message: "Invalid JSON" });
    console.error("Request failed", { code: typeof error.code === "string" ? error.code : "internal" });
    res.status(500).json({ message: "Unable to complete request. Please try again." });
  };
  app.use(errorHandler);
  return app;
}

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createHash } from "node:crypto";
import { storage } from "./storage.js";
import { db, pool } from "./db.js";
import { plumbers, jobs, payrolls, insertPlumberSchema, updatePlumberSchema, insertJobSchema, updateJobSchema, insertPayrollSchema, updatePayrollSchema, loginSchema } from "../shared/schema.js";
import { verifyPassword } from "./auth.js";
import { commission } from "./pgStorage.js";

declare module "express-session" { interface SessionData { userId: number } }
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res)).catch(next); };
const idOf = (req: Request, key = "id") => z.coerce.number().int().positive().parse(req.params[key]);
const nonempty = <T extends z.AnyZodObject>(schema: T) => schema.refine(value => Object.keys(value).length > 0, "No changes supplied");
const found = (res: Response, value: unknown) => value ? res.json(value) : res.status(404).json({ message: "Record not found" });
const DUMMY_HASH = "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

export function registerRoutes(app: Express) {
  app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  app.get("/api/health", wrap(async (_req, res) => { await pool.query("SELECT 1"); res.json({ status: "ok" }); }));
  app.post("/api/register", (_req, res) => res.status(403).json({ message: "Registration is closed. Contact your MC Plumbing administrator for access." }));
  app.post("/api/login", wrap(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const bucket = createHash("sha256").update(req.ip ?? "unknown").digest("hex");
    const result = await pool.query(`INSERT INTO login_rate_limits (key, window_start, attempts) VALUES ($1, now(), 1)
      ON CONFLICT (key) DO UPDATE SET attempts = CASE WHEN login_rate_limits.window_start < now() - interval '15 minutes' THEN 1 ELSE login_rate_limits.attempts + 1 END,
      window_start = CASE WHEN login_rate_limits.window_start < now() - interval '15 minutes' THEN now() ELSE login_rate_limits.window_start END RETURNING attempts`, [bucket]);
    if (result.rows[0].attempts > 20) { res.set("Retry-After", "900"); return res.status(429).json({ message: "Too many login attempts. Please try again in 15 minutes." }); }
    const user = await storage.getUserByUsername(username);
    const matches = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches) return res.status(401).json({ message: "Invalid username or password" });
    await new Promise<void>((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
    res.json({ id: user.id, username: user.username });
  }));
  app.post("/api/logout", wrap(async (req, res) => {
    await new Promise<void>((resolve, reject) => req.session.destroy(err => err ? reject(err) : resolve()));
    res.clearCookie("mc.sid", { path: "/" }); res.json({ message: "Logged out" });
  }));

}

export function registerBusinessRoutes(app: Express) {
  app.get("/api/me", wrap(async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ id: user.id, username: user.username });
  }));
  app.get("/api/plumbers", wrap(async (_req, res) => res.json(await storage.getPlumbers())));
  app.get("/api/plumbers/active", wrap(async (_req, res) => res.json(await storage.getActivePlumbers())));
  app.get("/api/plumbers/:id", wrap(async (req, res) => found(res, await storage.getPlumber(idOf(req)))));
  app.post("/api/plumbers", wrap(async (req, res) => res.status(201).json(await storage.createPlumber(insertPlumberSchema.parse(req.body)))));
  app.patch("/api/plumbers/:id", wrap(async (req, res) => found(res, await storage.updatePlumber(idOf(req), nonempty(updatePlumberSchema).parse(req.body)))));
  app.delete("/api/plumbers/:id", wrap(async (req, res) => (await storage.deletePlumber(idOf(req))) ? res.status(204).end() : res.status(404).json({ message: "Plumber not found" })));
  app.get("/api/jobs", wrap(async (_req, res) => res.json(await storage.getJobs())));
  app.get("/api/jobs/plumber/:plumberId", wrap(async (req, res) => res.json(await storage.getJobsByPlumber(idOf(req, "plumberId")))));
  app.get("/api/jobs/payroll/:payrollId", wrap(async (req, res) => res.json(await storage.getJobsByPayroll(idOf(req, "payrollId")))));
  app.get("/api/jobs/:id", wrap(async (req, res) => found(res, await storage.getJob(idOf(req)))));
  app.post("/api/jobs", wrap(async (req, res) => res.status(201).json(await storage.createJob(insertJobSchema.parse({ ...req.body, commissionAmount: 0 })))));
  app.patch("/api/jobs/:id", wrap(async (req, res) => found(res, await storage.updateJob(idOf(req), nonempty(updateJobSchema).parse(req.body)))));
  app.delete("/api/jobs/:id", wrap(async (req, res) => (await storage.deleteJob(idOf(req))) ? res.status(204).end() : res.status(404).json({ message: "Job not found" })));
  app.get("/api/payrolls", wrap(async (_req, res) => res.json(await storage.getPayrolls())));
  app.get("/api/payrolls/current", wrap(async (_req, res) => res.json(await storage.getCurrentPayroll())));
  app.get("/api/payrolls/latest-finalized", wrap(async (_req, res) => found(res, await storage.getLatestFinalizedPayroll())));
  app.get("/api/payrolls/:id/summary", wrap(async (req, res) => res.json(await storage.getPayrollSummary(idOf(req)))));
  app.get("/api/payrolls/:id", wrap(async (req, res) => found(res, await storage.getPayroll(idOf(req)))));
  app.post("/api/payrolls", wrap(async (req, res) => res.status(201).json(await storage.createPayroll(insertPayrollSchema.parse(req.body)))));
  app.patch("/api/payrolls/:id", wrap(async (req, res) => found(res, await storage.updatePayroll(idOf(req), nonempty(updatePayrollSchema).parse(req.body)))));
  app.post("/api/calculate-commission", wrap(async (req, res) => {
    const value = z.object({ revenue: z.number().finite().min(0), partsCost: z.number().finite().min(0), outsideLabor: z.number().finite().min(0), commissionRate: z.number().finite().min(0).max(100) }).parse(req.body);
    res.json({ ...value, partsCostWithMarkup: value.partsCost * 1.25, outsideLaborWithMarkup: value.outsideLabor * 1.25, adjustedCosts: (value.partsCost + value.outsideLabor) * 1.25, commissionBase: Math.max(0, value.revenue - (value.partsCost + value.outsideLabor) * 1.25), commissionAmount: commission(value.revenue, value.partsCost, value.outsideLabor, value.commissionRate) });
  }));
  app.get("/api/export", wrap(async (_req, res) => {
    const data = await db.transaction(async tx => ({ plumbers: await tx.select().from(plumbers), jobs: await tx.select().from(jobs), payrolls: await tx.select().from(payrolls) }), { isolationLevel: "repeatable read", accessMode: "read only" });
    res.set("Content-Disposition", `attachment; filename="mc_plumbing_backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({ version: "1.0", exportDate: new Date().toISOString(), data });
  }));
  app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found" }));
}

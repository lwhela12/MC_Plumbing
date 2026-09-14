import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db.js";
import { plumbers, jobs, payrolls, users, type Plumber, type InsertPlumber, type UpdatePlumber, type InsertJob, type UpdateJob, type InsertPayroll, type UpdatePayroll, type InsertUser, type PayrollSummary } from "../shared/schema.js";
import type { IStorage } from "./storage.js";

export class BusinessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const commission = (revenue: number, parts: number, labor: number, rate: number) =>
  Math.round((Math.max(0, revenue - (parts + labor) * 1.25) * rate / 100 + Number.EPSILON) * 100) / 100;

async function lockDraft(tx: Tx, id: number) {
  const [payroll] = await tx.select().from(payrolls).where(eq(payrolls.id, id)).for("update");
  if (!payroll) throw new BusinessError(404, "Payroll not found");
  if (payroll.status !== "draft") throw new BusinessError(409, "Finalized payroll is read-only. Reopen it before making changes.");
  return payroll;
}
// Only a display label: never invent or write a replacement historical identity.
const missingPlumber = (id: number): Plumber => ({ id, name: `Missing plumber #${id}`, email: "", phone: "", commissionRate: 0, isActive: false, startDate: "1970-01-01" });

export class PgStorage implements IStorage {
  getPlumbers() { return db.select().from(plumbers).orderBy(plumbers.id); }
  getActivePlumbers() { return db.select().from(plumbers).where(eq(plumbers.isActive, true)).orderBy(plumbers.id); }
  async getPlumber(id: number) { return (await db.select().from(plumbers).where(eq(plumbers.id, id)))[0]; }
  async createPlumber(value: InsertPlumber) { return (await db.insert(plumbers).values(value).returning())[0]; }
  async updatePlumber(id: number, value: UpdatePlumber) { return (await db.update(plumbers).set(value).where(eq(plumbers.id, id)).returning())[0]; }
  async deletePlumber(id: number) {
    // Archive instead of deleting so historical relationships remain intact.
    return Boolean((await db.update(plumbers).set({ isActive: false }).where(eq(plumbers.id, id)).returning())[0]);
  }
  getJobs() { return db.select().from(jobs).orderBy(jobs.id); }
  async getJob(id: number) { return (await db.select().from(jobs).where(eq(jobs.id, id)))[0]; }
  getJobsByPlumber(id: number) { return db.select().from(jobs).where(eq(jobs.plumberId, id)).orderBy(jobs.id); }
  getJobsByPayroll(id: number) { return db.select().from(jobs).where(eq(jobs.payrollId, id)).orderBy(jobs.id); }
  async getJobsWithPlumberByPayroll(id: number) {
    const rows = await db.select({ job: jobs, plumber: plumbers }).from(jobs).leftJoin(plumbers, eq(jobs.plumberId, plumbers.id)).where(eq(jobs.payrollId, id));
    return rows.map(row => ({ ...row.job, plumber: row.plumber ?? missingPlumber(row.job.plumberId) }));
  }
  async createJob(value: InsertJob) {
    return db.transaction(async tx => {
      await lockDraft(tx, value.payrollId);
      const [plumber] = await tx.select().from(plumbers).where(eq(plumbers.id, value.plumberId)).for("share");
      if (!plumber?.isActive) throw new BusinessError(400, "Select an active plumber");
      return (await tx.insert(jobs).values({ ...value, commissionAmount: commission(value.revenue, value.partsCost, value.outsideLabor, plumber.commissionRate) }).returning())[0];
    });
  }
  async updateJob(id: number, value: UpdateJob) {
    return db.transaction(async tx => {
      // Lock the job, then its payroll. Finalization locks the payroll before updating.
      const [old] = await tx.select().from(jobs).where(eq(jobs.id, id)).for("update");
      if (!old) return undefined;
      if (value.payrollId !== undefined && value.payrollId !== old.payrollId) throw new BusinessError(400, "Jobs cannot be moved between payrolls");
      await lockDraft(tx, old.payrollId);
      const next = { ...old, ...value };
      const financialChange = ["revenue", "partsCost", "outsideLabor", "plumberId"].some(key => key in value && value[key as keyof UpdateJob] !== old[key as keyof typeof old]);
      const [plumber] = await tx.select().from(plumbers).where(eq(plumbers.id, next.plumberId)).for("share");
      if ((financialChange || next.plumberId !== old.plumberId) && !plumber) throw new BusinessError(409, "Resolve the missing plumber before changing financial values");
      if (next.plumberId !== old.plumberId && !plumber?.isActive) throw new BusinessError(400, "Select an active plumber");
      // Keep historical amounts when editing only a date or customer label.
      next.commissionAmount = financialChange && plumber ? commission(next.revenue, next.partsCost, next.outsideLabor, plumber.commissionRate) : old.commissionAmount;
      return (await tx.update(jobs).set(next).where(eq(jobs.id, id)).returning())[0];
    });
  }
  async deleteJob(id: number) {
    return db.transaction(async tx => {
      const [job] = await tx.select().from(jobs).where(eq(jobs.id, id)).for("update");
      if (!job) return false;
      await lockDraft(tx, job.payrollId);
      await tx.delete(jobs).where(eq(jobs.id, id));
      return true;
    });
  }
  getPayrolls() { return db.select().from(payrolls).orderBy(desc(payrolls.weekEndingDate)); }
  async getPayroll(id: number) { return (await db.select().from(payrolls).where(eq(payrolls.id, id)))[0]; }
  async getCurrentPayroll() {
    return db.transaction(async tx => {
      // Serialize auto-creation across function instances.
      await tx.execute(sql`select pg_advisory_xact_lock(7142026)`);
      const [current] = await tx.select().from(payrolls).where(eq(payrolls.status, "draft")).orderBy(desc(payrolls.weekEndingDate)).limit(1);
      if (current) return current;
      const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      return (await tx.insert(payrolls).values({ weekEndingDate: date, status: "draft" }).returning())[0];
    });
  }
  async getPayrollByDate(date: Date) { return (await db.select().from(payrolls).where(eq(payrolls.weekEndingDate, date.toISOString().slice(0, 10))))[0]; }
  async getLatestFinalizedPayroll() { return (await db.select().from(payrolls).where(eq(payrolls.status, "finalized")).orderBy(desc(payrolls.weekEndingDate)).limit(1))[0]; }
  async createPayroll(value: InsertPayroll) {
    if (value.status === "finalized") throw new BusinessError(400, "Create a draft payroll before finalizing");
    return (await db.insert(payrolls).values(value).returning())[0];
  }
  async updatePayroll(id: number, value: UpdatePayroll) {
    return db.transaction(async tx => {
      const [old] = await tx.select().from(payrolls).where(eq(payrolls.id, id)).for("update");
      if (!old) return undefined;
      if (old.status === "finalized" && !(value.status === "draft" && value.weekEndingDate === undefined)) throw new BusinessError(409, "Reopen finalized payroll before editing");
      return (await tx.update(payrolls).set(value).where(eq(payrolls.id, id)).returning())[0];
    });
  }
  async deletePayroll(_id: number): Promise<boolean> { throw new BusinessError(405, "Payroll deletion is disabled"); }
  async getPayrollSummary(id: number) {
    const rows = await this.getJobsWithPlumberByPayroll(id);
    const result = new Map<number, PayrollSummary>();
    for (const job of rows) {
      const summary = result.get(job.plumberId) ?? { plumberId: job.plumberId, plumberName: job.plumber.name, jobCount: 0, totalRevenue: 0, totalCosts: 0, totalCommission: 0 };
      summary.jobCount++; summary.totalRevenue += job.revenue;
      summary.totalCosts += (job.partsCost + job.outsideLabor) * 1.25;
      summary.totalCommission += job.commissionAmount;
      result.set(job.plumberId, summary);
    }
    return [...result.values()];
  }
  async createUser(value: InsertUser) { return (await db.insert(users).values(value).returning())[0]; }
  async getUserByUsername(name: string) { return (await db.select().from(users).where(eq(users.username, name)))[0]; }
  async getUserById(id: number) { return (await db.select().from(users).where(eq(users.id, id)))[0]; }
}

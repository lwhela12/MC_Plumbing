import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  plumbers, type Plumber, type InsertPlumber, type UpdatePlumber,
  jobs, type Job, type InsertJob, type UpdateJob,
  payrolls, type Payroll, type InsertPayroll, type UpdatePayroll,
  users, type User, type InsertUser,
  type JobWithPlumber, type PayrollSummary
} from "@shared/schema";
import { IStorage } from "./storage";

export class PgStorage implements IStorage {
  // Plumber operations
  async getPlumbers(): Promise<Plumber[]> {
    return await db.select().from(plumbers);
  }

  async getActivePlumbers(): Promise<Plumber[]> {
    return await db.select().from(plumbers).where(eq(plumbers.isActive, true));
  }

  async getPlumber(id: number): Promise<Plumber | undefined> {
    const results = await db.select().from(plumbers).where(eq(plumbers.id, id));
    return results.length ? results[0] : undefined;
  }

  async createPlumber(plumber: InsertPlumber): Promise<Plumber> {
    const results = await db.insert(plumbers).values(plumber).returning();
    return results[0];
  }

  async updatePlumber(id: number, plumber: UpdatePlumber): Promise<Plumber | undefined> {
    const results = await db.update(plumbers)
      .set(plumber)
      .where(eq(plumbers.id, id))
      .returning();
    return results.length ? results[0] : undefined;
  }

  async deletePlumber(id: number): Promise<boolean> {
    const results = await db.delete(plumbers)
      .where(eq(plumbers.id, id))
      .returning();
    return results.length > 0;
  }

  // Job operations
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const results = await db.select().from(jobs).where(eq(jobs.id, id));
    return results.length ? results[0] : undefined;
  }

  async getJobsByPlumber(plumberId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.plumberId, plumberId));
  }

  async getJobsByPayroll(payrollId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.payrollId, payrollId));
  }

  async getJobsWithPlumberByPayroll(payrollId: number): Promise<JobWithPlumber[]> {
    const jobsWithPlumbers: JobWithPlumber[] = [];
    
    // Get all jobs for this payroll
    const jobsList = await this.getJobsByPayroll(payrollId);
    
    // For each job, get the plumber details
    for (const job of jobsList) {
      const plumber = await this.getPlumber(job.plumberId);
      if (!plumber) {
        throw new Error(`Plumber not found for job ${job.id}`);
      }
      
      jobsWithPlumbers.push({
        ...job,
        plumber,
      });
    }
    
    return jobsWithPlumbers;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const results = await db.insert(jobs).values(job).returning();
    return results[0];
  }

  async updateJob(id: number, job: UpdateJob): Promise<Job | undefined> {
    const results = await db.update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return results.length ? results[0] : undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    const results = await db.delete(jobs)
      .where(eq(jobs.id, id))
      .returning();
    return results.length > 0;
  }

  // Payroll operations
  async getPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls);
  }

  async getPayroll(id: number): Promise<Payroll | undefined> {
    const results = await db.select().from(payrolls).where(eq(payrolls.id, id));
    return results.length ? results[0] : undefined;
  }

  async getCurrentPayroll(): Promise<Payroll> {
    // Get all draft payrolls
    const draftPayrolls = await db.select()
      .from(payrolls)
      .where(eq(payrolls.status, "draft"));
    
    if (draftPayrolls.length > 0) {
      // Sort by date (latest first) and return the first one
      return draftPayrolls.sort((a, b) => 
        new Date(b.weekEndingDate).getTime() - new Date(a.weekEndingDate).getTime()
      )[0];
    }
    
    // If no draft payrolls exist, create a new one
    const now = new Date();
    // No date adjustment - use the current date
    
    return this.createPayroll({
      weekEndingDate: now.toISOString().split('T')[0],
      status: "draft",
    });
  }

  async getPayrollByDate(weekEndingDate: Date): Promise<Payroll | undefined> {
    // Format the date without any adjustment
    const formattedDate = weekEndingDate.toISOString().split('T')[0];
    
    const results = await db.select()
      .from(payrolls)
      .where(eq(payrolls.weekEndingDate, formattedDate));
    
    return results.length ? results[0] : undefined;
  }

  async getLatestFinalizedPayroll(): Promise<Payroll | undefined> {
    const results = await db.select()
      .from(payrolls)
      .where(eq(payrolls.status, "finalized"))
      .orderBy(desc(payrolls.weekEndingDate))
      .limit(1);
    return results.length ? results[0] : undefined;
  }

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const results = await db.insert(payrolls)
      .values({
        ...payroll,
        createdAt: new Date()
      })
      .returning();
    return results[0];
  }

  async updatePayroll(id: number, payroll: UpdatePayroll): Promise<Payroll | undefined> {
    const results = await db.update(payrolls)
      .set(payroll)
      .where(eq(payrolls.id, id))
      .returning();
    return results.length ? results[0] : undefined;
  }

  async deletePayroll(id: number): Promise<boolean> {
    const results = await db.delete(payrolls)
      .where(eq(payrolls.id, id))
      .returning();
    return results.length > 0;
  }
  
  // Summary operations
  async getPayrollSummary(payrollId: number): Promise<PayrollSummary[]> {
    const jobs = await this.getJobsWithPlumberByPayroll(payrollId);
    
    const plumberSummaryMap: Map<number, PayrollSummary> = new Map();
    
    for (const job of jobs) {
      const plumberId = job.plumberId;
      let summary = plumberSummaryMap.get(plumberId);
      
      if (!summary) {
        summary = {
          plumberId,
          plumberName: job.plumber.name,
          jobCount: 0,
          totalRevenue: 0,
          totalCosts: 0,
          totalCommission: 0,
        };
        plumberSummaryMap.set(plumberId, summary);
      }
      
      summary.jobCount += 1;
      summary.totalRevenue += job.revenue;
      summary.totalCosts += (job.partsCost + job.outsideLabor) * 1.25;
      summary.totalCommission += job.commissionAmount;
    }
    
    return Array.from(plumberSummaryMap.values());
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results.length ? results[0] : undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length ? results[0] : undefined;
  }

  async setLoginToken(userId: number, token: string): Promise<void> {
    await db.update(users).set({ loginToken: token }).where(eq(users.id, userId));
  }

  async getUserByLoginToken(token: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.loginToken, token));
    return results.length ? results[0] : undefined;
  }

  async clearLoginToken(token: string): Promise<void> {
    await db.update(users).set({ loginToken: null }).where(eq(users.loginToken, token));
  }
}
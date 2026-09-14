import {
  plumbers, type Plumber, type InsertPlumber, type UpdatePlumber,
  jobs, type Job, type InsertJob, type UpdateJob,
  payrolls, type Payroll, type InsertPayroll, type UpdatePayroll,
  users, type User, type InsertUser,
  type JobWithPlumber, type PayrollSummary
} from "../shared/schema.js";

export interface IStorage {
  // Plumber operations
  getPlumbers(): Promise<Plumber[]>;
  getActivePlumbers(): Promise<Plumber[]>;
  getPlumber(id: number): Promise<Plumber | undefined>;
  createPlumber(plumber: InsertPlumber): Promise<Plumber>;
  updatePlumber(id: number, plumber: UpdatePlumber): Promise<Plumber | undefined>;
  deletePlumber(id: number): Promise<boolean>;

  // Job operations
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  getJobsByPlumber(plumberId: number): Promise<Job[]>;
  getJobsByPayroll(payrollId: number): Promise<Job[]>;
  getJobsWithPlumberByPayroll(payrollId: number): Promise<JobWithPlumber[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: UpdateJob): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Payroll operations
  getPayrolls(): Promise<Payroll[]>;
  getPayroll(id: number): Promise<Payroll | undefined>;
  getCurrentPayroll(): Promise<Payroll>;
  getPayrollByDate(weekEndingDate: Date): Promise<Payroll | undefined>;
  getLatestFinalizedPayroll(): Promise<Payroll | undefined>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, payroll: UpdatePayroll): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<boolean>;
  
  // Summary operations
  getPayrollSummary(payrollId: number): Promise<PayrollSummary[]>;

  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
}

import { PgStorage } from "./pgStorage.js";
export const storage: IStorage = new PgStorage();

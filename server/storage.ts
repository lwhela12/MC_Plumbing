import { 
  plumbers, type Plumber, type InsertPlumber, type UpdatePlumber,
  jobs, type Job, type InsertJob, type UpdateJob,
  payrolls, type Payroll, type InsertPayroll, type UpdatePayroll,
  type JobWithPlumber, type PayrollSummary
} from "@shared/schema";

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
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, payroll: UpdatePayroll): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<boolean>;
  
  // Summary operations
  getPayrollSummary(payrollId: number): Promise<PayrollSummary[]>;
}

export class MemStorage implements IStorage {
  private plumbers: Map<number, Plumber>;
  private jobs: Map<number, Job>;
  private payrolls: Map<number, Payroll>;
  private plumberId: number;
  private jobId: number;
  private payrollId: number;

  constructor() {
    this.plumbers = new Map();
    this.jobs = new Map();
    this.payrolls = new Map();
    this.plumberId = 1;
    this.jobId = 1;
    this.payrollId = 1;
    
    // Initialize with sample data for development
    this.initializeData();
  }

  private initializeData() {
    // Create some initial plumbers
    const plumbers: InsertPlumber[] = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "555-123-4567",
        commissionRate: 30,
        isActive: true,
        startDate: new Date("2022-01-01"),
      },
      {
        name: "Michael Johnson",
        email: "michael.j@example.com",
        phone: "555-234-5678",
        commissionRate: 30,
        isActive: true,
        startDate: new Date("2022-02-15"),
      },
      {
        name: "David Wilson",
        email: "david.w@example.com",
        phone: "555-345-6789",
        commissionRate: 30,
        isActive: true,
        startDate: new Date("2022-03-10"),
      },
      {
        name: "Robert Brown",
        email: "robert.b@example.com",
        phone: "555-456-7890",
        commissionRate: 25,
        isActive: false,
        startDate: new Date("2022-04-05"),
      },
    ];

    plumbers.forEach(plumber => this.createPlumber(plumber));

    // Create current payroll
    const now = new Date();
    const weekEndingDate = new Date(now);
    weekEndingDate.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
    this.createPayroll({
      weekEndingDate,
      status: "draft",
    });

    // Create sample jobs
    const jobs: Omit<InsertJob, "payrollId">[] = [
      {
        date: new Date("2023-05-08"),
        customerName: "Johnson Residence",
        revenue: 850.00,
        partsCost: 250.00,
        outsideLabor: 100.00,
        commissionAmount: 153.75,
        plumberId: 1,
      },
      {
        date: new Date("2023-05-09"),
        customerName: "Smith Office Building",
        revenue: 1200.00,
        partsCost: 350.00,
        outsideLabor: 0.00,
        commissionAmount: 268.75,
        plumberId: 1,
      },
      {
        date: new Date("2023-05-08"),
        customerName: "Adams Home",
        revenue: 750.00,
        partsCost: 200.00,
        outsideLabor: 50.00,
        commissionAmount: 168.75,
        plumberId: 2,
      },
      {
        date: new Date("2023-05-10"),
        customerName: "Wilson Apartment",
        revenue: 550.00,
        partsCost: 150.00,
        outsideLabor: 0.00,
        commissionAmount: 131.25,
        plumberId: 3,
      },
    ];

    jobs.forEach(job => this.createJob({
      ...job,
      payrollId: 1,
    }));
  }

  // Plumber operations
  async getPlumbers(): Promise<Plumber[]> {
    return Array.from(this.plumbers.values());
  }

  async getActivePlumbers(): Promise<Plumber[]> {
    return Array.from(this.plumbers.values()).filter(plumber => plumber.isActive);
  }

  async getPlumber(id: number): Promise<Plumber | undefined> {
    return this.plumbers.get(id);
  }

  async createPlumber(plumber: InsertPlumber): Promise<Plumber> {
    const id = this.plumberId++;
    const newPlumber: Plumber = { ...plumber, id };
    this.plumbers.set(id, newPlumber);
    return newPlumber;
  }

  async updatePlumber(id: number, plumber: UpdatePlumber): Promise<Plumber | undefined> {
    const existingPlumber = this.plumbers.get(id);
    if (!existingPlumber) {
      return undefined;
    }
    const updatedPlumber = { ...existingPlumber, ...plumber };
    this.plumbers.set(id, updatedPlumber);
    return updatedPlumber;
  }

  async deletePlumber(id: number): Promise<boolean> {
    return this.plumbers.delete(id);
  }

  // Job operations
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByPlumber(plumberId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.plumberId === plumberId);
  }

  async getJobsByPayroll(payrollId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.payrollId === payrollId);
  }

  async getJobsWithPlumberByPayroll(payrollId: number): Promise<JobWithPlumber[]> {
    const jobs = await this.getJobsByPayroll(payrollId);
    return await Promise.all(
      jobs.map(async job => {
        const plumber = await this.getPlumber(job.plumberId);
        if (!plumber) {
          throw new Error(`Plumber not found for job ${job.id}`);
        }
        return {
          ...job,
          plumber,
        };
      })
    );
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobId++;
    const newJob: Job = { ...job, id };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: number, job: UpdateJob): Promise<Job | undefined> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) {
      return undefined;
    }
    const updatedJob = { ...existingJob, ...job };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Payroll operations
  async getPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values());
  }

  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }

  async getCurrentPayroll(): Promise<Payroll> {
    // Get the latest payroll or create a new one
    const payrolls = await this.getPayrolls();
    
    if (payrolls.length === 0 || payrolls.every(p => p.status === "finalized")) {
      // Create a new payroll for the current week
      const now = new Date();
      const weekEndingDate = new Date(now);
      weekEndingDate.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);

      return this.createPayroll({
        weekEndingDate,
        status: "draft",
      });
    }

    // Return the latest draft payroll
    const draftPayrolls = payrolls.filter(p => p.status === "draft");
    return draftPayrolls.sort((a, b) => 
      new Date(b.weekEndingDate).getTime() - new Date(a.weekEndingDate).getTime()
    )[0];
  }

  async getPayrollByDate(weekEndingDate: Date): Promise<Payroll | undefined> {
    return Array.from(this.payrolls.values()).find(
      payroll => new Date(payroll.weekEndingDate).toISOString().split('T')[0] === 
                 new Date(weekEndingDate).toISOString().split('T')[0]
    );
  }

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const id = this.payrollId++;
    const newPayroll: Payroll = { 
      ...payroll, 
      id, 
      createdAt: new Date()
    };
    this.payrolls.set(id, newPayroll);
    return newPayroll;
  }

  async updatePayroll(id: number, payroll: UpdatePayroll): Promise<Payroll | undefined> {
    const existingPayroll = this.payrolls.get(id);
    if (!existingPayroll) {
      return undefined;
    }
    const updatedPayroll = { ...existingPayroll, ...payroll };
    this.payrolls.set(id, updatedPayroll);
    return updatedPayroll;
  }

  async deletePayroll(id: number): Promise<boolean> {
    return this.payrolls.delete(id);
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
}

export const storage = new MemStorage();

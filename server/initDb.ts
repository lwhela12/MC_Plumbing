import { db } from "./db";
import { plumbers, jobs, payrolls } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  console.log("Initializing database with sample data...");
  
  try {
    // Create sample plumbers
    const plumberData = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "555-123-4567",
        commissionRate: 30,
        isActive: true,
        startDate: "2022-01-01",
      },
      {
        name: "Michael Johnson",
        email: "michael.j@example.com",
        phone: "555-234-5678",
        commissionRate: 30,
        isActive: true,
        startDate: "2022-02-15",
      },
      {
        name: "David Wilson",
        email: "david.w@example.com",
        phone: "555-345-6789",
        commissionRate: 30,
        isActive: true,
        startDate: "2022-03-10",
      },
      {
        name: "Robert Brown",
        email: "robert.b@example.com",
        phone: "555-456-7890",
        commissionRate: 25,
        isActive: false,
        startDate: "2022-04-05",
      },
    ];
    
    // Insert plumbers
    const plumberResults = await db.insert(plumbers).values(plumberData).returning();
    console.log(`Inserted ${plumberResults.length} plumbers`);
    
    // Create current payroll
    const now = new Date();
    const weekEndingDate = new Date(now);
    weekEndingDate.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
    
    const payrollResults = await db.insert(payrolls).values({
      weekEndingDate: weekEndingDate.toISOString().split('T')[0],
      status: "draft",
    }).returning();
    
    console.log(`Created payroll with ID ${payrollResults[0].id}`);
    
    // Create sample jobs
    const jobData = [
      {
        date: "2023-05-08",
        customerName: "Johnson Residence",
        revenue: 850.00,
        partsCost: 250.00,
        outsideLabor: 100.00,
        commissionAmount: 153.75,
        plumberId: plumberResults[0].id,
        payrollId: payrollResults[0].id,
      },
      {
        date: "2023-05-09",
        customerName: "Smith Office Building",
        revenue: 1200.00,
        partsCost: 350.00,
        outsideLabor: 0.00,
        commissionAmount: 268.75,
        plumberId: plumberResults[0].id,
        payrollId: payrollResults[0].id,
      },
      {
        date: "2023-05-08",
        customerName: "Adams Home",
        revenue: 750.00,
        partsCost: 200.00,
        outsideLabor: 50.00,
        commissionAmount: 168.75,
        plumberId: plumberResults[1].id,
        payrollId: payrollResults[0].id,
      },
      {
        date: "2023-05-10",
        customerName: "Wilson Apartment",
        revenue: 550.00,
        partsCost: 150.00,
        outsideLabor: 0.00,
        commissionAmount: 131.25,
        plumberId: plumberResults[2].id,
        payrollId: payrollResults[0].id,
      },
    ];
    
    const jobResults = await db.insert(jobs).values(jobData).returning();
    console.log(`Inserted ${jobResults.length} jobs`);
    
    console.log("Database initialization complete!");
    
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}
import { db } from "./db";
import { plumbers, jobs, payrolls } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  console.log("Initializing database with sample data...");
  
  try {
    // Initial plumber only
    const plumberData = [
      {
        name: "Lucas Whelan",
        email: "lucas@example.com",
        phone: "555-000-0000",
        commissionRate: 30,
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
      },
    ];

    const plumberResults = await db.insert(plumbers).values(plumberData).returning();
    console.log(`Inserted ${plumberResults.length} plumbers`);

    // No payrolls or jobs seeded. Current payroll will be created on demand
    
    console.log("Database initialization complete!");
    
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://mc_migration@127.0.0.1:55439/mc_test";
const target = new URL(process.env.DATABASE_URL);
if (target.hostname !== "127.0.0.1" || target.pathname !== "/mc_test") throw new Error("Tests require the isolated local mc_test database");
process.env.SESSION_SECRET = "test-only-session-secret-at-least-thirty-two-characters";
process.env.APP_ORIGIN = "http://mc.test";
delete process.env.VERCEL;
const { pool } = await import("../server/db");
const { createApp } = await import("../server/app");
const { hashPassword } = await import("../server/auth");
const { dateOnly } = await import("../shared/schema");

test("persistent, authenticated payroll workflow", async t => {
  await pool.query("ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_plumber_fk; TRUNCATE jobs, payrolls, plumbers, users, sessions, login_rate_limits RESTART IDENTITY CASCADE");
  await pool.query("INSERT INTO users(username,password_hash) VALUES ($1,$2)", ["migration-test", hashPassword("test-password-not-for-production")]);
  await pool.query("INSERT INTO payrolls(week_ending_date,status) VALUES ('2025-06-06','finalized')");
  await pool.query("INSERT INTO jobs(date,customer_name,revenue,parts_cost,outside_labor,commission_amount,plumber_id,payroll_id) VALUES ('2025-06-05','Historical fixture',100,0,0,30,999,1)");
  await pool.query(readFileSync("migrations/001_runtime.sql", "utf8"));
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  let cookie = "";
  const request = (path: string, method = "GET", body?: unknown, overrides: Record<string, string> = {}) => fetch(base + path, { method, headers: { Origin: "http://mc.test", "Content-Type": "application/json", Cookie: cookie, ...overrides }, body: body === undefined ? undefined : JSON.stringify(body) });
  try {
    await t.test("rejects anonymous access, open registration, cross-origin login", async () => {
      for (const route of ["/api/jobs", "/api/payrolls", "/api/plumbers", "/api/export"]) assert.equal((await request(route)).status, 401);
      assert.equal((await request("/api/register", "POST", {})).status, 403);
      assert.equal((await request("/api/login", "POST", {}, { Origin: "https://other.example" })).status, 403);
      assert.equal((await request("/api/login", "POST", { username: "migration-test", password: "wrong" })).status, 401);
    });
    await t.test("login survives independent app instances", async () => {
      const login = await request("/api/login", "POST", { username: "migration-test", password: "test-password-not-for-production" });
      assert.equal(login.status, 200);
      cookie = login.headers.get("set-cookie")!.split(";")[0];
      assert.match(login.headers.get("set-cookie")!, /HttpOnly/);
      const second = createApp().listen(0, "127.0.0.1"); await once(second, "listening");
      try {
        const response = await fetch(`http://127.0.0.1:${(second.address() as {port:number}).port}/api/me`, { headers: { Cookie: cookie } });
        assert.equal(response.status, 200); assert.equal((await response.json()).username, "migration-test");
      } finally { second.close(); }
    });
    await t.test("orphaned historical jobs remain in report totals", async () => {
      const summary = await (await request("/api/payrolls/1/summary")).json();
      assert.equal(summary[0].plumberName, "Missing plumber #999");
      assert.equal(summary[0].totalCommission, 30);
    });
    let plumber: any, payroll: any, job: any;
    await t.test("creates records with unchanged date-only values and server-calculated commission", async () => {
      let response = await request("/api/plumbers", "POST", { name: "Fixture Plumber", email: "fixture@example.com", phone: "555-0100", commissionRate: 30, startDate: "2026-09-14", isActive: true });
      assert.equal(response.status, 201); plumber = await response.json(); assert.equal(plumber.startDate, "2026-09-14");
      response = await request("/api/payrolls", "POST", { weekEndingDate: "2026-09-18" });
      assert.equal(response.status, 201); payroll = await response.json();
      response = await request("/api/jobs", "POST", { date: "2026-09-14", customerName: "Fixture customer", revenue: 1000, partsCost: 100, outsideLabor: 100, plumberId: plumber.id, payrollId: payroll.id, commissionAmount: 999999 });
      assert.equal(response.status, 201); job = await response.json(); assert.equal(job.commissionAmount, 225); assert.equal(job.date, "2026-09-14");
      response = await request(`/api/jobs/${job.id}`, "PATCH", { revenue: 1100 });
      assert.equal(response.status, 200); assert.equal((await response.json()).commissionAmount, 255);
      assert.equal((await request(`/api/jobs/${job.id}`, "PATCH", { date: "2026-02-30" })).status, 400);
      assert.equal(dateOnly.safeParse("2024-02-29").success, true);
      assert.equal(dateOnly.safeParse("2025-02-29").success, false);
    });
    await t.test("finalization prevents writes and archival preserves history", async () => {
      assert.equal((await request(`/api/payrolls/${payroll.id}`, "PATCH", { status: "finalized" })).status, 200);
      assert.equal((await request(`/api/jobs/${job.id}`, "PATCH", { revenue: 1 })).status, 409);
      assert.equal((await request(`/api/jobs/${job.id}`, "DELETE")).status, 409);
      assert.equal((await request(`/api/plumbers/${plumber.id}`, "DELETE")).status, 204);
      const historical = await (await request(`/api/payrolls/${payroll.id}/summary`)).json();
      assert.equal(historical[0].totalCommission, 255);
      assert.equal((await (await request(`/api/plumbers/${plumber.id}`)).json()).isActive, false);
    });
    await t.test("exports all records consistently and rejects expired logout sessions", async () => {
      const exported = await (await request("/api/export")).json();
      assert.equal(exported.data.jobs.length, 2); assert.equal(exported.data.payrolls.length, 2);
      assert.equal((await request("/api/logout", "POST")).status, 200);
      assert.equal((await request("/api/jobs")).status, 401);
    });
    await t.test("login rate limiting persists in PostgreSQL", async () => {
      await pool.query("UPDATE login_rate_limits SET attempts=20, window_start=now()");
      assert.equal((await request("/api/login", "POST", { username: "migration-test", password: "wrong" })).status, 429);
    });
  } finally { server.close(); await pool.end(); }
});

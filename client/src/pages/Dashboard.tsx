import React from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/dashboard/StatCard";
import WeeklySummary from "@/components/dashboard/WeeklySummary";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { formatCurrency } from "@/lib/utils";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { Payroll, PayrollSummary, Plumber, Job } from "@shared/schema";

const Dashboard: React.FC = () => {
  const { data: previousPayroll, isLoading: payrollLoading } = useQuery<Payroll>({
    queryKey: ["/api/payrolls/latest-finalized"],
  });

  const { data: activePlumbers, isLoading: plumbersLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers/active"],
  });

  const { data: payrollJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: [`/api/jobs/payroll/${previousPayroll?.id}`],
    enabled: !!previousPayroll?.id,
  });

  const { data: payrollSummary, isLoading: summaryLoading } = useQuery<PayrollSummary[]>({
    queryKey: [`/api/payrolls/${previousPayroll?.id}/summary`],
    enabled: !!previousPayroll?.id,
  });

  const totalRevenue = payrollJobs?.reduce((sum, job) => sum + job.revenue, 0) || 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-darker">Dashboard</h1>
        <p className="text-sm text-neutral-dark">
          Payroll week ending:{" "}
          <span className="font-medium">
            {payrollLoading
              ? "Loading..."
              : previousPayroll
              ? formatDateForDisplay(previousPayroll.weekEndingDate)
              : "No data"}
          </span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Active Plumbers"
          value={plumbersLoading ? "..." : activePlumbers?.length || 0}
          icon="people"
          color="primary"
        />
        <StatCard
          title="Jobs This Week"
          value={jobsLoading ? "..." : payrollJobs?.length || 0}
          icon="work"
          color="secondary"
        />
        <StatCard
          title="Total Revenue"
          value={jobsLoading ? "..." : formatCurrency(totalRevenue)}
          icon="paid"
          color="secondary"
        />
      </div>

      {/* Weekly Summary */}
      <WeeklySummary
        data={payrollSummary || []}
        isLoading={summaryLoading || !previousPayroll}
        payrollId={previousPayroll?.id}
      />

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;

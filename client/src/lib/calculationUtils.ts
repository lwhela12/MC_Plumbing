import { COST_MARKUP_MULTIPLIER } from "./constants";

/**
 * Calculate commission for a job based on revenue, costs, and commission rate
 */
export function calculateCommission(
  revenue: number,
  partsCost: number,
  outsideLabor: number,
  commissionRate: number
) {
  // Apply markup to costs
  const partsCostWithMarkup = partsCost * COST_MARKUP_MULTIPLIER;
  const outsideLaborWithMarkup = outsideLabor * COST_MARKUP_MULTIPLIER;
  
  // Calculate adjusted costs (parts + outside labor with markup)
  const adjustedCosts = partsCostWithMarkup + outsideLaborWithMarkup;
  
  // Calculate commission base (revenue - adjusted costs, minimum 0)
  const commissionBase = Math.max(0, revenue - adjustedCosts);
  
  // Calculate commission amount based on plumber's commission rate
  const commissionAmount = commissionBase * (commissionRate / 100);
  
  return {
    revenue,
    partsCostWithMarkup,
    outsideLaborWithMarkup,
    adjustedCosts,
    commissionBase,
    commissionAmount,
  };
}

/**
 * Calculate total statistics for an array of jobs
 */
export function calculateJobTotals(jobs: Array<{
  revenue: number;
  partsCost: number;
  outsideLabor: number;
  commissionAmount: number;
}>) {
  return jobs.reduce(
    (acc, job) => {
      acc.totalRevenue += job.revenue;
      acc.totalPartsCost += job.partsCost;
      acc.totalOutsideLabor += job.outsideLabor;
      // Calculate adjusted costs with markup
      acc.totalAdjustedCosts += (job.partsCost + job.outsideLabor) * COST_MARKUP_MULTIPLIER;
      acc.totalCommission += job.commissionAmount;
      return acc;
    },
    {
      totalRevenue: 0,
      totalPartsCost: 0,
      totalOutsideLabor: 0,
      totalAdjustedCosts: 0,
      totalCommission: 0,
    }
  );
}

/**
 * Format a calculation result for display
 */
export function formatCalculationResult(calculation: ReturnType<typeof calculateCommission>) {
  return {
    revenue: `$${calculation.revenue.toFixed(2)}`,
    partsCostWithMarkup: `$${calculation.partsCostWithMarkup.toFixed(2)}`,
    outsideLaborWithMarkup: `$${calculation.outsideLaborWithMarkup.toFixed(2)}`,
    adjustedCosts: `$${calculation.adjustedCosts.toFixed(2)}`,
    commissionBase: `$${calculation.commissionBase.toFixed(2)}`,
    commissionAmount: `$${calculation.commissionAmount.toFixed(2)}`,
  };
}

/**
 * Calculate total statistics for a payroll summary
 */
export function calculatePayrollSummaryTotals(summary: Array<{
  jobCount: number;
  totalRevenue: number;
  totalCosts: number;
  totalCommission: number;
}>) {
  return summary.reduce(
    (acc, item) => {
      acc.jobCount += item.jobCount;
      acc.totalRevenue += item.totalRevenue;
      acc.totalCosts += item.totalCosts;
      acc.totalCommission += item.totalCommission;
      return acc;
    },
    { jobCount: 0, totalRevenue: 0, totalCosts: 0, totalCommission: 0 }
  );
}

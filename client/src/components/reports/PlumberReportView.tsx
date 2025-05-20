import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Job, Payroll, Plumber } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableFooter 
} from "@/components/ui/table";
import { formatDateForDisplay, formatDateDisplay } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/utils";
import { calculateJobTotals } from "@/lib/calculationUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlumberReportViewProps {
  plumberId: number;
  payrollId: number;
}

const PlumberReportView: React.FC<PlumberReportViewProps> = ({ plumberId, payrollId }) => {
  const { data: plumber, isLoading: plumberLoading } = useQuery<Plumber>({
    queryKey: [`/api/plumbers/${plumberId}`],
    enabled: !!plumberId,
  });

  const { data: payroll, isLoading: payrollLoading } = useQuery<Payroll>({
    queryKey: [`/api/payrolls/${payrollId}`],
    enabled: !!payrollId,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: [`/api/jobs/plumber/${plumberId}`, `/api/jobs/payroll/${payrollId}`],
    queryFn: async () => {
      const response = await fetch(`/api/jobs/plumber/${plumberId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const allJobs = await response.json();
      // Filter jobs for this plumber and payroll period
      return allJobs.filter((job: Job) => job.payrollId === payrollId);
    },
    enabled: !!plumberId && !!payrollId,
  });

  if (plumberLoading || payrollLoading || jobsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-neutral-dark">Loading plumber report...</p>
      </div>
    );
  }

  if (!plumber || !payroll) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-dark">Could not find plumber or payroll data.</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-dark">
          No jobs found for {plumber.name} in the payroll period ending {formatDateForDisplay(payroll.weekEndingDate)}.
        </p>
      </div>
    );
  }

  const totals = calculateJobTotals(jobs);

  return (
    <div className="space-y-6 print:space-y-4" id="printable-report">
      <div className="flex justify-between items-start print:mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-darker print:text-2xl">
            Plumber Commission Report
          </h2>
          <p className="text-sm text-neutral-dark">
            Week Ending: {formatDateForDisplay(payroll.weekEndingDate)}
          </p>
          <p className="text-sm text-neutral-dark">
            Status: <span className="font-medium capitalize">{payroll.status}</span>
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-bold text-primary">MC Plumbing</h3>
          <p className="text-sm text-neutral-dark">Commission Calculation Report</p>
          <p className="text-sm text-neutral-dark">Generated: {formatDateForDisplay(new Date())}</p>
        </div>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-2">
          <CardTitle>Plumber Details</CardTitle>
          <CardDescription>
            Personal and commission information for {plumber.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-dark">Contact Information:</h4>
              <p className="text-sm">{plumber.email}</p>
              <p className="text-sm">{plumber.phone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-dark">Commission Details:</h4>
              <p className="text-sm">Rate: {plumber.commissionRate}%</p>
              <p className="text-sm">Status: {plumber.isActive ? "Active" : "Inactive"}</p>
              <p className="text-sm">Start Date: {formatDateForDisplay(plumber.startDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-2">
          <CardTitle>Job Summary</CardTitle>
          <CardDescription>
            Details of all jobs for this payroll period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Parts Cost</TableHead>
                <TableHead className="text-right">Outside Labor</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{formatDateDisplay(job.date)}</TableCell>
                  <TableCell>{job.customerName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(job.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(job.partsCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(job.outsideLabor)}</TableCell>
                  <TableCell className="text-right font-medium text-secondary">
                    {formatCurrency(job.commissionAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.totalRevenue)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.totalPartsCost)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.totalOutsideLabor)}</TableCell>
                <TableCell className="text-right font-bold text-secondary">
                  {formatCurrency(totals.totalCommission)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-2">
          <CardTitle>Commission Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-dark">Total Revenue:</span>
              <span className="text-sm font-medium text-neutral-darker">{formatCurrency(totals.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-dark">Total Parts Cost:</span>
              <span className="text-sm font-medium text-neutral-darker">{formatCurrency(totals.totalPartsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-dark">Total Outside Labor:</span>
              <span className="text-sm font-medium text-neutral-darker">{formatCurrency(totals.totalOutsideLabor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-dark">Total Adjusted Costs (with 25% markup):</span>
              <span className="text-sm font-medium text-neutral-darker">{formatCurrency(totals.totalAdjustedCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-dark">Commission Base:</span>
              <span className="text-sm font-medium text-neutral-darker">
                {formatCurrency(totals.totalRevenue - totals.totalAdjustedCosts)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-dark">
                Commission ({plumber.commissionRate}%):
              </span>
              <span className="text-sm font-medium text-secondary">{formatCurrency(totals.totalCommission)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-t border-neutral pt-4 mt-6 print:mt-8 print:pt-4 text-sm text-neutral-dark">
        <p>This is an official payroll document for MC Plumbing. Authorized by management.</p>
        <p>Plumber Signature: ___________________________ Date: _______________</p>
      </div>
    </div>
  );
};

export default PlumberReportView;

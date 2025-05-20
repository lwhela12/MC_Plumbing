import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Payroll, PayrollSummary } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableFooter 
} from "@/components/ui/table";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/utils";
import { calculatePayrollSummaryTotals } from "@/lib/calculationUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PayrollReportViewProps {
  payrollId: number;
}

const PayrollReportView: React.FC<PayrollReportViewProps> = ({ payrollId }) => {
  const { data: payroll, isLoading: payrollLoading } = useQuery<Payroll>({
    queryKey: [`/api/payrolls/${payrollId}`],
    enabled: !!payrollId,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<PayrollSummary[]>({
    queryKey: [`/api/payrolls/${payrollId}/summary`],
    enabled: !!payrollId,
  });

  if (payrollLoading || summaryLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-neutral-dark">Loading payroll report...</p>
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-dark">Payroll not found.</p>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-dark">No job data available for this payroll period.</p>
      </div>
    );
  }

  const totals = calculatePayrollSummaryTotals(summary);

  return (
    <div className="space-y-6 print:space-y-4" id="printable-report">
      <div className="flex justify-between items-start print:mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-darker print:text-2xl">Weekly Payroll Summary</h2>
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
          <CardTitle>Commission Summary</CardTitle>
          <CardDescription>
            Overview of commissions for all plumbers for this payroll period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plumber</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Adjusted Costs</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((item) => (
                <TableRow key={item.plumberId}>
                  <TableCell className="font-medium">{item.plumberName}</TableCell>
                  <TableCell className="text-right">{item.jobCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalCosts)}</TableCell>
                  <TableCell className="text-right font-medium text-secondary">
                    {formatCurrency(item.totalCommission)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">{totals.jobCount}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.totalRevenue)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.totalCosts)}</TableCell>
                <TableCell className="text-right font-bold text-secondary">
                  {formatCurrency(totals.totalCommission)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-neutral-dark print:mt-4">
        <p className="mb-1">
          <strong>Commission Calculation Formula:</strong>
        </p>
        <p className="mb-1">
          1. Adjusted Costs = (Parts Cost + Outside Labor) × 1.25
        </p>
        <p className="mb-1">
          2. Commission Base = Revenue - Adjusted Costs
        </p>
        <p className="mb-1">
          3. Commission Amount = Commission Base × Plumber's Commission Rate
        </p>
      </div>

      <div className="border-t border-neutral pt-4 mt-6 print:mt-8 print:pt-4 text-sm text-neutral-dark">
        <p>This is an official payroll document for MC Plumbing. Authorized by management.</p>
      </div>
    </div>
  );
};

export default PayrollReportView;

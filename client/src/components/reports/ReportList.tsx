import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Payroll } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { Eye, FileDown } from "lucide-react";
import { Link } from "wouter";

const ReportList: React.FC = () => {
  const { data: payrolls, isLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-neutral-dark">Loading payroll history...</p>
      </div>
    );
  }

  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-dark">No payroll records found.</p>
      </div>
    );
  }

  // Sort payrolls by weekEndingDate (newest first)
  const sortedPayrolls = [...payrolls].sort(
    (a, b) => new Date(b.weekEndingDate).getTime() - new Date(a.weekEndingDate).getTime()
  );

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week Ending Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPayrolls.map((payroll) => (
            <TableRow key={payroll.id}>
              <TableCell className="font-medium">
                {formatDateForDisplay(payroll.weekEndingDate)}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  payroll.status === "finalized"
                    ? "bg-secondary-light bg-opacity-20 text-secondary"
                    : "bg-warning-light bg-opacity-20 text-warning"
                }`}>
                  {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>{formatDateForDisplay(payroll.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <Link to={`/reports?payrollId=${payroll.id}&type=weekly-summary`}>
                    <Eye className="h-4 w-4 text-primary" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // In a real application, this would download a report
                    alert(`Downloading report for week ending ${formatDateForDisplay(payroll.weekEndingDate)}`);
                  }}
                >
                  <FileDown className="h-4 w-4 text-secondary" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReportList;

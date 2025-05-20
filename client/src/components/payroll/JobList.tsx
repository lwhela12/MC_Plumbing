import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Job, Plumber } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { formatDateDisplay } from "@/lib/dateUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface JobListProps {
  payrollId: number;
  plumberId?: number;
  onEditJob: (job: Job) => void;
}

const JobList: React.FC<JobListProps> = ({ payrollId, plumberId, onEditJob }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = plumberId
    ? [`/api/jobs/plumber/${plumberId}`, `/api/jobs/payroll/${payrollId}`]
    : [`/api/jobs/payroll/${payrollId}`];

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey,
    queryFn: async () => {
      const url = plumberId
        ? `/api/jobs/plumber/${plumberId}`
        : `/api/jobs/payroll/${payrollId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const allJobs = await response.json();
      // If plumberId is provided, filter jobs for that plumber only in the current payroll
      return plumberId
        ? allJobs.filter((job: Job) => job.payrollId === payrollId)
        : allJobs;
    },
  });

  const { data: plumbers } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: async () => {
      toast({
        title: "Job deleted successfully",
        variant: "default",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/payroll/${payrollId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${payrollId}/summary`] }),
      ]);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const getPlumberName = (plumberId: number) => {
    if (!plumbers) return "Unknown";
    const plumber = plumbers.find((p) => p.id === plumberId);
    return plumber ? plumber.name : "Unknown";
  };

  const calculateTotals = () => {
    if (!jobs || jobs.length === 0) {
      return {
        revenue: 0,
        partsCost: 0,
        outsideLabor: 0,
        commission: 0,
      };
    }

    return jobs.reduce(
      (acc, job) => {
        acc.revenue += job.revenue;
        acc.partsCost += job.partsCost;
        acc.outsideLabor += job.outsideLabor;
        acc.commission += job.commissionAmount;
        return acc;
      },
      { revenue: 0, partsCost: 0, outsideLabor: 0, commission: 0 }
    );
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="text-neutral-dark">Loading jobs...</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-md font-medium text-neutral-darker mb-3">Jobs Entered This Week</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Customer
              </th>
              {!plumberId && (
                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                  Plumber
                </th>
              )}
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Parts Cost
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Outside Labor
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Commission
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral">
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-light">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-darker">
                    {formatDateDisplay(job.date)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-darker">
                    {job.customerName}
                  </td>
                  {!plumberId && (
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-darker">
                      {getPlumberName(job.plumberId)}
                    </td>
                  )}
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-neutral-darker">
                    {formatCurrency(job.revenue)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-neutral-darker">
                    {formatCurrency(job.partsCost)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-neutral-darker">
                    {formatCurrency(job.outsideLabor)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-secondary">
                    {formatCurrency(job.commissionAmount)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="icon" onClick={() => onEditJob(job)}>
                      <Pencil className="h-4 w-4 text-primary" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this job for {job.customerName}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-error text-white hover:bg-error-dark"
                            onClick={() => handleDelete(job.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={plumberId ? 7 : 8} className="px-4 py-2 text-center text-neutral-dark">
                  No jobs found
                </td>
              </tr>
            )}
          </tbody>
          {jobs && jobs.length > 0 && (
            <tfoot className="bg-neutral-light">
              <tr>
                <td colSpan={plumberId ? 2 : 3} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-neutral-darker">
                  Total
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-neutral-darker">
                  {formatCurrency(totals.revenue)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-neutral-darker">
                  {formatCurrency(totals.partsCost)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-neutral-darker">
                  {formatCurrency(totals.outsideLabor)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-secondary">
                  {formatCurrency(totals.commission)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
};

export default JobList;

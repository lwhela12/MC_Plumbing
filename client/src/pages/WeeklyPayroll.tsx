import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plumber, Job, Payroll } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateForInput } from "@/lib/dateUtils";
import JobForm from "@/components/payroll/JobForm";
import JobList from "@/components/payroll/JobList";
import { Plus } from "lucide-react";
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

const WeeklyPayroll: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlumberId, setSelectedPlumberId] = useState<number | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const { data: currentPayroll, isLoading: payrollLoading } = useQuery<Payroll>({
    queryKey: ["/api/payrolls/current"],
  });

  const { data: plumbers, isLoading: plumbersLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers/active"],
  });

  const finalizePayrollMutation = useMutation({
    mutationFn: async () => {
      if (!currentPayroll) throw new Error("No active payroll");
      return apiRequest("PATCH", `/api/payrolls/${currentPayroll.id}`, {
        status: "finalized",
      });
    },
    onSuccess: async () => {
      toast({
        title: "Payroll finalized successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to finalize payroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!currentPayroll) throw new Error("No active payroll");
      return apiRequest("PATCH", `/api/payrolls/${currentPayroll.id}`, {
        status: "draft",
      });
    },
    onSuccess: async () => {
      toast({
        title: "Payroll saved as draft",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save payroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddJob = () => {
    setEditingJob(null);
    setShowJobForm(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleJobFormSuccess = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleJobFormCancel = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const getSelectedPlumberCommissionRate = () => {
    if (!selectedPlumberId || !plumbers) return "0%";
    const plumber = plumbers.find((p) => p.id === selectedPlumberId);
    return plumber ? `${plumber.commissionRate}%` : "0%";
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-darker">Weekly Payroll Entry</h1>
        <p className="text-sm text-neutral-dark">Enter job details for the current payroll week</p>
      </div>

      {/* Plumber Selection Card */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <h2 className="text-lg font-medium text-neutral-darker mb-4">Select Plumber</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <Label htmlFor="plumber">Plumber</Label>
            <Select
              disabled={plumbersLoading}
              onValueChange={(value) => setSelectedPlumberId(parseInt(value))}
              value={selectedPlumberId?.toString()}
            >
              <SelectTrigger id="plumber">
                <SelectValue placeholder="Select a plumber" />
              </SelectTrigger>
              <SelectContent>
                {plumbers?.map((plumber) => (
                  <SelectItem key={plumber.id} value={plumber.id.toString()}>
                    {plumber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1">
            <Label htmlFor="commission-rate">Commission Rate</Label>
            <Input
              id="commission-rate"
              value={getSelectedPlumberCommissionRate()}
              className="bg-neutral-light"
              readOnly
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor="week-ending">Week Ending</Label>
            <Input
              id="week-ending"
              type="date"
              value={
                payrollLoading || !currentPayroll
                  ? ""
                  : formatDateForInput(new Date(currentPayroll.weekEndingDate))
              }
              readOnly={currentPayroll?.status === "finalized"}
              onChange={async (e) => {
                if (currentPayroll) {
                  try {
                    await apiRequest("PATCH", `/api/payrolls/${currentPayroll.id}`, {
                      weekEndingDate: new Date(e.target.value),
                    });
                    await queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
                  } catch (error) {
                    toast({
                      title: "Failed to update week ending date",
                      variant: "destructive",
                    });
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Job Entry Card */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-neutral-darker">Enter Job Details</h2>
          <Button
            onClick={handleAddJob}
            disabled={!currentPayroll || currentPayroll.status === "finalized"}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Job
          </Button>
        </div>

        {/* Job Entry Form */}
        {showJobForm && currentPayroll && (
          <JobForm
            job={editingJob || undefined}
            payrollId={currentPayroll.id}
            onSuccess={handleJobFormSuccess}
            onCancel={handleJobFormCancel}
          />
        )}

        {/* Job List */}
        {currentPayroll && (
          <JobList
            payrollId={currentPayroll.id}
            plumberId={selectedPlumberId || undefined}
            onEditJob={handleEditJob}
          />
        )}
      </div>

      {/* Action Buttons */}
      {currentPayroll && currentPayroll.status !== "finalized" && (
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={() => saveDraftMutation.mutate()}>
            Save as Draft
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Finalize Payroll</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalize Payroll?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the current payroll as finalized. You won't be able to add or edit jobs after finalizing.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => finalizePayrollMutation.mutate()}>
                  Finalize
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default WeeklyPayroll;

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plumber, Job, Payroll } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateForInput, getEndOfWeek } from "@/lib/dateUtils";
import JobForm from "@/components/payroll/JobForm";
import JobList from "@/components/payroll/JobList";
import JobTableEntry from "@/components/payroll/JobTableEntry";
import JobTableDialog from "@/components/payroll/JobTableDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [entryMode, setEntryMode] = useState<'table' | 'individual'>('table');
  const [selectedPlumber, setSelectedPlumber] = useState<Plumber | null>(null);
  const [plumberJobs, setPlumberJobs] = useState<Job[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);

  const { data: currentPayroll, isLoading: payrollLoading } = useQuery<Payroll>({
    queryKey: ["/api/payrolls/current"],
  });

  const { data: plumbers, isLoading: plumbersLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers/active"],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Get jobs for selected plumber
  useEffect(() => {
    if (jobs && selectedPlumberId && currentPayroll) {
      const filteredJobs = jobs.filter(
        job => job.plumberId === selectedPlumberId && job.payrollId === currentPayroll.id
      );
      setPlumberJobs(filteredJobs);
    } else {
      setPlumberJobs([]);
    }
  }, [jobs, selectedPlumberId, currentPayroll]);

  // Update selected plumber when plumber ID changes
  useEffect(() => {
    if (plumbers && selectedPlumberId) {
      const plumber = plumbers.find(p => p.id === selectedPlumberId);
      setSelectedPlumber(plumber || null);
    } else {
      setSelectedPlumber(null);
    }
  }, [plumbers, selectedPlumberId]);
  
  // Initialize selected date when payroll loads or changes
  useEffect(() => {
    if (currentPayroll) {
      setSelectedDate(formatDateForInput(currentPayroll.weekEndingDate));
    }
  }, [currentPayroll]);

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

  const handleJobsUpdated = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
  };

  const isPayrollReadOnly = !currentPayroll || currentPayroll.status === "finalized";

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
            <div className="relative">
              <select
                disabled={plumbersLoading || isPayrollReadOnly}
                onChange={(e) => setSelectedPlumberId(parseInt(e.target.value))}
                value={selectedPlumberId?.toString() || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="plumber"
              >
                <option value="" disabled>Select a plumber</option>
                {plumbers?.map((plumber) => (
                  <option key={plumber.id} value={plumber.id.toString()}>
                    {plumber.name}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="flex flex-col space-y-2">
              <div className="flex">
                <input
                  id="week-ending-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isPayrollReadOnly || isUpdatingDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!isPayrollReadOnly && (
                  <button
                    type="button"
                    disabled={isUpdatingDate}
                    className={`px-3 py-2 text-white text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isUpdatingDate ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={async () => {
                      if (currentPayroll && selectedDate) {
                        try {
                          setIsUpdatingDate(true);
                          
                          // Use the exact date the user selected without adjustment
                          
                          // Build payload with both status and selected date
                          const payload = {
                            status: currentPayroll.status,
                            weekEndingDate: selectedDate
                          };
                          
                          const result = await apiRequest("PATCH", `/api/payrolls/${currentPayroll.id}`, payload);
                          console.log("Update response:", result);
                          
                          // Force a complete invalidation and refetch
                          await queryClient.invalidateQueries();
                          
                          toast({
                            title: "Week ending date updated successfully",
                            variant: "default",
                          });
                        } catch (error) {
                          console.error("Error updating date:", error);
                          toast({
                            title: "Failed to update week ending date",
                            description: "Please try again",
                            variant: "destructive",
                          });
                        } finally {
                          setIsUpdatingDate(false);
                        }
                      }
                    }}
                  >
                    {isUpdatingDate ? 'Updating...' : 'Update'}
                  </button>
                )}
              </div>
              {selectedDate !== (currentPayroll ? formatDateForInput(currentPayroll.weekEndingDate) : "") && (
                <p className="text-xs text-amber-600">
                  Date change not saved. Click Update to apply.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Entry Tabs */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-neutral-darker">Enter Job Details</h2>
          <Tabs defaultValue="table" onValueChange={(v) => setEntryMode(v as 'table' | 'individual')}>
            <TabsList>
              <TabsTrigger value="table">Table Entry</TabsTrigger>
              <TabsTrigger value="individual">Individual Entry</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table Entry Mode */}
        {entryMode === 'table' && (
          <>
            {selectedPlumber && currentPayroll ? (
              <div className="text-center">
                <Button onClick={() => setTableDialogOpen(true)}>Open Table</Button>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-dark">
                Please select a plumber to enter jobs
              </div>
            )}
          </>
        )}

        {/* Individual Entry Mode */}
        {entryMode === 'individual' && (
          <>
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleAddJob}
                disabled={isPayrollReadOnly}
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
          </>
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

      {selectedPlumber && currentPayroll && (
        <JobTableDialog
          open={tableDialogOpen}
          onOpenChange={setTableDialogOpen}
          payrollId={currentPayroll.id}
          plumber={selectedPlumber}
          jobs={plumberJobs}
          onJobsUpdated={handleJobsUpdated}
        />
      )}
    </div>
  );
};

export default WeeklyPayroll;

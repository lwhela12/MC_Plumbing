import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Job, InsertJob, UpdateJob, JobWithPlumber } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDateForAPI } from "@/lib/dateUtils";
import { calculateCommission } from "@/lib/calculationUtils";

export function useJobs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getJobs = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getJob = (id: number) => {
    return useQuery<Job>({
      queryKey: [`/api/jobs/${id}`],
      enabled: !!id,
    });
  };

  const getJobsByPlumber = (plumberId: number) => {
    return useQuery<Job[]>({
      queryKey: [`/api/jobs/plumber/${plumberId}`],
      enabled: !!plumberId,
    });
  };

  const getJobsByPayroll = (payrollId: number) => {
    return useQuery<Job[]>({
      queryKey: [`/api/jobs/payroll/${payrollId}`],
      enabled: !!payrollId,
    });
  };

  const createJob = useMutation({
    mutationFn: async (data: {
      date: Date;
      customerName: string;
      revenue: number;
      partsCost: number;
      outsideLabor: number;
      plumberId: number;
      payrollId: number;
      commissionRate: number;
    }) => {
      const { date, customerName, revenue, partsCost, outsideLabor, plumberId, payrollId, commissionRate } = data;
      
      // Calculate commission
      const { commissionAmount } = calculateCommission(revenue, partsCost, outsideLabor, commissionRate);
      
      // Create the job data
      const jobData: InsertJob = {
        date,
        customerName,
        revenue,
        partsCost,
        outsideLabor,
        commissionAmount,
        plumberId,
        payrollId,
      };
      
      return apiRequest("POST", "/api/jobs", jobData);
    },
    onSuccess: async (_, variables) => {
      toast({
        title: "Job created successfully",
        variant: "default",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/payroll/${variables.payrollId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/plumber/${variables.plumberId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${variables.payrollId}/summary`] }),
      ]);
    },
    onError: (error) => {
      toast({
        title: "Failed to create job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, data, commissionRate }: { id: number; data: Omit<UpdateJob, 'commissionAmount'>; commissionRate: number }) => {
      const { revenue, partsCost, outsideLabor } = data;
      
      let updatedData: UpdateJob = { ...data };
      
      // If the cost-related fields are updated, recalculate commission
      if (typeof revenue === 'number' && typeof partsCost === 'number' && typeof outsideLabor === 'number') {
        const { commissionAmount } = calculateCommission(revenue, partsCost, outsideLabor, commissionRate);
        updatedData.commissionAmount = commissionAmount;
      }
      
      return apiRequest("PATCH", `/api/jobs/${id}`, updatedData);
    },
    onSuccess: async (_, variables) => {
      toast({
        title: "Job updated successfully",
        variant: "default",
      });
      
      // Get the job to find its payrollId and plumberId
      const job = await queryClient.fetchQuery({
        queryKey: [`/api/jobs/${variables.id}`],
      });
      
      if (job) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }),
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/${variables.id}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/payroll/${job.payrollId}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/plumber/${job.plumberId}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${job.payrollId}/summary`] }),
        ]);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: async (_, id) => {
      toast({
        title: "Job deleted successfully",
        variant: "default",
      });
      
      // Get the job before it was deleted from the cache
      const queryCache = queryClient.getQueryCache();
      const jobQuery = queryCache.find([`/api/jobs/${id}`]);
      const job = jobQuery?.state?.data as Job | undefined;
      
      await queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      
      if (job) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/payroll/${job.payrollId}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/plumber/${job.plumberId}`] }),
          queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${job.payrollId}/summary`] }),
        ]);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to delete job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    getJobs,
    getJob,
    getJobsByPlumber,
    getJobsByPayroll,
    createJob,
    updateJob,
    deleteJob,
  };
}

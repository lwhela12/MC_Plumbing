import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Payroll, InsertPayroll, UpdatePayroll, PayrollSummary } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDateForAPI } from "@/lib/dateUtils";

export function usePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getPayrolls = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  const getCurrentPayroll = useQuery<Payroll>({
    queryKey: ["/api/payrolls/current"],
  });

  const getPayroll = (id: number) => {
    return useQuery<Payroll>({
      queryKey: [`/api/payrolls/${id}`],
      enabled: !!id,
    });
  };

  const getPayrollSummary = (id: number) => {
    return useQuery<PayrollSummary[]>({
      queryKey: [`/api/payrolls/${id}/summary`],
      enabled: !!id,
    });
  };

  const createPayroll = useMutation({
    mutationFn: async (data: InsertPayroll) => {
      return apiRequest("POST", "/api/payrolls", {
        ...data,
        weekEndingDate: formatDateForAPI(data.weekEndingDate),
      });
    },
    onSuccess: async () => {
      toast({
        title: "Payroll created successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create payroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePayroll = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePayroll }) => {
      const formattedData = {
        ...data,
        ...(data.weekEndingDate && { weekEndingDate: formatDateForAPI(data.weekEndingDate) }),
      };
      return apiRequest("PATCH", `/api/payrolls/${id}`, formattedData);
    },
    onSuccess: async () => {
      toast({
        title: "Payroll updated successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/payrolls"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update payroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const finalizePayroll = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/payrolls/${id}`, { status: "finalized" });
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

  const saveDraft = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/payrolls/${id}`, { status: "draft" });
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
        title: "Failed to save payroll as draft",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    getPayrolls,
    getCurrentPayroll,
    getPayroll,
    getPayrollSummary,
    createPayroll,
    updatePayroll,
    finalizePayroll,
    saveDraft,
  };
}

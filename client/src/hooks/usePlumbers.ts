import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plumber, InsertPlumber, UpdatePlumber } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePlumbers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getPlumbers = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers"],
  });

  const getActivePlumbers = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers/active"],
  });

  const getPlumber = (id: number) => {
    return useQuery<Plumber>({
      queryKey: [`/api/plumbers/${id}`],
      enabled: !!id,
    });
  };

  const createPlumber = useMutation({
    mutationFn: async (data: InsertPlumber) => {
      return apiRequest("POST", "/api/plumbers", data);
    },
    onSuccess: async () => {
      toast({
        title: "Plumber created successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/plumbers"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create plumber",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlumber = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePlumber }) => {
      return apiRequest("PATCH", `/api/plumbers/${id}`, data);
    },
    onSuccess: async () => {
      toast({
        title: "Plumber updated successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/plumbers"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update plumber",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlumber = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/plumbers/${id}`);
    },
    onSuccess: async () => {
      toast({
        title: "Plumber deleted successfully",
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/plumbers"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete plumber",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    getPlumbers,
    getActivePlumbers,
    getPlumber,
    createPlumber,
    updatePlumber,
    deletePlumber,
  };
}

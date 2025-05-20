import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plumber, Job, Payroll, jobFormSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatDateForInput } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/utils";
import { calculateCommission } from "@/lib/calculationUtils";

type JobFormValues = {
  date: Date;
  customerName: string;
  revenue: number;
  partsCost: number;
  outsideLabor: number;
  plumberId: number;
};

interface JobFormProps {
  job?: Job;
  payrollId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ job, payrollId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!job;
  const [selectedPlumber, setSelectedPlumber] = useState<Plumber | null>(null);
  const [calculation, setCalculation] = useState({
    revenue: 0,
    partsCostWithMarkup: 0,
    outsideLaborWithMarkup: 0,
    adjustedCosts: 0,
    commissionBase: 0,
    commissionAmount: 0,
  });

  const { data: plumbers, isLoading: plumbersLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers/active"],
  });

  const { data: plumber, isLoading: plumberLoading } = useQuery<Plumber>({
    queryKey: [`/api/plumbers/${job?.plumberId}`],
    enabled: !!job?.plumberId,
  });

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      date: job?.date ? new Date(job.date) : new Date(),
      customerName: job?.customerName || "",
      revenue: job?.revenue || 0,
      partsCost: job?.partsCost || 0,
      outsideLabor: job?.outsideLabor || 0,
      plumberId: job?.plumberId || 0,
    },
  });

  const watchedValues = form.watch();

  // Update calculation when form values change
  useEffect(() => {
    if (selectedPlumber) {
      const { revenue, partsCost, outsideLabor } = watchedValues;
      const commissionRate = selectedPlumber.commissionRate;
      
      const calc = calculateCommission(revenue, partsCost, outsideLabor, commissionRate);
      setCalculation(calc);
    }
  }, [watchedValues, selectedPlumber]);

  // Set selected plumber when editing or when plumber is selected
  useEffect(() => {
    if (plumber) {
      setSelectedPlumber(plumber);
    }
  }, [plumber]);

  const mutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const { plumberId, date, customerName, revenue, partsCost, outsideLabor } = data;
      
      if (!selectedPlumber) {
        throw new Error("No plumber selected");
      }
      
      const commissionRate = selectedPlumber.commissionRate;
      const { commissionAmount } = calculateCommission(revenue, partsCost, outsideLabor, commissionRate);
      
      const jobData = {
        date,
        customerName,
        revenue,
        partsCost,
        outsideLabor,
        commissionAmount,
        plumberId,
        payrollId,
      };
      
      if (isEditing && job) {
        return apiRequest("PATCH", `/api/jobs/${job.id}`, jobData);
      } else {
        return apiRequest("POST", "/api/jobs", jobData);
      }
    },
    onSuccess: async () => {
      toast({
        title: `Job ${isEditing ? "updated" : "created"} successfully`,
        variant: "default",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }),
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/payroll/${payrollId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${payrollId}/summary`] }),
      ]);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} job`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormValues) => {
    mutation.mutate(data);
  };

  const handlePlumberChange = (plumberId: string) => {
    const id = parseInt(plumberId);
    if (plumbers) {
      const plumber = plumbers.find(p => p.id === id);
      setSelectedPlumber(plumber || null);
    }
  };

  if (plumbersLoading || (isEditing && plumberLoading)) {
    return (
      <div className="border border-neutral rounded-md p-4 mb-4">
        <p className="text-neutral-dark">Loading...</p>
      </div>
    );
  }

  return (
    <div className="border border-neutral rounded-md p-4 mb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={formatDateForInput(field.value)}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormField
              control={form.control}
              name="plumberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plumber</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      handlePlumberChange(value);
                    }}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plumber" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plumbers && plumbers.map((plumber) => (
                        <SelectItem key={plumber.id} value={plumber.id.toString()}>
                          {plumber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-neutral-dark">$</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partsCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parts Cost</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-neutral-dark">$</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormField
              control={form.control}
              name="outsideLabor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outside Labor</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-neutral-dark">$</span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 p-4 bg-neutral-light rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-dark">Revenue:</span>
                  <span className="text-sm font-medium text-neutral-darker">{formatCurrency(calculation.revenue)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-dark">Parts Cost (with markup):</span>
                  <span className="text-sm font-medium text-neutral-darker">{formatCurrency(calculation.partsCostWithMarkup)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-dark">Outside Labor (with markup):</span>
                  <span className="text-sm font-medium text-neutral-darker">{formatCurrency(calculation.outsideLaborWithMarkup)}</span>
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-dark">Total Adjusted Costs:</span>
                  <span className="text-sm font-medium text-neutral-darker">{formatCurrency(calculation.adjustedCosts)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-neutral-dark">Commission Base:</span>
                  <span className="text-sm font-medium text-neutral-darker">{formatCurrency(calculation.commissionBase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-dark">
                    Commission ({selectedPlumber?.commissionRate || 0}%):
                  </span>
                  <span className="text-sm font-medium text-secondary">{formatCurrency(calculation.commissionAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedPlumber}>
              {mutation.isPending ? "Saving..." : "Save Job"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default JobForm;

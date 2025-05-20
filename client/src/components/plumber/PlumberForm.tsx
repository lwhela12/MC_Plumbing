import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plumber, plumberFormSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { formatDateForInput } from "@/lib/dateUtils";

type PlumberFormValues = {
  name: string;
  email: string;
  phone: string;
  commissionRate: number;
  isActive: boolean;
  startDate: Date;
};

interface PlumberFormProps {
  plumber?: Plumber;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PlumberForm: React.FC<PlumberFormProps> = ({ plumber, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!plumber;

  const form = useForm<PlumberFormValues>({
    resolver: zodResolver(plumberFormSchema),
    defaultValues: {
      name: plumber?.name || "",
      email: plumber?.email || "",
      phone: plumber?.phone || "",
      commissionRate: plumber?.commissionRate || 30,
      isActive: plumber?.isActive ?? true,
      startDate: plumber?.startDate ? new Date(plumber.startDate) : new Date(),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PlumberFormValues) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/plumbers/${plumber.id}`, data);
      } else {
        return apiRequest("POST", "/api/plumbers", data);
      }
    },
    onSuccess: async () => {
      toast({
        title: `Plumber ${isEditing ? "updated" : "created"} successfully`,
        variant: "default",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/plumbers"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} plumber`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlumberFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6 mb-6">
      <h2 className="text-lg font-medium text-neutral-darker mb-4">
        {isEditing ? "Edit Plumber" : "Add New Plumber"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="commissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="Enter commission rate"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Is this plumber currently active?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
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
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : `Save Plumber`}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PlumberForm;

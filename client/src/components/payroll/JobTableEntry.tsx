import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { calculateCommission } from "@/lib/calculationUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plumber, Job } from "@shared/schema";
import { X, Save, Plus } from "lucide-react";

interface JobRow {
  id?: number;
  date: string;
  customerName: string;
  revenue: string;
  partsCost: string;
  outsideLabor: string;
  isEditing: boolean;
  isNew: boolean;
}

interface JobTableEntryProps {
  payrollId: number;
  plumber: Plumber;
  jobs: Job[];
  onJobsUpdated: () => void;
}

const JobTableEntry: React.FC<JobTableEntryProps> = ({ payrollId, plumber, jobs, onJobsUpdated }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<JobRow[]>([]);
  const [newRowCount, setNewRowCount] = useState(0);

  // Initialize rows from existing jobs
  useEffect(() => {
    if (jobs) {
      const jobRows = jobs.map(job => ({
        id: job.id,
        date: job.date instanceof Date ? job.date.toISOString().split('T')[0] : new Date(job.date).toISOString().split('T')[0],
        customerName: job.customerName,
        revenue: job.revenue.toString(),
        partsCost: job.partsCost.toString(),
        outsideLabor: job.outsideLabor.toString(),
        isEditing: false,
        isNew: false
      }));
      setRows(jobRows);
    }
  }, [jobs]);

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (rowData: JobRow) => {
      const revenue = parseFloat(rowData.revenue) || 0;
      const partsCost = parseFloat(rowData.partsCost) || 0;
      const outsideLabor = parseFloat(rowData.outsideLabor) || 0;
      
      const { commissionAmount } = calculateCommission(
        revenue, 
        partsCost, 
        outsideLabor, 
        plumber.commissionRate
      );
      
      return apiRequest("POST", "/api/jobs", {
        date: new Date(rowData.date),
        customerName: rowData.customerName,
        revenue,
        partsCost,
        outsideLabor,
        commissionAmount,
        plumberId: plumber.id,
        payrollId
      });
    },
    onSuccess: async () => {
      await invalidateQueries();
      onJobsUpdated();
      toast({
        title: "Job created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create job",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, rowData }: { id: number, rowData: JobRow }) => {
      const revenue = parseFloat(rowData.revenue) || 0;
      const partsCost = parseFloat(rowData.partsCost) || 0;
      const outsideLabor = parseFloat(rowData.outsideLabor) || 0;
      
      const { commissionAmount } = calculateCommission(
        revenue, 
        partsCost, 
        outsideLabor, 
        plumber.commissionRate
      );
      
      return apiRequest("PATCH", `/api/jobs/${id}`, {
        date: new Date(rowData.date),
        customerName: rowData.customerName,
        revenue,
        partsCost,
        outsideLabor,
        commissionAmount,
        plumberId: plumber.id,
        payrollId
      });
    },
    onSuccess: async () => {
      await invalidateQueries();
      onJobsUpdated();
      toast({
        title: "Job updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update job",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: async () => {
      await invalidateQueries();
      onJobsUpdated();
      toast({
        title: "Job removed successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove job",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }),
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/payroll/${payrollId}`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/plumber/${plumber.id}`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/payrolls/${payrollId}/summary`] }),
    ]);
  };

  const addNewRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRow: JobRow = {
      date: today,
      customerName: "",
      revenue: "0",
      partsCost: "0",
      outsideLabor: "0",
      isEditing: true,
      isNew: true
    };
    setRows([...rows, newRow]);
    setNewRowCount(prev => prev + 1);
  };

  const handleChange = (index: number, field: keyof JobRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
  };

  const handleSave = async (index: number) => {
    const row = rows[index];
    
    // Basic validation
    if (!row.date || !row.customerName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (row.isNew) {
        await createJobMutation.mutateAsync(row);
      } else if (row.id) {
        await updateJobMutation.mutateAsync({ id: row.id, rowData: row });
      }
      
      const updatedRows = [...rows];
      updatedRows[index] = { ...updatedRows[index], isEditing: false, isNew: false };
      setRows(updatedRows);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (index: number) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], isEditing: true };
    setRows(updatedRows);
  };

  const handleDelete = async (index: number) => {
    const row = rows[index];
    
    if (row.isNew) {
      // Just remove from the UI if it's a new unsaved row
      const updatedRows = [...rows];
      updatedRows.splice(index, 1);
      setRows(updatedRows);
    } else if (row.id) {
      // Delete from database
      try {
        await deleteJobMutation.mutateAsync(row.id);
        const updatedRows = [...rows];
        updatedRows.splice(index, 1);
        setRows(updatedRows);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const calculateRowCommission = (row: JobRow) => {
    const revenue = parseFloat(row.revenue) || 0;
    const partsCost = parseFloat(row.partsCost) || 0;
    const outsideLabor = parseFloat(row.outsideLabor) || 0;
    
    const { commissionAmount } = calculateCommission(
      revenue, 
      partsCost, 
      outsideLabor, 
      plumber.commissionRate
    );
    
    return commissionAmount;
  };

  const calculateTotals = () => {
    return rows.reduce(
      (acc, row) => {
        acc.revenue += parseFloat(row.revenue) || 0;
        acc.partsCost += parseFloat(row.partsCost) || 0;
        acc.outsideLabor += parseFloat(row.outsideLabor) || 0;
        acc.commission += calculateRowCommission(row);
        return acc;
      },
      { revenue: 0, partsCost: 0, outsideLabor: 0, commission: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-md font-medium">Jobs for {plumber.name}</h3>
        <Button onClick={addNewRow} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Job Row
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Customer
              </th>
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
              <th className="px-4 py-2 text-center text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={row.id || `new-${index}`} className={row.isNew ? "bg-neutral-lightest" : "hover:bg-neutral-light"}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {row.isEditing ? (
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleChange(index, 'date', e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      new Date(row.date).toLocaleDateString()
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {row.isEditing ? (
                      <Input
                        type="text"
                        value={row.customerName}
                        onChange={(e) => handleChange(index, 'customerName', e.target.value)}
                        className="w-full"
                        placeholder="Customer name"
                      />
                    ) : (
                      row.customerName
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {row.isEditing ? (
                      <Input
                        type="number"
                        value={row.revenue}
                        onChange={(e) => handleChange(index, 'revenue', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full text-right"
                      />
                    ) : (
                      formatCurrency(parseFloat(row.revenue) || 0)
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {row.isEditing ? (
                      <Input
                        type="number"
                        value={row.partsCost}
                        onChange={(e) => handleChange(index, 'partsCost', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full text-right"
                      />
                    ) : (
                      formatCurrency(parseFloat(row.partsCost) || 0)
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    {row.isEditing ? (
                      <Input
                        type="number"
                        value={row.outsideLabor}
                        onChange={(e) => handleChange(index, 'outsideLabor', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-full text-right"
                      />
                    ) : (
                      formatCurrency(parseFloat(row.outsideLabor) || 0)
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-secondary">
                    {formatCurrency(calculateRowCommission(row))}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    {row.isEditing ? (
                      <div className="flex justify-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleSave(index)}
                          title="Save"
                        >
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(index)}
                          title="Delete"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(index)}
                        title="Edit"
                      >
                        <span className="material-icons text-primary text-sm">edit</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-2 text-center text-neutral-dark">
                  No jobs found. Add a new job row to get started.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-neutral-light">
              <tr>
                <td colSpan={2} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-neutral-darker">
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
      
      {rows.length === 0 && (
        <div className="text-center mt-4">
          <Button onClick={addNewRow} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add First Job
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobTableEntry;
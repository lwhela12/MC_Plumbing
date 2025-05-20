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

// Number of blank rows to show by default
const DEFAULT_BLANK_ROWS = 5;

const JobTableEntry: React.FC<JobTableEntryProps> = ({ payrollId, plumber, jobs, onJobsUpdated }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<JobRow[]>([]);
  const [newRowCount, setNewRowCount] = useState(0);

  // Function to create a new empty row
  const createEmptyRow = (): JobRow => {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      customerName: "",
      revenue: "0",
      partsCost: "0",
      outsideLabor: "0",
      isEditing: true,
      isNew: true
    };
  };

  // Initialize rows from existing jobs and add blank rows
  useEffect(() => {
    if (jobs) {
      // Map existing jobs to row format
      const jobRows = jobs.map(job => ({
        id: job.id,
        date: new Date(job.date).toISOString().split('T')[0],
        customerName: job.customerName,
        revenue: job.revenue.toString(),
        partsCost: job.partsCost.toString(),
        outsideLabor: job.outsideLabor.toString(),
        isEditing: false,
        isNew: false
      }));
      
      // Add blank rows at the end
      const blankRows = Array(DEFAULT_BLANK_ROWS).fill(0).map(() => createEmptyRow());
      
      // Set all rows
      setRows([...jobRows, ...blankRows]);
      setNewRowCount(DEFAULT_BLANK_ROWS);
    } else {
      // If no jobs exist, just create blank rows
      const blankRows = Array(DEFAULT_BLANK_ROWS).fill(0).map(() => createEmptyRow());
      setRows(blankRows);
      setNewRowCount(DEFAULT_BLANK_ROWS);
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
    const newRow = createEmptyRow();
    setRows([...rows, newRow]);
    setNewRowCount(prev => prev + 1);
  };

  const handleChange = (index: number, field: keyof JobRow, value: string) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
    
    // If this is the last blank row, add another blank row
    if (index === rows.length - 1) {
      addNewRow();
    }
  };

  const handleSave = async (index: number) => {
    const row = rows[index];
    
    // Skip empty rows
    if (!row.customerName.trim()) {
      return;
    }
    
    // Basic validation
    if (!row.date) {
      toast({
        title: "Missing information",
        description: "Please fill in a valid date",
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
    
    // If all values are 0, return 0 to avoid showing commission on empty rows
    if (revenue === 0 && partsCost === 0 && outsideLabor === 0 && row.isNew) {
      return 0;
    }
    
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
        // Skip blank rows from totals
        if (!row.customerName.trim() && row.isNew) return acc;
        
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
          Add More Rows
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Customer
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Revenue
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Parts Cost
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Outside Labor
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Commission
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={row.id || `new-${index}`} className={row.isNew ? "bg-gray-50" : "hover:bg-gray-50"}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.isEditing ? (
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleChange(index, 'date', e.target.value)}
                      className="w-full bg-white"
                    />
                  ) : (
                    new Date(row.date).toLocaleDateString()
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {row.isEditing ? (
                    <input
                      type="text"
                      value={row.customerName}
                      onChange={(e) => handleChange(index, 'customerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Customer name"
                      style={{ minWidth: '180px' }}
                    />
                  ) : (
                    row.customerName
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {row.isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.revenue}
                        onChange={(e) => {
                          // Only allow numbers and decimal point
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          handleChange(index, 'revenue', value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ minWidth: '120px' }}
                      />
                    </div>
                  ) : (
                    formatCurrency(parseFloat(row.revenue) || 0)
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {row.isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.partsCost}
                        onChange={(e) => {
                          // Only allow numbers and decimal point
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          handleChange(index, 'partsCost', value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ minWidth: '120px' }}
                      />
                    </div>
                  ) : (
                    formatCurrency(parseFloat(row.partsCost) || 0)
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  {row.isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.outsideLabor}
                        onChange={(e) => {
                          // Only allow numbers and decimal point
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          handleChange(index, 'outsideLabor', value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        style={{ minWidth: '120px' }}
                      />
                    </div>
                  ) : (
                    formatCurrency(parseFloat(row.outsideLabor) || 0)
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right font-medium text-blue-600">
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
                      <span className="material-icons text-blue-600 text-sm">edit</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan={2} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700 border-t">
                Total
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-700 border-t">
                {formatCurrency(totals.revenue)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-700 border-t">
                {formatCurrency(totals.partsCost)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-700 border-t">
                {formatCurrency(totals.outsideLabor)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium text-blue-600 border-t">
                {formatCurrency(totals.commission)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap border-t"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default JobTableEntry;
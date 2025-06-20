import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";
import { Plumber, Job, Payroll } from "@shared/schema";

const DataExport: React.FC = () => {
  const { toast } = useToast();
  
  const { data: plumbers } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers"],
  });
  
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: payrolls } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  const handleExportData = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: {
          plumbers: plumbers || [],
          jobs: jobs || [],
          payrolls: payrolls || []
        }
      };

      const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const fileName = `mc_plumbing_backup_${new Date().toISOString().split('T')[0]}.json`;
      saveAs(dataBlob, fileName);
      
      toast({
        title: "Data exported successfully",
        description: `${fileName} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        // Validate data structure
        if (!importData.data || !importData.data.plumbers || !importData.data.jobs || !importData.data.payrolls) {
          throw new Error("Invalid backup file format");
        }

        // Import plumbers
        for (const plumber of importData.data.plumbers) {
          try {
            await fetch("/api/plumbers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: plumber.name,
                email: plumber.email,
                phone: plumber.phone,
                commissionRate: plumber.commissionRate,
                isActive: plumber.isActive,
                startDate: new Date(plumber.startDate)
              }),
            });
          } catch (error) {
            console.warn("Failed to import plumber:", plumber.name, error);
          }
        }

        // Import payrolls
        for (const payroll of importData.data.payrolls) {
          try {
            await fetch("/api/payrolls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                weekEndingDate: new Date(payroll.weekEndingDate),
                status: payroll.status
              }),
            });
          } catch (error) {
            console.warn("Failed to import payroll:", payroll.weekEndingDate, error);
          }
        }

        // Import jobs
        for (const job of importData.data.jobs) {
          try {
            await fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: new Date(job.date),
                customerName: job.customerName,
                revenue: job.revenue,
                partsCost: job.partsCost,
                outsideLabor: job.outsideLabor,
                commissionAmount: job.commissionAmount,
                plumberId: job.plumberId,
                payrollId: job.payrollId
              }),
            });
          } catch (error) {
            console.warn("Failed to import job:", job.customerName, error);
          }
        }

        toast({
          title: "Data imported successfully",
          description: `Imported ${importData.data.plumbers.length} plumbers, ${importData.data.jobs.length} jobs, and ${importData.data.payrolls.length} payrolls`,
        });

        // Refresh the page to show imported data
        window.location.reload();
        
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to parse or import the backup file",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    // Reset the input
    event.target.value = '';
  };

  const totalItems = (plumbers?.length || 0) + (jobs?.length || 0) + (payrolls?.length || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Backup & Restore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-neutral-dark">
          <p className="mb-2">Current data: {plumbers?.length || 0} plumbers, {jobs?.length || 0} jobs, {payrolls?.length || 0} payrolls</p>
          <p className="text-amber-600 font-medium">
            Note: Data is temporarily stored in memory and will be lost when the server restarts.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleExportData}
            disabled={totalItems === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-file"
            />
            <Button 
              variant="outline"
              className="flex items-center gap-2 w-full"
              asChild
            >
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="h-4 w-4" />
                Import Data
              </label>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;
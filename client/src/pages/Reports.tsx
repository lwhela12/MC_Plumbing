import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Payroll, Plumber, PayrollSummary, Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateForDisplay } from "@/lib/dateUtils";
import { formatCurrency } from "@/lib/utils";
import { Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ReportList from "@/components/reports/ReportList";
import PayrollReportView from "@/components/reports/PayrollReportView";
import PlumberReportView from "@/components/reports/PlumberReportView";
import { REPORT_TYPES } from "@/lib/constants";

const Reports: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>(REPORT_TYPES.WEEKLY_SUMMARY);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [selectedPlumberId, setSelectedPlumberId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: payrolls, isLoading: payrollsLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  const { data: plumbers, isLoading: plumbersLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers"],
  });

  // Fetch payroll summary data when payroll is selected
  const { data: payrollSummary } = useQuery<PayrollSummary[]>({
    queryKey: [`/api/payrolls/${selectedPayrollId}/summary`],
    enabled: !!selectedPayrollId && selectedTab === "weekly-summary",
  });

  // Fetch payroll details
  const { data: selectedPayroll } = useQuery<Payroll>({
    queryKey: [`/api/payrolls/${selectedPayrollId}`],
    enabled: !!selectedPayrollId,
  });

  // Fetch jobs for plumber detail report
  const { data: plumberJobs } = useQuery<Job[]>({
    queryKey: [`/api/jobs/plumber/${selectedPlumberId}`],
    enabled: !!selectedPlumberId && selectedTab === "plumber-detail",
  });

  const handlePrint = () => {
    // Add print-specific styles
    const printStyles = `
      <style>
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          h1, h2, h3 { color: #000; }
          .page-break { page-break-before: always; }
        }
      </style>
    `;
    
    // Add styles to head if not already there
    if (!document.querySelector('#print-styles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'print-styles';
      styleElement.innerHTML = printStyles;
      document.head.appendChild(styleElement);
    }
    
    // Add print-area class to report content
    const reportContent = document.querySelector('.report-content');
    if (reportContent) {
      reportContent.classList.add('print-area');
      setTimeout(() => {
        window.print();
        reportContent.classList.remove('print-area');
      }, 100);
    } else {
      window.print();
    }
  };

  const handleExport = async () => {
    if (!selectedPayrollId) {
      toast({
        title: "Please select a payroll period",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedTab === "weekly-summary" && payrollSummary && selectedPayroll) {
        await exportWeeklySummaryToExcel(payrollSummary, selectedPayroll);
      } else if (selectedTab === "plumber-detail" && plumberJobs && selectedPlumberId) {
        const selectedPlumber = plumbers?.find(p => p.id === selectedPlumberId);
        if (selectedPlumber) {
          await exportPlumberDetailToExcel(plumberJobs, selectedPlumber, selectedPayroll);
        }
      } else if (selectedTab === "payroll-history" && payrolls) {
        await exportPayrollHistoryToExcel(payrolls);
      } else {
        toast({
          title: "No data available to export",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating the Excel file",
        variant: "destructive",
      });
    }
  };

  const exportWeeklySummaryToExcel = async (summary: PayrollSummary[], payroll: Payroll) => {
    const workbook = XLSX.utils.book_new();
    
    // Create summary worksheet
    const summaryData = [
      ['MC Plumbing - Weekly Payroll Summary'],
      [`Week Ending: ${formatDateForDisplay(payroll.weekEndingDate)}`],
      [`Status: ${payroll.status}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Plumber Name', 'Jobs', 'Total Revenue', 'Total Costs', 'Commission'],
      ...summary.map(item => [
        item.plumberName,
        item.jobCount,
        item.totalRevenue,
        item.totalCosts,
        item.totalCommission
      ]),
      [],
      ['TOTALS', 
       summary.reduce((sum, item) => sum + item.jobCount, 0),
       summary.reduce((sum, item) => sum + item.totalRevenue, 0),
       summary.reduce((sum, item) => sum + item.totalCosts, 0),
       summary.reduce((sum, item) => sum + item.totalCommission, 0)
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 20 }, // Plumber Name
      { width: 8 },  // Jobs
      { width: 15 }, // Revenue
      { width: 15 }, // Costs
      { width: 15 }  // Commission
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Summary');
    
    const fileName = `MC_Plumbing_Weekly_Summary_${formatDateForDisplay(payroll.weekEndingDate).replace(/\//g, '-')}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, fileName);
    
    toast({
      title: "Export successful",
      description: `${fileName} has been downloaded`,
    });
  };

  const exportPlumberDetailToExcel = async (jobs: Job[], plumber: Plumber, payroll: Payroll | undefined) => {
    if (!payroll) return;
    
    const workbook = XLSX.utils.book_new();
    
    const jobData = [
      [`MC Plumbing - Plumber Detail Report`],
      [`Plumber: ${plumber.name}`],
      [`Week Ending: ${formatDateForDisplay(payroll.weekEndingDate)}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Date', 'Customer', 'Revenue', 'Parts Cost', 'Outside Labor', 'Total Costs', 'Commission'],
      ...jobs.filter(job => job.payrollId === payroll.id).map(job => {
        const adjustedCosts = (job.partsCost + job.outsideLabor) * 1.25;
        const commissionBase = job.revenue - adjustedCosts;
        const commission = commissionBase * (plumber.commissionRate / 100);
        
        return [
          job.date,
          job.customerName,
          job.revenue,
          job.partsCost,
          job.outsideLabor,
          adjustedCosts,
          Math.max(0, commission)
        ];
      })
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(jobData);
    
    worksheet['!cols'] = [
      { width: 12 }, // Date
      { width: 20 }, // Customer
      { width: 12 }, // Revenue
      { width: 12 }, // Parts Cost
      { width: 12 }, // Outside Labor
      { width: 12 }, // Total Costs
      { width: 12 }  // Commission
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plumber Detail');
    
    const fileName = `MC_Plumbing_${plumber.name.replace(/\s+/g, '_')}_${formatDateForDisplay(payroll.weekEndingDate).replace(/\//g, '-')}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, fileName);
    
    toast({
      title: "Export successful",
      description: `${fileName} has been downloaded`,
    });
  };

  const exportPayrollHistoryToExcel = async (payrollHistory: Payroll[]) => {
    const workbook = XLSX.utils.book_new();
    
    const historyData = [
      ['MC Plumbing - Payroll History'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Week Ending', 'Status', 'Created Date'],
      ...payrollHistory.map(payroll => [
        formatDateForDisplay(payroll.weekEndingDate),
        payroll.status,
        payroll.createdAt ? new Date(payroll.createdAt).toLocaleDateString() : 'N/A'
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(historyData);
    
    worksheet['!cols'] = [
      { width: 15 }, // Week Ending
      { width: 12 }, // Status
      { width: 15 }  // Created Date
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll History');
    
    const fileName = `MC_Plumbing_Payroll_History_${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, fileName);
    
    toast({
      title: "Export successful",
      description: `${fileName} has been downloaded`,
    });
  };

  const renderSelectedReport = () => {
    switch (selectedTab) {
      case "weekly-summary":
        return selectedPayrollId ? (
          <div className="report-content">
            <PayrollReportView payrollId={selectedPayrollId} />
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-dark">
            Please select a payroll period to view the report
          </div>
        );
      case "plumber-detail":
        return selectedPlumberId && selectedPayrollId ? (
          <div className="report-content">
            <PlumberReportView plumberId={selectedPlumberId} payrollId={selectedPayrollId} />
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-dark">
            Please select both a plumber and a payroll period to view the report
          </div>
        );
      case "payroll-history":
        return (
          <div className="report-content">
            <ReportList />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-neutral-darker">Reports</h1>
        <p className="text-sm text-neutral-dark">Generate and view payroll reports</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle>Generate Reports</CardTitle>
            <div className="flex space-x-2 no-print">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                disabled={!selectedPayrollId && selectedTab !== "payroll-history"}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={!selectedPayrollId && selectedTab !== "payroll-history"}
              >
                <Download className="h-4 w-4 mr-1" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value={REPORT_TYPES.WEEKLY_SUMMARY}>Weekly Summary</TabsTrigger>
              <TabsTrigger value={REPORT_TYPES.PLUMBER_DETAIL}>Plumber Detail</TabsTrigger>
              <TabsTrigger value={REPORT_TYPES.PAYROLL_HISTORY}>Payroll History</TabsTrigger>
            </TabsList>

            <TabsContent value={REPORT_TYPES.WEEKLY_SUMMARY}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="payroll-period">Payroll Period</Label>
                  <Select
                    disabled={payrollsLoading || !payrolls?.length}
                    onValueChange={(value) => setSelectedPayrollId(parseInt(value))}
                    value={selectedPayrollId?.toString() || ""}
                  >
                    <SelectTrigger id="payroll-period">
                      <SelectValue placeholder="Select a payroll period" />
                    </SelectTrigger>
                    <SelectContent>
                      {payrolls?.map((payroll) => (
                        <SelectItem key={payroll.id} value={payroll.id.toString()}>
                          Week Ending: {formatDateForDisplay(payroll.weekEndingDate)} ({payroll.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value={REPORT_TYPES.PLUMBER_DETAIL}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="plumber">Plumber</Label>
                  <Select
                    disabled={plumbersLoading || !plumbers?.length}
                    onValueChange={(value) => setSelectedPlumberId(parseInt(value))}
                    value={selectedPlumberId?.toString() || ""}
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
                <div>
                  <Label htmlFor="payroll-period-plumber">Payroll Period</Label>
                  <Select
                    disabled={payrollsLoading || !payrolls?.length}
                    onValueChange={(value) => setSelectedPayrollId(parseInt(value))}
                    value={selectedPayrollId?.toString() || ""}
                  >
                    <SelectTrigger id="payroll-period-plumber">
                      <SelectValue placeholder="Select a payroll period" />
                    </SelectTrigger>
                    <SelectContent>
                      {payrolls?.map((payroll) => (
                        <SelectItem key={payroll.id} value={payroll.id.toString()}>
                          Week Ending: {formatDateForDisplay(payroll.weekEndingDate)} ({payroll.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value={REPORT_TYPES.PAYROLL_HISTORY}>
              <div className="text-sm text-neutral-dark mb-4">
                View history of all payroll periods and their status.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Report View</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {renderSelectedReport()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

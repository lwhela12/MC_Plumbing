import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Payroll, Plumber } from "@shared/schema";
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
import { Download, Printer } from "lucide-react";
import ReportList from "@/components/reports/ReportList";
import PayrollReportView from "@/components/reports/PayrollReportView";
import PlumberReportView from "@/components/reports/PlumberReportView";
import { REPORT_TYPES } from "@/lib/constants";

const Reports: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(REPORT_TYPES.WEEKLY_SUMMARY);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [selectedPlumberId, setSelectedPlumberId] = useState<number | null>(null);

  const { data: payrolls, isLoading: payrollsLoading } = useQuery<Payroll[]>({
    queryKey: ["/api/payrolls"],
  });

  const { data: plumbers, isLoading: plumbersLoading } = useQuery<Plumber[]>({
    queryKey: ["/api/plumbers"],
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // In a real application, this would generate a CSV or PDF file
    alert("Export functionality would be implemented here");
  };

  const renderSelectedReport = () => {
    switch (selectedTab) {
      case REPORT_TYPES.WEEKLY_SUMMARY:
        return selectedPayrollId ? (
          <PayrollReportView payrollId={selectedPayrollId} />
        ) : (
          <div className="p-8 text-center text-neutral-dark">
            Please select a payroll period to view the report
          </div>
        );
      case REPORT_TYPES.PLUMBER_DETAIL:
        return selectedPlumberId && selectedPayrollId ? (
          <PlumberReportView plumberId={selectedPlumberId} payrollId={selectedPayrollId} />
        ) : (
          <div className="p-8 text-center text-neutral-dark">
            Please select both a plumber and a payroll period to view the report
          </div>
        );
      case REPORT_TYPES.PAYROLL_HISTORY:
        return <ReportList />;
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
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
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

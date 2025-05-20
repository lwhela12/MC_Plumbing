import React from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PayrollSummary } from "@shared/schema";

interface WeeklySummaryProps {
  data: PayrollSummary[];
  isLoading: boolean;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-neutral-darker">Weekly Summary</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <p className="text-neutral-dark">Loading summary data...</p>
        </div>
      </div>
    );
  }

  const totals = data.reduce(
    (acc, item) => {
      acc.jobCount += item.jobCount;
      acc.totalRevenue += item.totalRevenue;
      acc.totalCosts += item.totalCosts;
      acc.totalCommission += item.totalCommission;
      return acc;
    },
    { jobCount: 0, totalRevenue: 0, totalCosts: 0, totalCommission: 0 }
  );

  return (
    <div className="bg-white rounded-lg shadow-card p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-neutral-darker">Weekly Summary</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Plumber
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Jobs
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Costs
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-darker uppercase tracking-wider">
                Commission
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral">
            {data.map((item) => (
              <tr key={item.plumberId} className="hover:bg-neutral-light">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-neutral-darker">{item.plumberName}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-darker">
                  {item.jobCount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-darker">
                  {formatCurrency(item.totalRevenue)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-neutral-darker">
                  {formatCurrency(item.totalCosts)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-secondary">
                  {formatCurrency(item.totalCommission)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-light">
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-darker">
                Total
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-neutral-darker">
                {totals.jobCount}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-neutral-darker">
                {formatCurrency(totals.totalRevenue)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-neutral-darker">
                {formatCurrency(totals.totalCosts)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-secondary">
                {formatCurrency(totals.totalCommission)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default WeeklySummary;

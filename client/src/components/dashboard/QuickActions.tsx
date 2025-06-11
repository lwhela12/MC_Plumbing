import React from "react";
import { Link } from "wouter";

const QuickActions: React.FC = () => {
  const handlePrintCommissionForm = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(getCommissionFormHTML());
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const getCommissionFormHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MC Plumbing - Commission Tracker</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0.5in;
            color: #000;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 5px;
          }
          .form-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
          }
          .info-box {
            flex: 1;
            margin-right: 20px;
          }
          .info-box:last-child {
            margin-right: 0;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .info-line {
            border-bottom: 1px solid #000;
            height: 20px;
            margin-bottom: 10px;
          }
          .jobs-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .jobs-table th,
          .jobs-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .jobs-table th {
            background-color: #1976d2;
            color: white;
            font-weight: bold;
            text-align: center;
          }
          .jobs-table td {
            height: 25px;
          }
          .summary-section {
            margin-top: 30px;
            padding: 15px;
            border: 2px solid #1976d2;
            background-color: #f9f9f9;
          }
          .summary-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            color: #1976d2;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          .summary-label {
            font-weight: bold;
            flex: 1;
          }
          .summary-value {
            width: 150px;
            border-bottom: 1px solid #000;
            text-align: right;
          }
          .instructions {
            margin-top: 20px;
            padding: 10px;
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
          }
          .instructions-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .instructions ul {
            margin: 0;
            padding-left: 20px;
          }
          .instructions li {
            margin-bottom: 5px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">MC PLUMBING</div>
          <div class="form-title">WEEKLY COMMISSION TRACKER</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="info-label">Plumber Name:</div>
            <div class="info-line"></div>
          </div>
          <div class="info-box">
            <div class="info-label">Week Ending Date:</div>
            <div class="info-line"></div>
          </div>
          <div class="info-box">
            <div class="info-label">Commission Rate:</div>
            <div class="info-line"></div>
          </div>
        </div>

        <table class="jobs-table">
          <thead>
            <tr>
              <th style="width: 12%;">Date</th>
              <th style="width: 25%;">Customer Name</th>
              <th style="width: 15%;">Total Revenue</th>
              <th style="width: 15%;">Parts Cost</th>
              <th style="width: 15%;">Outside Labor</th>
              <th style="width: 18%;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 20 }, (_, i) => `
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-title">WEEKLY TOTALS</div>
          <div class="summary-row">
            <span class="summary-label">Total Jobs:</span>
            <span class="summary-value"></span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Revenue:</span>
            <span class="summary-value">$</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Parts Cost:</span>
            <span class="summary-value">$</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Outside Labor:</span>
            <span class="summary-value">$</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total Adjusted Costs (Cost × 1.25):</span>
            <span class="summary-value">$</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Commission Base (Revenue - Adjusted Costs):</span>
            <span class="summary-value">$</span>
          </div>
          <div class="summary-row" style="border-top: 2px solid #1976d2; padding-top: 10px; margin-top: 10px;">
            <span class="summary-label" style="font-size: 14px;">TOTAL COMMISSION EARNED:</span>
            <span class="summary-value" style="font-size: 14px; font-weight: bold;">$</span>
          </div>
        </div>

        <div class="instructions">
          <div class="instructions-title">INSTRUCTIONS:</div>
          <ul>
            <li>Fill out one row for each job completed during the week</li>
            <li>Include ALL costs for parts and outside labor</li>
            <li>Revenue should be the total amount charged to the customer</li>
            <li>Parts cost includes all materials purchased for the job</li>
            <li>Outside labor includes any subcontractor or helper costs</li>
            <li>Commission is calculated on revenue minus adjusted costs (costs × 1.25)</li>
            <li>Submit this form to the office by Monday following the week ending date</li>
          </ul>
        </div>

        <div class="footer">
          <p>MC Plumbing Commission Tracker - Generated ${new Date().toLocaleDateString()}</p>
          <p>Plumber Signature: _________________________ Date: _____________</p>
        </div>
      </body>
      </html>
    `;
  };

  type ActionItem = {
    label: string;
    icon: string;
    path?: string;
    action?: () => void;
    special?: boolean;
  };

  const actions: ActionItem[] = [
    { label: "New Payroll Entry", icon: "add_circle", path: "/weekly-payroll" },
    { label: "Add Plumber", icon: "person_add", path: "/plumbers" },
    { label: "Generate Reports", icon: "assessment", path: "/reports" },
    { label: "View History", icon: "history", path: "/reports" },
    { 
      label: "Print Commission Form", 
      icon: "print", 
      action: handlePrintCommissionForm,
      special: true 
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h2 className="text-lg font-medium text-neutral-darker mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          if (action.special && action.action) {
            return (
              <button
                key={action.label}
                onClick={action.action}
                className="flex flex-col items-center justify-center p-4 border border-neutral rounded-lg hover:bg-neutral-light transition-colors cursor-pointer"
              >
                <span className="material-icons text-primary mb-2">{action.icon}</span>
                <span className="text-sm font-medium text-neutral-darker">{action.label}</span>
              </button>
            );
          }
          
          if (action.path) {
            return (
              <Link
                key={action.label}
                href={action.path}
                className="flex flex-col items-center justify-center p-4 border border-neutral rounded-lg hover:bg-neutral-light transition-colors"
              >
                <span className="material-icons text-primary mb-2">{action.icon}</span>
                <span className="text-sm font-medium text-neutral-darker">{action.label}</span>
              </Link>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
};

export default QuickActions;

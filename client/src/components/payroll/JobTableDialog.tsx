import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import JobTableEntry from "./JobTableEntry";
import { Job, Plumber } from "@shared/schema";
import { exportToCsv } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payrollId: number;
  plumber: Plumber;
  jobs: Job[];
  onJobsUpdated: () => void;
}

const JobTableDialog: React.FC<Props> = ({ open, onOpenChange, payrollId, plumber, jobs, onJobsUpdated }) => {
  const handleExport = () => {
    const rows = jobs.map(j => [j.date, j.customerName, j.revenue, j.partsCost, j.outsideLabor, j.commissionAmount]);
    exportToCsv(`jobs-${plumber.name}.csv`, [["Date","Customer","Revenue","Parts","Labor","Commission"], ...rows]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-lg h-[90vh] overflow-auto bg-white border-none">
        <DialogHeader>
          <DialogTitle>Jobs for {plumber.name}</DialogTitle>
        </DialogHeader>
        <JobTableEntry payrollId={payrollId} plumber={plumber} jobs={jobs} onJobsUpdated={onJobsUpdated} />
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handlePrint}>Export PDF</Button>
          <Button variant="outline" onClick={handleExport}>Export Excel</Button>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobTableDialog;

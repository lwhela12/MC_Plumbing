import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from "file-saver";

export default function DataExport() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const download = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/export", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to export records");
      saveAs(await response.blob(), `mc_plumbing_backup_${new Date().toISOString().slice(0, 10)}.json`);
      toast({ title: "Records exported" });
    } catch (error) { toast({ title: "Export failed", description: (error as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  };
  return <Card><CardHeader><CardTitle>Data Backup</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Download all plumbers, jobs, and payroll periods. Contact your administrator to restore a backup.</p>
    <Button onClick={download} disabled={busy}><Download className="mr-2 h-4 w-4" />{busy ? "Exporting…" : "Export records"}</Button>
  </CardContent></Card>;
}

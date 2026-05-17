import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDSR, updateDSR } from "@/lib/platform/store";

export const Route = createFileRoute("/admin/dsr")({
  head: () => ({ meta: [{ title: "DSR queue · Admin" }, { name: "robots", content: "noindex" }] }),
  component: DSRAdmin,
});

const TONE = {
  open: "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-rose-500/10 text-rose-600",
} as const;

function DSRAdmin() {
  const dsr = useDSR();

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> DSR queue</h1>
        <p className="text-sm text-muted-foreground">GDPR žiadosti · SLA 30 dní · {dsr.filter((d) => d.status !== "completed").length} otvorených</p>
      </div>
      <Card><CardHeader><CardTitle>Žiadosti</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {dsr.map((d) => {
            const daysLeft = Math.floor((new Date(d.sla_due_at).getTime() - Date.now()) / 86400000);
            return (
              <div key={d.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{d.requester_email} <Badge variant="outline" className="ml-1">{d.type}</Badge></p>
                  <p className="text-xs text-muted-foreground">{d.note}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> SLA: {daysLeft >= 0 ? `${daysLeft} dní ostáva` : `meškanie ${Math.abs(daysLeft)} dní`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={TONE[d.status]}>{d.status}</Badge>
                  {d.status !== "completed" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { updateDSR(d.id, "in_progress"); toast.success("Označené ako vybavované"); }}>Vybavujem</Button>
                      <Button size="sm" onClick={() => { updateDSR(d.id, "completed"); toast.success("Uzavreté"); }}>Uzavrieť</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

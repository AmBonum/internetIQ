import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAudit } from "@/lib/platform/store";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit log · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuditPage,
});

function AuditPage() {
  const audit = useAudit();
  const [q, setQ] = useState("");
  const list = audit.filter((a) => !q || a.action.includes(q) || a.actor_name.toLowerCase().includes(q.toLowerCase()) || a.details.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><FileText className="h-6 w-6" /> Audit log</h1>
      <Card><CardContent className="p-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Hľadať akciu, aktora..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>{list.length} záznamov</CardTitle></CardHeader>
        <CardContent className="divide-y text-sm">
          {list.slice(0, 80).map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 py-2">
              <div className="min-w-0">
                <p className="font-medium flex items-center gap-2">
                  {a.pii_access && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  <code className="text-xs">{a.action}</code>
                  <span className="text-muted-foreground">· {a.actor_name}</span>
                </p>
                <p className="text-xs text-muted-foreground">{a.details}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="outline" className="text-[10px]">{a.target_type}</Badge>
                <p className="mt-1 text-[10px] text-muted-foreground">{new Date(a.at).toLocaleString("sk-SK")}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

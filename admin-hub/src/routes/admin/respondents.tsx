import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Search, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRespondents, useSessions, logPiiAccess } from "@/lib/platform/store";

export const Route = createFileRoute("/admin/respondents")({
  head: () => ({ meta: [{ title: "Respondenti · Admin" }, { name: "robots", content: "noindex" }] }),
  component: RespondentsAdmin,
});

function RespondentsAdmin() {
  const respondents = useRespondents();
  const sessions = useSessions();
  const [q, setQ] = useState("");
  const list = respondents.filter((r) => !q || (r.email?.includes(q) ?? false) || (r.display_name?.toLowerCase().includes(q.toLowerCase()) ?? false));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="h-6 w-6" /> Respondenti</h1>
        <p className="text-sm text-muted-foreground">{respondents.length} respondentov · prístup k PII sa loguje.</p>
      </div>
      <Card><CardContent className="p-3">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Hľadať e-mail / meno..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </CardContent></Card>
      <Card><CardContent className="divide-y text-sm">
        {list.slice(0, 60).map((r) => {
          const count = sessions.filter((s) => s.respondent_id === r.id).length;
          return (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{r.display_name ?? "Anonym"} {r.anonymized_at && <Badge variant="outline" className="ml-1">anonymizovaný</Badge>}</p>
                <p className="text-xs text-muted-foreground">{r.email ?? "—"} · {count} sedení</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { logPiiAccess(r.id, "Admin otvoril detail respondenta"); toast.success("Prístup k PII zalogovaný"); }}>
                <Eye className="mr-2 h-4 w-4" /> Detail
              </Button>
            </div>
          );
        })}
      </CardContent></Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { History, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessions, getTest, currentUser } from "@/lib/platform/store";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "Moja história · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const me = currentUser();
  const sessions = useSessions().filter((s) => s.intake_data.if_email === me.email).slice(0, 20);
  // pre demo: ak nemám žiadne, vezmem prvých 8 sessions ako "moje"
  const list = sessions.length ? sessions : useSessions().slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aktivita"
        title="Moja história"
        accentWords={1}
        icon={History}
        subtitle="Tvoje vlastné sedenia ako respondenta — môžeš porovnať skóre v čase."
      />
      <div className="space-y-2">
        {list.map((s) => {
          const t = getTest(s.test_id);
          return (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{t?.title ?? "Test"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.started_at).toLocaleString("sk-SK")} · stav: <Badge variant="outline">{s.status}</Badge></p>
                </div>
                <div className="flex items-center gap-4">
                  {s.score !== null && <span className="text-2xl font-semibold">{s.score}%</span>}
                  <Button variant="outline" size="sm" onClick={() => toast.success("Výsledky odoslané emailom")}>
                    <Mail className="mr-2 h-4 w-4" /> Poslať mailom
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

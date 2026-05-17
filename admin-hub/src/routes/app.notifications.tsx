import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/platform/store";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifikácie · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

const TYPE_TONE = {
  new_respondent: "bg-emerald-500/10 text-emerald-600",
  milestone: "bg-blue-500/10 text-blue-600",
  anomaly: "bg-amber-500/10 text-amber-600",
  expiry: "bg-rose-500/10 text-rose-600",
  daily_summary: "bg-muted text-foreground",
} as const;

function NotificationsPage() {
  const notifs = useNotifications();
  const unread = notifs.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Upozornenia"
        title="Notifikácie"
        accentWords={1}
        icon={Bell}
        subtitle={`${unread} neprečítaných`}
        actions={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Označiť všetky ako prečítané
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-2">
        {notifs.map((n) => (
          <Card key={n.id} className={`border-border/60 ${!n.read_at ? "bg-primary/5" : ""}`}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={TYPE_TONE[n.event_type]}>{n.event_type}</Badge>
                  <span className="font-medium text-sm">{n.title}</span>
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("sk-SK")}</p>
              </div>
              {!n.read_at && (
                <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>Prečítané</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

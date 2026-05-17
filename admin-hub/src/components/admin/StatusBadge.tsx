import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, { label: string; className: string }> = {
  // questions
  published: { label: "Publikované", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Čaká", className: "bg-warning/10 text-warning border-warning/20" },
  flagged: { label: "Nahlásené", className: "bg-destructive/10 text-destructive border-destructive/20" },
  archived: { label: "Archivované", className: "bg-muted text-muted-foreground border-border" },
  draft: { label: "Koncept", className: "bg-warning/10 text-warning border-warning/20" },
  // users
  active: { label: "Aktívny", className: "bg-success/10 text-success border-success/20" },
  suspended: { label: "Pozastavený", className: "bg-destructive/10 text-destructive border-destructive/20" },
  // reports
  open: { label: "Otvorený", className: "bg-destructive/10 text-destructive border-destructive/20" },
  reviewing: { label: "Posudzuje sa", className: "bg-warning/10 text-warning border-warning/20" },
  resolved: { label: "Vyriešené", className: "bg-success/10 text-success border-success/20" },
  dismissed: { label: "Zamietnuté", className: "bg-muted text-muted-foreground border-border" },
  // roles
  admin: { label: "Admin", className: "bg-primary/10 text-primary border-primary/20" },
  moderator: { label: "Moderátor", className: "bg-accent text-accent-foreground border-accent" },
  user: { label: "Používateľ", className: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ status }: { status: string }) {
  const item = map[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={cn("font-medium", item.className)}>
      {item.label}
    </Badge>
  );
}

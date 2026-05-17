import { Link, useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";
import {
  LayoutDashboard, FilePlus2, Library, Users, Bell, History, BookOpen,
  Shield, FileText, LogOut, Sparkles, ListChecks, Layers, ClipboardList, UsersRound, UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, useNotifications } from "@/lib/platform/store";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; badge?: boolean };
const NAV: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/tests", label: "Moje testy", icon: ClipboardList },
  { to: "/app/tests/new", label: "Nový test", icon: FilePlus2 },
  { to: "/app/templates", label: "Šablóny", icon: Layers },
  { to: "/app/library", label: "Knižnica otázok", icon: Library },
  { to: "/app/audiences", label: "Skupiny respondentov", icon: UsersRound },
  { to: "/app/teams", label: "Tímy a roly", icon: Users },
  { to: "/app/notifications", label: "Notifikácie", icon: Bell, badge: true },
  { to: "/app/history", label: "Moja história", icon: History },
  { to: "/app/help", label: "Help centrum", icon: BookOpen },
  { to: "/docs", label: "Dokumentácia", icon: FileText },
  { to: "/app/account/profile", label: "Môj profil", icon: UserCog },
  { to: "/app/account/security", label: "Bezpečnosť účtu", icon: Shield },
  { to: "/app/legal/dsr", label: "GDPR žiadosť", icon: FileText },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const me = useCurrentUser();
  const notifs = useNotifications();
  const unread = notifs.filter((n) => !n.read_at).length;

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <header className="border-b border-border/40 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            SubenAI · Workspace
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {me.avatar_initials}
              </span>
              <span className="hidden sm:inline">{me.display_name}</span>
            </div>
            <Link to="/login" className="text-muted-foreground hover:text-foreground" aria-label="Odhlásiť sa">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-6 space-y-1">
            {NAV.map((n) => {
              const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {n.label}
                  </span>
                  {n.badge && unread > 0 && (
                    <Badge className="h-5 px-1.5 text-[10px]">{unread}</Badge>
                  )}
                </Link>
              );
            })}
            <div className="pt-4 text-xs text-muted-foreground">
              <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                <ListChecks className="h-4 w-4" /> Admin platformy
              </Link>
            </div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

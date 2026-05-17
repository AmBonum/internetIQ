import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquareText,
  Users,
  FolderTree,
  Flag,
  Settings,
  Sparkles,
  LogOut,
  GraduationCap,
  Library,
  ClipboardList,
  Share2,
  Zap,
  Heart,
  FileText,
  Navigation,
  PanelTop,
  PanelBottom,
  BookOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  { title: "Prehľad", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Testy", url: "/admin/tests", icon: ClipboardList },
  { title: "Rýchly test", url: "/admin/quick-test", icon: Zap },
  { title: "Share karta", url: "/admin/share-card", icon: Share2 },
  { title: "Otázky", url: "/admin/questions", icon: MessageSquareText },
  { title: "Sady odpovedí", url: "/admin/answer-sets", icon: Library },
  { title: "Školenia", url: "/admin/trainings", icon: GraduationCap },
  { title: "Používatelia", url: "/admin/users", icon: Users },
  { title: "Kategórie", url: "/admin/categories", icon: FolderTree },
  { title: "Reporty", url: "/admin/reports", icon: Flag, badge: "3" },
  { title: "Podpora", url: "/admin/support", icon: Heart },
];

const cmsItems = [
  { title: "Podstránky", url: "/admin/pages", icon: FileText },
  { title: "Navigácia", url: "/admin/navigation", icon: Navigation },
  { title: "Hlavička", url: "/admin/header", icon: PanelTop },
  { title: "Päta", url: "/admin/footer", icon: PanelBottom },
];

const systemItems = [
  { title: "Dokumentácia", url: "/docs", icon: BookOpen },
  { title: "Nastavenia", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">SubenAI</span>
            <span className="text-xs text-sidebar-foreground/60">Admin Console</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hlavné</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Obsah webu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cmsItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Systém</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Účet">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">JH</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-left text-xs group-data-[collapsible=icon]:hidden">
                <span className="font-medium text-sidebar-foreground">Jana Horváthová</span>
                <span className="text-sidebar-foreground/60">admin@subenai.sk</span>
              </div>
              <LogOut className="h-4 w-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

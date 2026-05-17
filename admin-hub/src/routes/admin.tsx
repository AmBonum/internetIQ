import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("subenai.isAdmin") !== "1") {
      throw redirect({ to: "/admin-login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin · SubenAI" },
      { name: "description", content: "Administračné rozhranie pre SubenAI." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="relative hidden flex-1 max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať otázky, používateľov..."
                className="h-9 border-border/60 bg-muted/40 pl-9 focus-visible:bg-background"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/">Späť na web</Link>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>
  );
}

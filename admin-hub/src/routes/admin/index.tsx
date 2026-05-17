import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import {
  Users,
  MessageSquareText,
  Flag,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  activityData,
  categoryDistribution,
  dashboardStats,
  mockQuestions,
  mockUsers,
} from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

function initials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

function DashboardPage() {
  const recentQuestions = mockQuestions.slice(0, 5);
  const recentUsers = mockUsers.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prehľad"
        description="Zhrnutie aktivity, kľúčové metriky a najnovšie udalosti na platforme."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Používatelia" value={dashboardStats.total_users} delta={12} icon={Users} tone="primary" />
        <StatCard label="Aktívni (7d)" value={dashboardStats.active_users_7d} delta={4} icon={Activity} tone="success" />
        <StatCard label="Otázky" value={dashboardStats.total_questions} delta={8} icon={MessageSquareText} tone="primary" />
        <StatCard label="Otvorené reporty" value={dashboardStats.open_reports} delta={-15} icon={Flag} tone="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Aktivita za 14 dní</CardTitle>
              <CardDescription>Otázky, odpovede a noví používatelia</CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
              <TrendingUp className="h-3 w-3" /> +18%
            </div>
          </CardHeader>
          <CardContent>
            <ClientOnly fallback={<div className="h-[280px] animate-pulse rounded-md bg-muted/30" />}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="qFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.52 0.22 275)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.52 0.22 275)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.18 200)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.68 0.18 200)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.025 265)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.025 265)" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="questions" name="Otázky" stroke="oklch(0.52 0.22 275)" strokeWidth={2} fill="url(#qFill)" />
                <Area type="monotone" dataKey="answers" name="Odpovede" stroke="oklch(0.68 0.18 200)" strokeWidth={2} fill="url(#aFill)" />
              </AreaChart>
            </ResponsiveContainer>
            </ClientOnly>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Kategórie</CardTitle>
            <CardDescription>Rozdelenie otázok</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientOnly fallback={<div className="h-[240px] animate-pulse rounded-md bg-muted/30" />}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {categoryDistribution.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
            </ClientOnly>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Najnovšie otázky</CardTitle>
            <CardDescription>Posledné príspevky čakajúce na pozornosť</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Otázka</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuestions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <p className="line-clamp-1 text-sm font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">{q.author_name} · {q.categories.join(", ")}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={q.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Noví používatelia</CardTitle>
            <CardDescription>Posledné registrácie</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Používateľ</TableHead>
                  <TableHead className="w-[110px]">Rola</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(u.display_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{u.display_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={u.role} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

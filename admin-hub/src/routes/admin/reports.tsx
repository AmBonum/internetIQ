import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminRepo, useAdminState } from "@/lib/admin/store";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

const reasonLabel: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Nevhodný obsah",
  harassment: "Obťažovanie",
  misinformation: "Dezinformácie",
  other: "Iné",
};

function ReportsPage() {
  const reports = useAdminState((s) => s.reports);
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? reports : reports.filter(r => r.status === tab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporty"
        description="Spravujte nahlásenia obsahu a používateľov."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Všetky ({reports.length})</TabsTrigger>
          <TabsTrigger value="open">Otvorené</TabsTrigger>
          <TabsTrigger value="reviewing">Posudzuje sa</TabsTrigger>
          <TabsTrigger value="resolved">Vyriešené</TabsTrigger>
          <TabsTrigger value="dismissed">Zamietnuté</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Nahlásený obsah</TableHead>
                <TableHead>Dôvod</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nahlásil</TableHead>
                <TableHead>Dátum</TableHead>
                <TableHead className="text-right">Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-md">
                    <p className="line-clamp-1 text-sm font-medium">{r.target_label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.target_type} · {r.target_id}</p>
                  </TableCell>
                  <TableCell><span className="text-sm">{reasonLabel[r.reason]}</span></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{r.reporter_name}</span></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("sk-SK")}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { adminRepo.reports.update(r.id, { status: "reviewing" }); toast.info("Posudzuje sa"); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-success"
                        onClick={() => { adminRepo.reports.update(r.id, { status: "resolved" }); toast.success("Vyriešené"); }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => { adminRepo.reports.update(r.id, { status: "dismissed" }); toast("Zamietnuté"); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Žiadne reporty</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

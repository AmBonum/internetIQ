import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Clock, Target, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TestEditor } from "@/components/admin/TestEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BRANCHES, branchLabel, type AdminTest } from "@/lib/admin-mock-data";
import { adminRepo, useAdminState } from "@/lib/admin/store";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export const Route = createFileRoute("/admin/tests")({
  component: TestsPage,
});

const difficultyLabel: Record<string, string> = {
  easy: "Ľahká",
  medium: "Stredná",
  hard: "Ťažká",
};

function TestsPage() {
  const tests = useAdminState((s) => s.tests);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminTest | null>(null);

  const filtered = useMemo(() => {
    return tests.filter((t: AdminTest) => {
      if (category !== "all" && !t.categories.includes(category)) return false;
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [tests, query, category]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testy"
        description="Spravujte všetky testy, ich otázky a nastavenia (zobrazené na subenai.sk/testy)."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/quick-test">
                <Target className="mr-2 h-4 w-4" />
                Rýchly test
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/share-card">
                <ExternalLink className="mr-2 h-4 w-4" />
                Share karta
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nový test
            </Button>
          </>
        }
      />

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Hľadať test..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-[220px]">
                <SelectValue placeholder="Branža" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky branže</SelectItem>
                {BRANCHES.map((b) => (
                  <SelectItem key={b.slug} value={b.slug}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Test</TableHead>
                  <TableHead>Branža</TableHead>
                  <TableHead>Otázky</TableHead>
                  <TableHead>Obťažnosť</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pokusy</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: AdminTest) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-1 text-sm font-medium">{t.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {t.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {t.time_limit_min} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Target className="h-3 w-3" /> {t.pass_score}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.categories.map((c) => (
                          <Badge key={c} variant="secondary" className="font-normal">
                            {branchLabel(c)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.question_ids.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {difficultyLabel[t.difficulty]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {t.attempts.toLocaleString("sk-SK")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/admin/tests/$testId" params={{ testId: t.id }}>
                            Otázky
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(t);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setConfirmDelete(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Žiadne testy
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TestEditor open={editorOpen} onOpenChange={setEditorOpen} test={editing} />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Vymazať test?"
        description={confirmDelete ? `Test „${confirmDelete.title}" bude nenávratne odstránený.` : ""}
        confirmLabel="Vymazať"
        destructive
        onConfirm={() => {
          if (confirmDelete) {
            adminRepo.tests.remove(confirmDelete.id);
            toast.success("Test vymazaný");
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}

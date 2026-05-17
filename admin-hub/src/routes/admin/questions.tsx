import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Download,
  Filter,
  MessageSquare,
  ThumbsUp,
  Flag,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRANCHES, branchLabel, type AdminQuestion } from "@/lib/admin-mock-data";
import { adminRepo, useAdminState } from "@/lib/admin/store";
import { exportToCSV } from "@/lib/admin/export";

export const Route = createFileRoute("/admin/questions")({
  component: QuestionsPage,
});

const PAGE_SIZE = 25;

function QuestionsPage() {
  const questions = useAdminState((s) => s.questions);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [minVotes, setMinVotes] = useState(-50);
  const [reportedOnly, setReportedOnly] = useState(false);
  const [author, setAuthor] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    description?: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const authors = useMemo(
    () => Array.from(new Set(questions.map((q) => q.author_name))).sort(),
    [questions],
  );

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (status !== "all" && q.status !== status) return false;
      if (category !== "all" && !q.categories.includes(category)) return false;
      if (author !== "all" && q.author_name !== author) return false;
      if (q.votes < minVotes) return false;
      if (reportedOnly && q.reports_count === 0) return false;
      if (query && !q.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [questions, query, status, category, author, minVotes, reportedOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const allSelected = paged.length > 0 && paged.every((q) => selected.has(q.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) paged.forEach((q) => next.delete(q.id));
    else paged.forEach((q) => next.add(q.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const clearSelection = () => setSelected(new Set());

  const handleSave = (data: Partial<AdminQuestion>) => {
    if (editing) {
      adminRepo.questions.update(editing.id, data);
      toast.success("Otázka uložená");
    } else {
      adminRepo.questions.create(data);
      toast.success("Otázka vytvorená");
    }
  };

  const askBulk = (
    label: string,
    fn: () => void,
    destructive?: boolean,
  ) =>
    setConfirm({
      open: true,
      title: `${label} ${selected.size} otázok?`,
      description: "Akciu nemožno automaticky vrátiť.",
      destructive,
      onConfirm: () => {
        fn();
        clearSelection();
        toast.success(`${label} dokončené`);
      },
    });

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
    setCategory("all");
    setAuthor("all");
    setMinVotes(-50);
    setReportedOnly(false);
    setPage(1);
  };

  const doExport = () => {
    exportToCSV(
      filtered,
      [
        { key: "id", label: "ID" },
        { key: "title", label: "Otázka" },
        { key: "categories", label: "Branže" },
        { key: "status", label: "Status" },
        { key: "author_name", label: "Autor" },
        { key: "votes", label: "Hlasy" },
        { key: "answers_count", label: "Odpovede" },
        { key: "reports_count", label: "Reporty" },
        { key: "created_at", label: "Vytvorené" },
      ],
      `otazky-${new Date().toISOString().slice(0, 10)}`,
    );
    toast.success(`Exportovaných ${filtered.length} otázok`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Otázky"
        description="Spravujte všetky otázky vytvorené používateľmi platformy."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={doExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nová otázka
            </Button>
          </>
        }
      />

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Hľadať podľa názvu..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-xs"
            />
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky statusy</SelectItem>
                <SelectItem value="published">Publikované</SelectItem>
                <SelectItem value="pending">Čakajúce</SelectItem>
                <SelectItem value="flagged">Nahlásené</SelectItem>
                <SelectItem value="archived">Archivované</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-[200px]">
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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Viac filtrov
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Autor</Label>
                  <Select value={author} onValueChange={setAuthor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetci autori</SelectItem>
                      {authors.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Minimálne hlasy: {minVotes}</Label>
                  <Slider
                    min={-50}
                    max={200}
                    step={5}
                    value={[minVotes]}
                    onValueChange={(v) => setMinVotes(v[0])}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={reportedOnly}
                    onCheckedChange={(v) => setReportedOnly(Boolean(v))}
                  />
                  Iba nahlásené (s reportami)
                </label>
                <Button size="sm" variant="outline" className="w-full" onClick={resetFilters}>
                  <X className="mr-2 h-3 w-3" /> Vyčistiť filtre
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <span className="font-medium text-primary">{selected.size} vybraných</span>
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    askBulk("Publikovať", () =>
                      adminRepo.questions.bulkUpdate([...selected], { status: "published" }),
                    )
                  }
                >
                  Publikovať
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    askBulk("Archivovať", () =>
                      adminRepo.questions.bulkUpdate([...selected], { status: "archived" }),
                    )
                  }
                >
                  Archivovať
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    askBulk(
                      "Vymazať",
                      () => adminRepo.questions.bulkRemove([...selected]),
                      true,
                    )
                  }
                >
                  Vymazať
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[40px]">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Otázka</TableHead>
                  <TableHead>Branža</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktivita</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((q) => (
                  <TableRow key={q.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selected.has(q.id)}
                        onCheckedChange={() => toggleOne(q.id)}
                      />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">
                        {q.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {q.author_name} · {new Date(q.created_at).toLocaleDateString("sk-SK")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {q.categories.map((c) => (
                          <span
                            key={c}
                            className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {branchLabel(c)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={q.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {q.answers_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {q.votes}
                        </span>
                        {q.reports_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <Flag className="h-3 w-3" />
                            {q.reports_count}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(q);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akcie</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(q);
                                setEditorOpen(true);
                              }}
                            >
                              Upraviť
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                adminRepo.questions.update(q.id, { status: "published" });
                                toast.success("Publikované");
                              }}
                            >
                              Publikovať
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                adminRepo.questions.update(q.id, { status: "archived" });
                                toast.success("Archivované");
                              }}
                            >
                              Archivovať
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard?.writeText(q.id);
                                toast.success("ID skopírované");
                              }}
                            >
                              Kopírovať ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  title: "Vymazať otázku?",
                                  description: q.title,
                                  destructive: true,
                                  onConfirm: () => {
                                    adminRepo.questions.remove(q.id);
                                    toast.success("Otázka vymazaná");
                                  },
                                })
                              }
                            >
                              Vymazať
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      Žiadne výsledky
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Zobrazených {paged.length} z {filtered.length} (celkom {questions.length})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Predchádzajúca
              </Button>
              <span>
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Ďalšia
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuestionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        question={editing}
        onSave={handleSave}
      />

      {confirm && (
        <ConfirmDialog
          open={confirm.open}
          onOpenChange={(o) => setConfirm((c) => (c ? { ...c, open: o } : null))}
          title={confirm.title}
          description={confirm.description}
          destructive={confirm.destructive}
          onConfirm={confirm.onConfirm}
        />
      )}
    </div>
  );
}

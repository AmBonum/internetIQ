import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Library, Check, X, ArrowRight, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { AnswerSetEditor } from "@/components/admin/AnswerSetEditor";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  branchLabel,
  questionsUsingSet,
  type AdminAnswerSet,
} from "@/lib/admin-mock-data";
import {
  deleteAnswerSet,
  duplicateAnswerSet,
  useAnswers,
  useAnswerSets,
} from "@/lib/admin/answer-sets-store";

export const Route = createFileRoute("/admin/answer-sets")({
  component: AnswerSetsPage,
});

function AnswerSetsPage() {
  const allSets = useAnswerSets();
  const allAnswers = useAnswers();
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnswerSet | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminAnswerSet | null>(null);

  const sets = useMemo(
    () =>
      allSets.filter((s) =>
        query ? s.name.toLowerCase().includes(query.toLowerCase()) : true,
      ),
    [allSets, query],
  );

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (s: AdminAnswerSet) => {
    setEditing(s);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sady odpovedí"
        description="Spravujte zdieľané sady správnych a nesprávnych odpovedí pre otázky."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nová sada
          </Button>
        }
      />

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hľadať sadu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sets.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Žiadne sady. Vytvorte prvú kliknutím na „Nová sada".
          </p>
        )}
        {sets.map((s) => {
          const answers = allAnswers.filter((a) => a.set_id === s.id);
          const correct = answers.filter((a) => a.is_correct).length;
          const incorrect = answers.length - correct;
          const usage = questionsUsingSet(s.id).length;
          return (
            <Card
              key={s.id}
              className="group flex flex-col border-border/60 shadow-[var(--shadow-card)] transition hover:border-primary/40"
            >
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Library className="h-4 w-4" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(s)}>Upraviť</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const c = duplicateAnswerSet(s.id);
                          if (c) toast.success(`Duplikované: ${c.name}`);
                        }}
                      >
                        Duplikovať
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setConfirmDelete(s)}
                      >
                        Vymazať
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <h3 className="font-semibold leading-tight text-foreground">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {s.categories.map((c) => (
                    <Badge key={c} variant="secondary">{branchLabel(c)}</Badge>
                  ))}
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                    <Check className="mr-1 h-3 w-3" />
                    {correct} správnych
                  </Badge>
                  <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <X className="mr-1 h-3 w-3" />
                    {incorrect} nesprávnych
                  </Badge>
                  <Badge variant="outline">{usage} otázok</Badge>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Upraviť
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin/answer-sets/$setId" params={{ setId: s.id }}>
                      Detail
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AnswerSetEditor open={editorOpen} onOpenChange={setEditorOpen} set={editing} />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Vymazať sadu odpovedí?"
        description={
          confirmDelete
            ? `Sada „${confirmDelete.name}" a všetky jej odpovede budú nenávratne odstránené.`
            : ""
        }
          confirmLabel="Vymazať"
          destructive
        onConfirm={() => {
          if (confirmDelete) {
            deleteAnswerSet(confirmDelete.id);
            toast.success("Sada vymazaná");
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}

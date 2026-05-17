import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { QuestionEditor } from "@/components/admin/QuestionEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  branchLabel,
  mockQuestions,
  mockTests,
  mockQuickTest,
  type AdminQuestion,
} from "@/lib/admin-mock-data";

export const Route = createFileRoute("/admin/tests/$testId")({
  component: TestDetailPage,
});

function TestDetailPage() {
  const { testId } = useParams({ from: "/admin/tests/$testId" });
  const test = useMemo(
    () => [...mockTests, mockQuickTest].find((t) => t.id === testId),
    [testId],
  );

  const [questionIds, setQuestionIds] = useState<string[]>(test?.question_ids ?? []);
  const [adding, setAdding] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);

  if (!test) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/tests">
            <ArrowLeft className="mr-2 h-4 w-4" /> Späť na testy
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Test sa nenašiel.</p>
      </div>
    );
  }

  const questions = questionIds
    .map((id) => mockQuestions.find((q) => q.id === id))
    .filter((q): q is AdminQuestion => !!q);

  const availableToAdd = mockQuestions.filter((q) => !questionIds.includes(q.id));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...questionIds];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setQuestionIds(next);
  };

  const remove = (id: string) =>
    setQuestionIds((prev) => prev.filter((x) => x !== id));

  const add = () => {
    if (!adding) return;
    setQuestionIds((prev) => [...prev, adding]);
    setAdding("");
    toast.success("Otázka pridaná do testu");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/admin/tests">
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na testy
        </Link>
      </Button>

      <PageHeader
        title={test.title}
        description={`${test.categories.map(branchLabel).join(", ")} · ${test.time_limit_min} min · pass ${test.pass_score}%`}
        actions={
          <>
            <StatusBadge status={test.status} />
            <Button size="sm" onClick={() => toast.success("Poradie uložené")}>
              <Save className="mr-2 h-4 w-4" />
              Uložiť poradie
            </Button>
          </>
        }
      />

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={adding} onValueChange={setAdding}>
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="Pridať existujúcu otázku..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title}
                  </SelectItem>
                ))}
                {availableToAdd.length === 0 && (
                  <div className="p-2 text-xs text-muted-foreground">
                    Všetky otázky sú už v teste
                  </div>
                )}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={add} disabled={!adding}>
              <Plus className="mr-2 h-4 w-4" />
              Pridať
            </Button>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Vytvoriť novú otázku
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3"
              >
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Posunúť hore"
                  >
                    ▲
                  </button>
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={() => move(idx, 1)}
                    disabled={idx === questions.length - 1}
                    aria-label="Posunúť dole"
                  >
                    ▼
                  </button>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{q.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {q.categories.map((c) => (
                      <Badge key={c} variant="outline">{branchLabel(c)}</Badge>
                    ))}
                    <span>
                      ✓ {q.correct_answer_ids.length} správnych · ✗{" "}
                      {q.incorrect_answer_ids.length} nesprávnych
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(q.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Test zatiaľ nemá žiadne otázky.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <QuestionEditor open={editorOpen} onOpenChange={setEditorOpen} question={editing} />
    </div>
  );
}

import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Check, X, Pencil, Trash2, MessageSquareText, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { AnswerEditor, AnswerSetEditor } from "@/components/admin/AnswerSetEditor";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  branchLabel,
  mockAnswerSets,
  questionsUsingAnswer,
  questionsUsingSet,
  type AdminAnswer,
} from "@/lib/admin-mock-data";
import {
  deleteAnswer,
  deleteAnswerSet,
  useAnswers,
  useAnswerSets,
} from "@/lib/admin/answer-sets-store";

export const Route = createFileRoute("/admin/answer-sets/$setId")({
  component: AnswerSetDetailPage,
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">
      Sada nebola nájdená.{" "}
      <Link to="/admin/answer-sets" className="text-primary underline">
        Späť na zoznam
      </Link>
    </div>
  ),
  loader: ({ params }) => {
    // Validate at load time using the seed list (the live store always contains seeds + edits).
    const exists =
      mockAnswerSets.some((s) => s.id === params.setId) || params.setId.startsWith("as_");
    if (!exists) throw notFound();
    return { setId: params.setId };
  },
});

function AnswerSetDetailPage() {
  const { setId } = Route.useLoaderData();
  const router = useRouter();
  const sets = useAnswerSets();
  const allAnswers = useAnswers();

  const set = useMemo(() => sets.find((s) => s.id === setId), [sets, setId]);
  const answers = useMemo(
    () => allAnswers.filter((a) => a.set_id === setId),
    [allAnswers, setId],
  );

  const [answerEditorOpen, setAnswerEditorOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<AdminAnswer | null>(null);
  const [setEditorOpen, setSetEditorOpen] = useState(false);
  const [confirmDeleteAnswer, setConfirmDeleteAnswer] = useState<AdminAnswer | null>(null);
  const [confirmDeleteSet, setConfirmDeleteSet] = useState(false);

  if (!set) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Sada bola odstránená.{" "}
        <Link to="/admin/answer-sets" className="text-primary underline">
          Späť na zoznam
        </Link>
      </div>
    );
  }

  const correct = answers.filter((a) => a.is_correct);
  const incorrect = answers.filter((a) => !a.is_correct);
  const linkedQuestions = questionsUsingSet(set.id);

  const openCreate = () => {
    setEditingAnswer(null);
    setAnswerEditorOpen(true);
  };
  const openEdit = (a: AdminAnswer) => {
    setEditingAnswer(a);
    setAnswerEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/admin/answer-sets">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Sady odpovedí
          </Link>
        </Button>
        <PageHeader
          title={set.name}
          description={set.description}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setSetEditorOpen(true)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Upraviť sadu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDeleteSet(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vymazať
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Pridať odpoveď
              </Button>
            </>
          }
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {set.categories.map((c) => (
            <Badge key={c} variant="secondary">{branchLabel(c)}</Badge>
          ))}
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
            {correct.length} správnych
          </Badge>
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
            {incorrect.length} nesprávnych
          </Badge>
          <Badge variant="outline">{linkedQuestions.length} otázok</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnswerColumn
          tone="correct"
          title="Správne odpovede"
          answers={correct}
          onEdit={openEdit}
          onDelete={setConfirmDeleteAnswer}
        />
        <AnswerColumn
          tone="incorrect"
          title="Nesprávne odpovede"
          answers={incorrect}
          onEdit={openEdit}
          onDelete={setConfirmDeleteAnswer}
        />
      </div>

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Použitie v otázkach</CardTitle>
        </CardHeader>
        <CardContent>
          {linkedQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sada zatiaľ nie je priradená k žiadnej otázke.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {linkedQuestions.map((q) => (
                <div key={q.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">{q.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {q.categories.map(branchLabel).join(", ")} ·{" "}
                      <span className="text-emerald-600">{q.correct_answer_ids.length} správnych</span> ·{" "}
                      <span className="text-destructive">{q.incorrect_answer_ids.length} nesprávnych</span>
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin/questions">
                      <MessageSquareText className="mr-1.5 h-3.5 w-3.5" />
                      Otvoriť
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AnswerEditor
        open={answerEditorOpen}
        onOpenChange={setAnswerEditorOpen}
        setId={set.id}
        initial={editingAnswer}
      />

      <AnswerSetEditor open={setEditorOpen} onOpenChange={setSetEditorOpen} set={set} />

      <ConfirmDialog
        open={!!confirmDeleteAnswer}
        onOpenChange={(o) => !o && setConfirmDeleteAnswer(null)}
        title="Vymazať odpoveď?"
        description={
          confirmDeleteAnswer
            ? `„${confirmDeleteAnswer.text}" bude odstránená zo sady.`
            : ""
        }
        confirmLabel="Vymazať"
        destructive
        onConfirm={() => {
          if (confirmDeleteAnswer) {
            deleteAnswer(confirmDeleteAnswer.id);
            toast.success("Odpoveď vymazaná");
            setConfirmDeleteAnswer(null);
          }
        }}
      />

      <ConfirmDialog
        open={confirmDeleteSet}
        onOpenChange={setConfirmDeleteSet}
        title="Vymazať celú sadu?"
        description={`Sada „${set.name}" a všetky jej odpovede budú nenávratne odstránené.`}
        confirmLabel="Vymazať sadu"
        destructive
        onConfirm={() => {
          deleteAnswerSet(set.id);
          toast.success("Sada vymazaná");
          router.navigate({ to: "/admin/answer-sets" });
        }}
      />
    </div>
  );
}

function AnswerColumn({
  tone,
  title,
  answers,
  onEdit,
  onDelete,
}: {
  tone: "correct" | "incorrect";
  title: string;
  answers: AdminAnswer[];
  onEdit: (a: AdminAnswer) => void;
  onDelete: (a: AdminAnswer) => void;
}) {
  const Icon = tone === "correct" ? Check : X;
  const accent =
    tone === "correct"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-destructive/30 bg-destructive/5";
  const iconColor = tone === "correct" ? "text-emerald-600" : "text-destructive";

  return (
    <Card className="border-border/60 shadow-[var(--shadow-card)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {answers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {answers.length === 0 && (
          <p className="text-sm text-muted-foreground">Žiadne odpovede.</p>
        )}
        {answers.map((a) => {
          const usage = questionsUsingAnswer(a.id);
          return (
            <div key={a.id} className={`group rounded-lg border p-3 ${accent}`}>
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{a.text}</p>
                  {a.explanation && (
                    <p className="mt-1 text-xs text-muted-foreground">{a.explanation}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      Použitá v {usage.length} otázkach
                    </Badge>
                    {usage.slice(0, 2).map((q) => (
                      <Badge key={q.id} variant="secondary" className="max-w-[200px] truncate text-[10px]">
                        {q.title}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

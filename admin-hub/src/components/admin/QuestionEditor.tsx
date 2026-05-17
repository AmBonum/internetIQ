import { useEffect, useMemo, useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockAnswerSets,
  answersForSet,
  type AdminQuestion,
  type QuestionStatus,
} from "@/lib/admin-mock-data";
import { AiQuestionGenerator } from "@/components/admin/AiQuestionGenerator";
import { CategoryMultiSelect } from "@/components/admin/CategoryMultiSelect";

export interface QuestionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: AdminQuestion | null;
  onSave?: (data: Partial<AdminQuestion>) => void;
}

const empty = {
  title: "",
  excerpt: "",
  body: "",
  categories: [] as string[],
  status: "pending" as QuestionStatus,
  answer_set_id: mockAnswerSets[0]?.id ?? "",
  correct_answer_ids: [] as string[],
  incorrect_answer_ids: [] as string[],
};

export function QuestionEditor({ open, onOpenChange, question, onSave }: QuestionEditorProps) {
  const [form, setForm] = useState(empty);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        question
          ? {
              title: question.title,
              excerpt: question.excerpt,
              body: question.body ?? "",
              categories: [...question.categories],
              status: question.status,
              answer_set_id: question.answer_set_id ?? mockAnswerSets[0]?.id ?? "",
              correct_answer_ids: [...question.correct_answer_ids],
              incorrect_answer_ids: [...question.incorrect_answer_ids],
            }
          : empty,
      );
    }
  }, [open, question]);

  const isEdit = Boolean(question);

  const setAnswers = useMemo(
    () => (form.answer_set_id ? answersForSet(form.answer_set_id) : []),
    [form.answer_set_id],
  );
  const correctPool = setAnswers.filter((a) => a.is_correct);
  const incorrectPool = setAnswers.filter((a) => !a.is_correct);

  const toggleAnswer = (id: string, isCorrect: boolean) => {
    setForm((f) => {
      const key = isCorrect ? "correct_answer_ids" : "incorrect_answer_ids";
      const has = f[key].includes(id);
      return { ...f, [key]: has ? f[key].filter((x) => x !== id) : [...f[key], id] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Názov je povinný");
    if (form.correct_answer_ids.length === 0)
      return toast.error("Vyberte aspoň jednu správnu odpoveď");
    if (form.incorrect_answer_ids.length < 2)
      return toast.error("Vyberte aspoň 2 nesprávne odpovede pre dobrú náhodnú voľbu");
    onSave?.(form);
    toast.success(isEdit ? "Otázka uložená" : "Otázka vytvorená");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle>{isEdit ? "Upraviť otázku" : "Nová otázka"}</DialogTitle>
                <DialogDescription>
                  Otázka musí mať priradenú sadu a aspoň jednu správnu + dve nesprávne odpovede.
                </DialogDescription>
              </div>
              {!isEdit && (
                <Button type="button" size="sm" variant="outline" onClick={() => setAiOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI generovať
                </Button>
              )}
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q-title">Názov otázky</Label>
              <Input
                id="q-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Napr. Prišla mi podozrivá SMS o doručení balíka"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-excerpt">Krátky popis</Label>
              <Input
                id="q-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Jednovetový sumár otázky pre náhľad."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Branže</Label>
                <CategoryMultiSelect
                  value={form.categories}
                  onChange={(v) => setForm((f) => ({ ...f, categories: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stav</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as QuestionStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Čaká na schválenie</SelectItem>
                    <SelectItem value="published">Publikovaná</SelectItem>
                    <SelectItem value="flagged">Nahlásená</SelectItem>
                    <SelectItem value="archived">Archivovaná</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-body">Telo otázky</Label>
              <Textarea
                id="q-body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Plný text otázky, kontext, odkazy, screenshoty..."
                rows={5}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Label>Sada odpovedí</Label>
                <Badge variant="secondary">
                  {form.correct_answer_ids.length} správnych · {form.incorrect_answer_ids.length} nesprávnych
                </Badge>
              </div>
              <Select
                value={form.answer_set_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, answer_set_id: v, correct_answer_ids: [], incorrect_answer_ids: [] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte sadu" />
                </SelectTrigger>
                <SelectContent>
                  {mockAnswerSets.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground">
                Pri zobrazení používateľovi sa zobrazí 1 náhodná správna + 3 náhodné nesprávne odpovede z vybraných.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Správne odpovede
                  </p>
                  <div className="space-y-1.5">
                    {correctPool.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sada nemá správne odpovede.</p>
                    )}
                    {correctPool.map((a) => {
                      const checked = form.correct_answer_ids.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className="flex cursor-pointer items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 text-sm hover:border-emerald-500/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleAnswer(a.id, true)}
                            className="mt-0.5"
                          />
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{a.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                    Nesprávne odpovede
                  </p>
                  <div className="space-y-1.5">
                    {incorrectPool.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sada nemá nesprávne odpovede.</p>
                    )}
                    {incorrectPool.map((a) => {
                      const checked = form.incorrect_answer_ids.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className="flex cursor-pointer items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2 text-sm hover:border-destructive/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleAnswer(a.id, false)}
                            className="mt-0.5"
                          />
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                          <span>{a.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušiť
              </Button>
              <Button type="submit">{isEdit ? "Uložiť zmeny" : "Vytvoriť otázku"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AiQuestionGenerator
        open={aiOpen}
        onOpenChange={setAiOpen}
        defaultCategory={form.categories[0] ?? "vseobecny"}
        onAccept={(g, cat) =>
          setForm((f) => ({
            ...f,
            title: g.title,
            excerpt: g.excerpt,
            body: g.body,
            categories: f.categories.length ? f.categories : [cat],
          }))
        }
      />
    </>
  );
}

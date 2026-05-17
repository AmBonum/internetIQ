import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, type AdminAnswerSet, type AdminAnswer } from "@/lib/admin-mock-data";
import { CategoryMultiSelect } from "@/components/admin/CategoryMultiSelect";
import {
  createAnswer,
  createAnswerSet,
  updateAnswer,
  updateAnswerSet,
} from "@/lib/admin/answer-sets-store";

export interface AnswerSetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  set?: AdminAnswerSet | null;
  onSaved?: (set: AdminAnswerSet) => void;
}

const empty: { name: string; description: string; categories: string[] } = {
  name: "",
  description: "",
  categories: [BRANCHES[0].slug],
};

export function AnswerSetEditor({ open, onOpenChange, set, onSaved }: AnswerSetEditorProps) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(
        set
          ? { name: set.name, description: set.description, categories: [...set.categories] }
          : empty,
      );
    }
  }, [open, set]);

  const isEdit = Boolean(set);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Názov sady je povinný");
      return;
    }
    if (form.categories.length === 0) {
      toast.error("Vyberte aspoň jednu branžu");
      return;
    }
    if (isEdit && set) {
      updateAnswerSet(set.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        categories: form.categories,
      });
      toast.success("Sada uložená");
      onSaved?.({ ...set, ...form });
    } else {
      const created = createAnswerSet({
        name: form.name.trim(),
        description: form.description.trim(),
        categories: form.categories,
      });
      toast.success("Sada vytvorená");
      onSaved?.(created);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť sadu odpovedí" : "Nová sada odpovedí"}</DialogTitle>
          <DialogDescription>
            Sady zoskupujú správne a nesprávne odpovede, ktoré sa dajú priradiť k viacerým otázkam.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="as-name">Názov sady</Label>
            <Input
              id="as-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Napr. SMS podvody — základná sada"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Branže</Label>
            <CategoryMultiSelect
              value={form.categories}
              onChange={(v) => setForm((f) => ({ ...f, categories: v }))}
            />
            <p className="text-xs text-muted-foreground">Sada môže patriť do viacerých branží.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="as-desc">Popis</Label>
            <Textarea
              id="as-desc"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Krátky popis použitia tejto sady."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit">{isEdit ? "Uložiť" : "Vytvoriť sadu"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface AnswerEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string;
  initial?: AdminAnswer | null;
}

export function AnswerEditor({ open, onOpenChange, setId, initial }: AnswerEditorProps) {
  const [text, setText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isCorrect, setIsCorrect] = useState(true);

  useEffect(() => {
    if (open) {
      setText(initial?.text ?? "");
      setExplanation(initial?.explanation ?? "");
      setIsCorrect(initial?.is_correct ?? true);
    }
  }, [open, initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Text odpovede je povinný");
      return;
    }
    if (initial) {
      updateAnswer(initial.id, {
        text: text.trim(),
        is_correct: isCorrect,
        explanation: explanation.trim() || undefined,
      });
      toast.success("Odpoveď uložená");
    } else {
      createAnswer({
        set_id: setId,
        text: text.trim(),
        is_correct: isCorrect,
        explanation: explanation.trim() || undefined,
      });
      toast.success("Odpoveď pridaná");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Upraviť odpoveď" : "Nová odpoveď"}</DialogTitle>
          <DialogDescription>
            Odpoveď bude dostupná všetkým otázkam, ktoré používajú túto sadu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Text odpovede</Label>
            <Textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Napr. Nekliknem na odkaz a SMS vymažem."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={isCorrect ? "correct" : "incorrect"} onValueChange={(v) => setIsCorrect(v === "correct")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correct">Správna odpoveď</SelectItem>
                <SelectItem value="incorrect">Nesprávna odpoveď</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vysvetlenie (voliteľné)</Label>
            <Textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Krátke vysvetlenie, prečo je odpoveď správna/nesprávna."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit">{initial ? "Uložiť" : "Pridať"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

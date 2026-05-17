import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES } from "@/lib/admin-mock-data";
import { generateQuestionWithAnswers, type GeneratedQuestion } from "@/lib/ai-generate.functions";

export interface AiQuestionGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  onAccept?: (q: GeneratedQuestion, category: string) => void;
}

export function AiQuestionGenerator({
  open,
  onOpenChange,
  defaultCategory,
  onAccept,
}: AiQuestionGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? BRANCHES[0].slug);
  const [correctCount, setCorrectCount] = useState(3);
  const [incorrectCount, setIncorrectCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedQuestion | null>(null);

  const callGenerate = useServerFn(generateQuestionWithAnswers);

  const run = async () => {
    if (!topic.trim()) {
      toast.error("Zadajte tému otázky");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const out = await callGenerate({
        data: { topic: topic.trim(), category, correctCount, incorrectCount },
      });
      setResult(out);
      toast.success("Otázka vygenerovaná");
    } catch (e) {
      toast.error((e as Error).message || "AI generácia zlyhala");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (!result) return;
    onAccept?.(result, category);
    onOpenChange(false);
    setResult(null);
    setTopic("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI generátor otázky
          </DialogTitle>
          <DialogDescription>
            Vygeneruje otázku v slovenčine vrátane správnych a nesprávnych odpovedí. Výsledok môžete pred uložením upraviť.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Téma / scenár</Label>
            <Textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Napr. Falošný email z banky o blokovanom účte, ktorý žiada okamžité prihlásenie."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Branža</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Počet správnych</Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={correctCount}
                onChange={(e) => setCorrectCount(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Počet nesprávnych</Label>
              <Input
                type="number"
                min={1}
                max={8}
                value={incorrectCount}
                onChange={(e) => setIncorrectCount(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={run} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? "Generujem..." : "Vygenerovať"}
            </Button>
          </div>

          {result && (
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Názov</p>
                <p className="font-semibold text-foreground">{result.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{result.excerpt}</p>
              </div>
              <p className="text-sm text-foreground/80">{result.body}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Správne</p>
                  {result.correct_answers.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-destructive">Nesprávne</p>
                  {result.incorrect_answers.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zavrieť
          </Button>
          <Button onClick={accept} disabled={!result}>
            Použiť ako novú otázku
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

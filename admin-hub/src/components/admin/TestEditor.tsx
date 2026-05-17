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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockQuestions,
  type AdminTest,
  type TestDifficulty,
  type TestStatus,
} from "@/lib/admin-mock-data";
import { adminRepo } from "@/lib/admin/store";
import { CategoryMultiSelect } from "@/components/admin/CategoryMultiSelect";

export interface TestEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test?: AdminTest | null;
}

const empty = {
  title: "",
  slug: "",
  description: "",
  categories: [] as string[],
  difficulty: "easy" as TestDifficulty,
  status: "draft" as TestStatus,
  time_limit_min: 5,
  pass_score: 60,
  question_ids: [] as string[],
};

export function TestEditor({ open, onOpenChange, test }: TestEditorProps) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      test
        ? {
            title: test.title,
            slug: test.slug,
            description: test.description,
            categories: [...test.categories],
            difficulty: test.difficulty,
            status: test.status,
            time_limit_min: test.time_limit_min,
            pass_score: test.pass_score,
            question_ids: [...test.question_ids],
          }
        : empty,
    );
  }, [open, test]);

  const toggleQ = (id: string) => {
    setForm((f) => ({
      ...f,
      question_ids: f.question_ids.includes(id)
        ? f.question_ids.filter((x) => x !== id)
        : [...f.question_ids, id],
    }));
  };

  const onSave = () => {
    if (!form.title.trim()) {
      toast.error("Zadajte názov testu");
      return;
    }
    if (form.question_ids.length === 0) {
      toast.error("Pridajte aspoň jednu otázku");
      return;
    }
    if (test) {
      adminRepo.tests.update(test.id, form);
      toast.success("Test uložený");
    } else {
      adminRepo.tests.create(form);
      toast.success("Test vytvorený");
    }
    onOpenChange(false);
  };

  const availableQuestions = mockQuestions.filter(
    (q) =>
      form.categories.length === 0 ||
      q.categories.some((c) => form.categories.includes(c)) ||
      form.question_ids.includes(q.id),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{test ? "Upraviť test" : "Nový test"}</DialogTitle>
          <DialogDescription>
            Definujte test, vyberte otázky a nastavte parametre vyhodnotenia.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Názov</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Test pre e-shopy — základ"
            />
          </div>

          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="eshop-zaklad"
            />
          </div>
          <div className="grid gap-2">
            <Label>Branže</Label>
            <CategoryMultiSelect
              value={form.categories}
              onChange={(v) => setForm({ ...form, categories: v })}
            />
            <p className="text-xs text-muted-foreground">
              Test sa bude zobrazovať pre všetky vybrané branže. Otázky sa filtrujú podľa nich.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Popis</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Obťažnosť</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v: TestDifficulty) => setForm({ ...form, difficulty: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Ľahká</SelectItem>
                  <SelectItem value="medium">Stredná</SelectItem>
                  <SelectItem value="hard">Ťažká</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Časový limit (min)</Label>
              <Input
                type="number"
                value={form.time_limit_min}
                onChange={(e) =>
                  setForm({ ...form, time_limit_min: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Pass skóre (%)</Label>
              <Input
                type="number"
                value={form.pass_score}
                onChange={(e) =>
                  setForm({ ...form, pass_score: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v: TestStatus) => setForm({ ...form, status: v })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Koncept</SelectItem>
                <SelectItem value="published">Publikovaný</SelectItem>
                <SelectItem value="archived">Archivovaný</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Otázky v teste</Label>
              <Badge variant="secondary">{form.question_ids.length} vybraných</Badge>
            </div>
            <ScrollArea className="h-64 rounded-md border border-border/60 p-2">
              <div className="space-y-1">
                {availableQuestions.map((q) => {
                  const checked = form.question_ids.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm hover:bg-muted/50"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleQ(q.id)} />
                      <span className="flex-1">{q.title}</span>
                    </label>
                  );
                })}
                {availableQuestions.length === 0 && (
                  <p className="p-4 text-center text-xs text-muted-foreground">
                    Žiadne otázky v tejto branži
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušiť
          </Button>
          <Button onClick={onSave}>Uložiť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

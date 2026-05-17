import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  mockQuickTest,
  type TestDifficulty,
} from "@/lib/admin-mock-data";
import { CategoryMultiSelect } from "@/components/admin/CategoryMultiSelect";

export const Route = createFileRoute("/admin/quick-test")({
  component: QuickTestPage,
});

function QuickTestPage() {
  const [form, setForm] = useState({
    title: mockQuickTest.title,
    description: mockQuickTest.description,
    categories: [...mockQuickTest.categories],
    time_limit_min: mockQuickTest.time_limit_min,
    pass_score: mockQuickTest.pass_score,
    difficulty: mockQuickTest.difficulty,
    enabled: mockQuickTest.status === "published",
    question_ids: [...mockQuickTest.question_ids],
  });

  const toggleQ = (id: string) => {
    setForm((f) => ({
      ...f,
      question_ids: f.question_ids.includes(id)
        ? f.question_ids.filter((x) => x !== id)
        : [...f.question_ids, id],
    }));
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/admin/tests">
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na testy
        </Link>
      </Button>

      <PageHeader
        title="Rýchly test"
        description="Špeciálny krátky test zobrazený na úvodnej stránke subenai.sk."
        actions={
          <Button size="sm" onClick={() => {
            import("@/lib/admin/store").then(({ adminRepo }) => {
              adminRepo.quickTest.update({
                title: form.title,
                description: form.description,
                categories: form.categories,
                time_limit_min: form.time_limit_min,
                pass_score: form.pass_score,
                difficulty: form.difficulty,
                status: form.enabled ? "published" : "draft",
                question_ids: form.question_ids,
              });
              toast.success("Rýchly test uložený");
            });
          }}>
            <Save className="mr-2 h-4 w-4" /> Uložiť
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Nastavenia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
              <div>
                <Label className="text-sm">Zobrazovať na webe</Label>
                <p className="text-xs text-muted-foreground">
                  Vypnutím sa rýchly test skryje na subenai.sk
                </p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm({ ...form, enabled: v })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Názov</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
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
                <Label>Branže</Label>
                <CategoryMultiSelect
                  value={form.categories}
                  onChange={(v) => setForm({ ...form, categories: v })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Čas (min)</Label>
                <Input
                  type="number"
                  value={form.time_limit_min}
                  onChange={(e) =>
                    setForm({ ...form, time_limit_min: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Pass (%)</Label>
                <Input
                  type="number"
                  value={form.pass_score}
                  onChange={(e) =>
                    setForm({ ...form, pass_score: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 w-[220px]">
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
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Otázky</CardTitle>
              <Badge variant="secondary">{form.question_ids.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px]">
              <div className="space-y-1 pr-3">
                {mockQuestions.map((q) => (
                  <label
                    key={q.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md p-2 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={form.question_ids.includes(q.id)}
                      onCheckedChange={() => toggleQ(q.id)}
                    />
                    <span className="flex-1">{q.title}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

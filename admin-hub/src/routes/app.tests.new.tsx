import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, ChevronRight, FileText, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createTest, useTemplates } from "@/lib/platform/store";
import type { GdprPurpose, IntakeField, IntakeFieldType } from "@/lib/platform/types";

export const Route = createFileRoute("/app/tests/new")({
  head: () => ({ meta: [{ title: "Nový test · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: WizardPage,
});

const GDPR: { value: GdprPurpose; label: string }[] = [
  { value: "education", label: "Vzdelávanie" },
  { value: "internal_training", label: "Interný tréning" },
  { value: "research", label: "Výskum" },
  { value: "marketing", label: "Marketing" },
  { value: "recruitment", label: "Recruitment" },
];

function WizardPage() {
  const nav = useNavigate();
  const templates = useTemplates();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [segments, setSegments] = useState<string>("HR, IT");
  const [purpose, setPurpose] = useState<GdprPurpose>("internal_training");
  const [anonymize, setAnonymize] = useState(true);
  const [tracking, setTracking] = useState(true);
  const [password, setPassword] = useState("");
  const [intake, setIntake] = useState<IntakeField[]>([
    { id: "if_email", label: "E-mail", type: "email", required: true, pii: true },
    { id: "if_name", label: "Meno", type: "text", required: false, pii: true },
  ]);

  const addIntake = () => {
    if (intake.length >= 20) return toast.error("Limit 20 polí");
    setIntake([...intake, { id: `if_${Date.now()}`, label: "Nové pole", type: "text", required: false, pii: false }]);
  };

  const finish = () => {
    if (!title.trim()) { setStep(1); return toast.error("Zadaj názov"); }
    const tpl = templates.find((t) => t.id === templateId);
    const t = createTest({
      title: title.trim(), description, gdpr_purpose: purpose,
      segmentation: segments.split(",").map((s) => s.trim()).filter(Boolean),
      intake_fields: intake, anonymize_after_days: anonymize ? 90 : null,
      allow_behavioral_tracking: tracking, password: password || null,
      question_ids: tpl?.question_ids ?? [], use_predefined_set: !!tpl,
      predefined_set_id: tpl?.id,
    });
    toast.success("Test vytvorený");
    nav({ to: "/app/tests/$testId", params: { testId: t.id } });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" /> Sprievodca novým testom
      </header>
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</span>
            <span className={step === s ? "font-medium" : "text-muted-foreground"}>
              {s === 1 ? "Základ" : s === 2 ? "Segmentácia & GDPR" : "Intake polia"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Základné informácie</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Názov testu</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Napr. Phishing pre HR" /></div>
            <div className="space-y-2"><Label>Popis</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Krátky popis pre respondentov..." /></div>
            <div className="space-y-2">
              <Label>Šablóna (voliteľné)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Začať z prázdneho" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <Layers className="mr-2 inline h-3 w-3" /> {t.title} ({t.question_ids.length} otázok)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end"><Button onClick={() => setStep(2)}>Pokračovať</Button></div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Segmentácia a účel spracovania (GDPR)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Účel spracovania osobných údajov</Label>
              <Select value={purpose} onValueChange={(v) => setPurpose(v as GdprPurpose)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GDPR.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Účel sa zobrazí respondentom na úvodnej stránke.</p>
            </div>
            <div className="space-y-2">
              <Label>Segmenty (oddelené čiarkou)</Label>
              <Input value={segments} onChange={(e) => setSegments(e.target.value)} placeholder="HR, IT, marketing" />
              <div className="flex flex-wrap gap-1">
                {segments.split(",").map((s) => s.trim()).filter(Boolean).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><Label>Heslo pre respondentov</Label><p className="text-xs text-muted-foreground">Voliteľne — bez hesla je test verejne dostupný cez link.</p></div>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="w-40" placeholder="(žiadne)" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><Label>Anonymizovať po 90 dňoch</Label><p className="text-xs text-muted-foreground">Automaticky odstráni PII zo session-ov.</p></div>
              <Switch checked={anonymize} onCheckedChange={setAnonymize} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><Label>Povoliť behaviorálne tracking eventy</Label><p className="text-xs text-muted-foreground">Časy odpovedí, drop-off (vyžaduje súhlas respondenta).</p></div>
              <Switch checked={tracking} onCheckedChange={setTracking} />
            </div>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Späť</Button><Button onClick={() => setStep(3)}>Pokračovať</Button></div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Intake polia respondenta <Badge variant="secondary">{intake.length}/20</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {intake.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 gap-2 rounded-lg border p-3">
                <Input className="col-span-4" value={f.label} onChange={(e) => setIntake(intake.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <Select value={f.type} onValueChange={(v) => setIntake(intake.map((x, j) => j === i ? { ...x, type: v as IntakeFieldType } : x))}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>{["text","email","phone","select","checkbox","date","number"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <label className="col-span-2 flex items-center gap-2 text-sm"><Checkbox checked={f.required} onCheckedChange={(c) => setIntake(intake.map((x, j) => j === i ? { ...x, required: !!c } : x))} /> povinné</label>
                <label className="col-span-2 flex items-center gap-2 text-sm"><Checkbox checked={f.pii} onCheckedChange={(c) => setIntake(intake.map((x, j) => j === i ? { ...x, pii: !!c } : x))} /> PII</label>
                <Button variant="ghost" size="sm" className="col-span-1 text-destructive" onClick={() => setIntake(intake.filter((_, j) => j !== i))}>×</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addIntake}><FileText className="mr-2 h-3 w-3" /> Pridať pole</Button>
            <div className="flex justify-between pt-3"><Button variant="ghost" onClick={() => setStep(2)}>Späť</Button><Button onClick={finish}>Vytvoriť test</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

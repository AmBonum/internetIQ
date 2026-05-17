import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Send, Archive, Plus, X, BarChart3, FileSpreadsheet,
  Lock, Bell, GitBranch, Layers, History as HistoryIcon, FileText, Download,
  ShieldCheck, Eye, Trash2, Sparkles, Copy, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  archiveTest, assignTestToGroup, assignmentsForTest, getTest, publishTest,
  unassignTestFromGroup, updateTest, useAssignments, useGroups, useQuestions,
  useRespondents, useSessions, useTests, useTestVersions, versionsForTest,
} from "@/lib/platform/store";
import type { GdprPurpose, IntakeField, IntakeFieldType, NotifConfig } from "@/lib/platform/types";
import { exportSessionsCSV, exportSessionsJSON, exportSummaryPDF } from "@/lib/platform/exports";

export const Route = createFileRoute("/app/tests/$testId")({
  head: () => ({ meta: [{ title: "Editor testu · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: TestEditor,
});

const GDPR: { value: GdprPurpose; label: string }[] = [
  { value: "education", label: "Vzdelávanie" },
  { value: "internal_training", label: "Interný tréning" },
  { value: "research", label: "Výskum" },
  { value: "marketing", label: "Marketing" },
  { value: "recruitment", label: "Recruitment" },
];

function TestEditor() {
  const { testId } = useParams({ from: "/app/tests/$testId" });
  useTests();
  const t = getTest(testId);
  const allQs = useQuestions();
  const sessions = useSessions().filter((s) => s.test_id === testId);
  const respondents = useRespondents();
  useTestVersions();
  const versions = versionsForTest(testId);

  if (!t) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Test nenájdený. <Link to="/app" className="text-primary underline">Späť na dashboard</Link>
      </div>
    );
  }

  const completed = sessions.filter((s) => s.status === "completed");
  const avg = completed.length ? Math.round(completed.reduce((a, s) => a + (s.score ?? 0), 0) / completed.length) : 0;
  const passRate = completed.length ? Math.round((completed.filter((s) => (s.score ?? 0) >= 70).length / completed.length) * 100) : 0;
  const avgTime = completed.length
    ? Math.round(completed.reduce((a, s) => a + s.answers.reduce((x, y) => x + y.time_ms, 0), 0) / completed.length / 1000)
    : 0;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/t/${t.share_id}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Späť
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{t.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={t.status === "published" ? "default" : t.status === "draft" ? "secondary" : "outline"}>
              {t.status === "published" ? "Publikovaný" : t.status === "draft" ? "Draft" : "Archivovaný"}
            </Badge>
            <span>v{t.version}</span>
            <span>·</span>
            <span>{t.question_ids.length} otázok</span>
            <span>·</span>
            <span>{sessions.length} session-ov</span>
            {t.password && <><span>·</span><Lock className="h-3 w-3" />heslo</>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link skopírovaný"); }}>
            <Copy className="mr-2 h-3 w-3" /> Skopírovať link
          </Button>
          {t.status !== "archived" && (
            <Button variant="outline" size="sm" onClick={() => { archiveTest(testId); toast.success("Archivované"); }}>
              <Archive className="mr-2 h-3 w-3" /> Archivovať
            </Button>
          )}
          <Button size="sm" onClick={() => { publishTest(testId); toast.success(`Publikovaná v${t.version + (t.status === "published" ? 1 : 0)}`); }}>
            <Send className="mr-2 h-3 w-3" /> {t.status === "published" ? "Publikovať novú verziu" : "Publikovať"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dashboard"><BarChart3 className="mr-1 h-3 w-3" />Dashboard</TabsTrigger>
          <TabsTrigger value="detail"><FileText className="mr-1 h-3 w-3" />Detail & GDPR</TabsTrigger>
          <TabsTrigger value="questions"><Layers className="mr-1 h-3 w-3" />Otázky ({t.question_ids.length})</TabsTrigger>
          <TabsTrigger value="intake"><ShieldCheck className="mr-1 h-3 w-3" />Intake polia</TabsTrigger>
          <TabsTrigger value="audiences"><UsersRound className="mr-1 h-3 w-3" />Skupiny</TabsTrigger>
          <TabsTrigger value="branches"><GitBranch className="mr-1 h-3 w-3" />Vetvenie</TabsTrigger>
          <TabsTrigger value="notif"><Bell className="mr-1 h-3 w-3" />Notifikácie</TabsTrigger>
          <TabsTrigger value="versions"><HistoryIcon className="mr-1 h-3 w-3" />Verzie ({versions.length})</TabsTrigger>
          <TabsTrigger value="exports"><Download className="mr-1 h-3 w-3" />Exporty</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi label="Dokončené" value={completed.length} />
            <Kpi label="Priemerné skóre" value={`${avg}%`} />
            <Kpi label="Pass rate" value={`${passRate}%`} />
            <Kpi label="Priem. čas" value={`${avgTime}s`} />
          </div>

          <Card>
            <CardHeader><CardTitle>Respondenti</CardTitle><CardDescription>Detail každého pokusu vrátane času na otázku.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Respondent</TableHead><TableHead>Segment</TableHead>
                  <TableHead>Začaté</TableHead><TableHead>Stav</TableHead>
                  <TableHead className="text-right">Skóre</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sessions.slice(0, 20).map((s) => {
                    const r = respondents.find((x) => x.id === s.respondent_id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">
                          <div className="font-medium">{r?.display_name ?? "Anonym"}</div>
                          <div className="text-xs text-muted-foreground">{r?.email ?? "—"}</div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{s.segment ?? "—"}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.started_at).toLocaleString("sk-SK")}</TableCell>
                        <TableCell><Badge variant={s.status === "completed" ? "default" : "outline"} className="text-[10px]">{s.status}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{s.score != null ? `${s.score}%` : "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {sessions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Žiadne session-y.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Analýza otázok</CardTitle><CardDescription>Presnosť a priemerný čas na každú otázku.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {t.question_ids.map((qid) => {
                const q = allQs.find((x) => x.id === qid);
                const ans = sessions.flatMap((s) => s.answers.filter((a) => a.question_id === qid));
                const correct = ans.filter((a) => a.is_correct).length;
                const acc = ans.length ? Math.round((correct / ans.length) * 100) : 0;
                const avgMs = ans.length ? Math.round(ans.reduce((a, x) => a + x.time_ms, 0) / ans.length) : 0;
                return (
                  <div key={qid} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="truncate">{q?.prompt ?? qid}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{ans.length} odp. · {(avgMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={acc} className="h-2 flex-1" />
                      <span className="w-12 text-right text-xs font-medium">{acc}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <DetailTab test={t} />
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <QuestionsTab test={t} />
        </TabsContent>

        <TabsContent value="intake" className="mt-4">
          <IntakeTab test={t} />
        </TabsContent>

        <TabsContent value="audiences" className="mt-4">
          <AudiencesTab testId={testId} />
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          <BranchesTab test={t} />
        </TabsContent>

        <TabsContent value="notif" className="mt-4">
          <NotifTab test={t} />
        </TabsContent>

        <TabsContent value="versions" className="mt-4 space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">v{v.version} — {v.snapshot_title}</div>
                <div className="text-xs text-muted-foreground">{v.changelog} · {v.snapshot_questions} otázok</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">{new Date(v.published_at).toLocaleString("sk-SK")}</div>
            </div>
          ))}
          {versions.length === 0 && <p className="text-sm text-muted-foreground">Žiadne publikované verzie.</p>}
        </TabsContent>

        <TabsContent value="exports" className="mt-4 grid gap-3 sm:grid-cols-3">
          <ExportCard
            icon={<FileSpreadsheet className="h-5 w-5" />}
            title="CSV session-ov"
            description={`${sessions.length} session-ov so všetkými odpoveďami`}
            onClick={() => exportSessionsCSV(t, sessions, allQs, respondents)}
          />
          <ExportCard
            icon={<FileText className="h-5 w-5" />}
            title="JSON snapshot"
            description="Test + session-y v štruktúrovanom JSON"
            onClick={() => exportSessionsJSON(t, sessions)}
          />
          <ExportCard
            icon={<Sparkles className="h-5 w-5" />}
            title="PDF report"
            description="Manažérsky sumár + analýza otázok"
            onClick={() => exportSummaryPDF(t, sessions, allQs)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ───────── Sub-tabs ─────────

function DetailTab({ test }: { test: import("@/lib/platform/types").Test }) {
  const [title, setTitle] = useState(test.title);
  const [description, setDescription] = useState(test.description);
  const [purpose, setPurpose] = useState<GdprPurpose>(test.gdpr_purpose);
  const [password, setPassword] = useState(test.password ?? "");
  const [segments, setSegments] = useState(test.segmentation.join(", "));
  const [anonymize, setAnonymize] = useState(test.anonymize_after_days != null);
  const [tracking, setTracking] = useState(test.allow_behavioral_tracking);

  const save = () => {
    updateTest(test.id, {
      title, description, gdpr_purpose: purpose,
      password: password || null,
      segmentation: segments.split(",").map((s) => s.trim()).filter(Boolean),
      anonymize_after_days: anonymize ? 90 : null,
      allow_behavioral_tracking: tracking,
    });
    toast.success("Uložené");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Detaily & GDPR</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Názov</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-2"><Label>Popis</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Účel spracovania (GDPR)</Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as GdprPurpose)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GDPR.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Segmenty</Label><Input value={segments} onChange={(e) => setSegments(e.target.value)} /></div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label>Heslo pre respondentov</Label>
            <p className="text-xs text-muted-foreground">Bez hesla je test verejne dostupný cez share link.</p>
          </div>
          <Input className="w-48" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="(žiadne)" />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><Label>Anonymizovať po 90 dňoch</Label><p className="text-xs text-muted-foreground">PII sa automaticky odstráni.</p></div>
          <Switch checked={anonymize} onCheckedChange={setAnonymize} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><Label>Povoliť behaviorálne tracking</Label><p className="text-xs text-muted-foreground">Časy odpovedí, drop-off (s consent-om).</p></div>
          <Switch checked={tracking} onCheckedChange={setTracking} />
        </div>
        <div className="flex justify-end"><Button onClick={save}><Save className="mr-2 h-3 w-3" />Uložiť</Button></div>
      </CardContent>
    </Card>
  );
}

function QuestionsTab({ test }: { test: import("@/lib/platform/types").Test }) {
  const allQs = useQuestions();
  const [selected, setSelected] = useState<string[]>(test.question_ids);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const inSet = useMemo(() => new Set(selected), [selected]);
  const filtered = allQs.filter((q) =>
    (filter === "all" || q.type === filter) &&
    (q.prompt.toLowerCase().includes(search.toLowerCase()) || q.category.includes(search.toLowerCase()))
  );

  const toggle = (id: string) => {
    if (inSet.has(id)) setSelected(selected.filter((x) => x !== id));
    else {
      if (selected.length >= 50) return toast.error("Limit 50 otázok na test");
      setSelected([...selected, id]);
    }
  };

  const save = () => { updateTest(test.id, { question_ids: selected }); toast.success(`Uložených ${selected.length} otázok`); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 gap-2">
          <Input placeholder="Hľadať otázky..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky typy</SelectItem>
              {["single","multi","scale_1_5","scale_1_10","nps","matrix","ranking","slider","short_text","long_text","date","time","file_upload","image_choice","yes_no"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={selected.length > 50 ? "destructive" : "secondary"}>{selected.length}/50</Badge>
          <Button size="sm" onClick={save}><Save className="mr-2 h-3 w-3" />Uložiť</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[500px] divide-y overflow-y-auto">
            {filtered.slice(0, 80).map((q) => (
              <label key={q.id} className={`flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50 ${inSet.has(q.id) ? "bg-primary/5" : ""}`}>
                <Checkbox checked={inSet.has(q.id)} onCheckedChange={() => toggle(q.id)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{q.prompt}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    <Badge variant="outline" className="font-normal text-[10px]">{q.type}</Badge>
                    <Badge variant="outline" className="font-normal text-[10px]">{q.category}</Badge>
                    <Badge variant="outline" className="font-normal text-[10px]">{q.difficulty}</Badge>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IntakeTab({ test }: { test: import("@/lib/platform/types").Test }) {
  const [intake, setIntake] = useState<IntakeField[]>(test.intake_fields);
  const update = (i: number, patch: Partial<IntakeField>) => setIntake(intake.map((x, j) => j === i ? { ...x, ...patch } : x));
  const add = () => {
    if (intake.length >= 20) return toast.error("Limit 20 polí");
    setIntake([...intake, { id: `if_${Date.now()}`, label: "Nové pole", type: "text", required: false, pii: false }]);
  };
  const save = () => { updateTest(test.id, { intake_fields: intake }); toast.success("Intake polia uložené"); };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Intake polia <Badge variant="secondary">{intake.length}/20</Badge></CardTitle>
        <CardDescription>Polia, ktoré respondent vyplní pred testom.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {intake.map((f, i) => (
          <div key={f.id} className="grid grid-cols-12 items-center gap-2 rounded-lg border p-3">
            <Input className="col-span-4" value={f.label} onChange={(e) => update(i, { label: e.target.value })} />
            <Select value={f.type} onValueChange={(v) => update(i, { type: v as IntakeFieldType })}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>{["text","email","phone","select","checkbox","date","number"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <label className="col-span-2 flex items-center gap-2 text-xs"><Checkbox checked={f.required} onCheckedChange={(c) => update(i, { required: !!c })} />povinné</label>
            <label className="col-span-2 flex items-center gap-2 text-xs"><Checkbox checked={f.pii} onCheckedChange={(c) => update(i, { pii: !!c })} />PII</label>
            <Button variant="ghost" size="sm" className="col-span-1 text-destructive" onClick={() => setIntake(intake.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
          </div>
        ))}
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-3 w-3" />Pridať pole</Button>
          <Button size="sm" onClick={save}><Save className="mr-2 h-3 w-3" />Uložiť</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BranchesTab({ test }: { test: import("@/lib/platform/types").Test }) {
  const allQs = useQuestions();
  const [branches, setBranches] = useState(test.branches);
  const qs = test.question_ids.map((id) => allQs.find((q) => q.id === id)).filter(Boolean) as { id: string; prompt: string }[];

  const add = () => setBranches([...branches, { if_question_id: qs[0]?.id ?? "", if_answer: "Možnosť B", jump_to_question_id: qs[qs.length - 1]?.id ?? "" }]);
  const update = (i: number, patch: Partial<typeof branches[number]>) => setBranches(branches.map((b, j) => j === i ? { ...b, ...patch } : b));
  const save = () => { updateTest(test.id, { branches }); toast.success("Vetvy uložené"); };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Podmienené vetvenie</CardTitle>
        <CardDescription>Ak respondent odpovie X, preskoč na otázku Y.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {branches.map((b, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border p-3 text-sm">
            <Select value={b.if_question_id} onValueChange={(v) => update(i, { if_question_id: v })}>
              <SelectTrigger className="col-span-4"><SelectValue placeholder="Ak otázka..." /></SelectTrigger>
              <SelectContent>{qs.map((q) => <SelectItem key={q.id} value={q.id}>{q.prompt.slice(0, 40)}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="col-span-3" value={b.if_answer} onChange={(e) => update(i, { if_answer: e.target.value })} placeholder="má odpoveď" />
            <Select value={b.jump_to_question_id} onValueChange={(v) => update(i, { jump_to_question_id: v })}>
              <SelectTrigger className="col-span-4"><SelectValue placeholder="preskoč na..." /></SelectTrigger>
              <SelectContent>{qs.map((q) => <SelectItem key={q.id} value={q.id}>{q.prompt.slice(0, 40)}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="col-span-1 text-destructive" onClick={() => setBranches(branches.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
        {branches.length === 0 && <p className="text-sm text-muted-foreground">Žiadne vetvy — všetci respondenti vidia otázky lineárne.</p>}
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={add} disabled={qs.length < 2}><Plus className="mr-2 h-3 w-3" />Pridať vetvu</Button>
          <Button size="sm" onClick={save}><Save className="mr-2 h-3 w-3" />Uložiť</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotifTab({ test }: { test: import("@/lib/platform/types").Test }) {
  const [c, setC] = useState<NotifConfig>(test.notif_config);
  const save = () => { updateTest(test.id, { notif_config: c }); toast.success("Notifikácie uložené"); };

  return (
    <Card>
      <CardHeader><CardTitle>Notifikácie</CardTitle><CardDescription>Kedy a ako ťa informovať.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <NotifRow label="Nový respondent" desc="Pri každom dokončení testu" checked={c.new_respondent.enabled}
          onChange={(v) => setC({ ...c, new_respondent: { ...c.new_respondent, enabled: v } })}>
          <Select value={c.new_respondent.channel} onValueChange={(v) => setC({ ...c, new_respondent: { ...c.new_respondent, channel: v as "email" | "in_app" | "both" } })}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="in_app">In-app</SelectItem>
              <SelectItem value="both">Oboje</SelectItem>
            </SelectContent>
          </Select>
        </NotifRow>
        <NotifRow label="Míľnik" desc={`Každých ${c.milestone.every_n} dokončení`} checked={c.milestone.enabled}
          onChange={(v) => setC({ ...c, milestone: { ...c.milestone, enabled: v } })}>
          <Input className="w-20" type="number" value={c.milestone.every_n} onChange={(e) => setC({ ...c, milestone: { ...c.milestone, every_n: parseInt(e.target.value) || 25 } })} />
        </NotifRow>
        <NotifRow label="Anomália" desc="Drop-off nad 30 %" checked={c.anomaly.enabled}
          onChange={(v) => setC({ ...c, anomaly: { enabled: v } })} />
        <NotifRow label="Expiry" desc={`${c.expiry.days_before} dní pred koncom`} checked={c.expiry.enabled}
          onChange={(v) => setC({ ...c, expiry: { ...c.expiry, enabled: v } })}>
          <Input className="w-20" type="number" value={c.expiry.days_before} onChange={(e) => setC({ ...c, expiry: { ...c.expiry, days_before: parseInt(e.target.value) || 7 } })} />
        </NotifRow>
        <NotifRow label="Denný sumár" desc="Každé ráno zhrnutie" checked={c.daily_summary.enabled}
          onChange={(v) => setC({ ...c, daily_summary: { enabled: v } })} />
        <div className="flex justify-end"><Button size="sm" onClick={save}><Save className="mr-2 h-3 w-3" />Uložiť</Button></div>
      </CardContent>
    </Card>
  );
}

function NotifRow({ label, desc, checked, onChange, children }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </CardContent></Card>
  );
}

function ExportCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <Card className="cursor-pointer transition hover:border-primary/60" onClick={onClick}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-primary">{icon}<span className="text-sm font-medium">{title}</span></div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button size="sm" variant="outline" className="mt-2 w-full"><Download className="mr-2 h-3 w-3" />Stiahnuť</Button>
      </CardContent>
    </Card>
  );
}

function AudiencesTab({ testId }: { testId: string }) {
  useAssignments();
  const groups = useGroups().filter((g) => g.owner_id === currentUserIdGuard());
  const assigns = assignmentsForTest(testId);
  const assignedIds = new Set(assigns.map((a) => a.group_id));
  const [picked, setPicked] = useState<string>("");

  const assign = () => {
    if (!picked) return;
    const a = assignTestToGroup(testId, picked);
    if (a) toast.success(`Priradené — odoslaných ${a.invited_count} pozvánok`);
    setPicked("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Priradiť skupinu respondentov</CardTitle>
          <CardDescription>Pošli test celej skupine jedným klikom. Spravuješ ich v <Link to="/app/audiences" className="underline">Skupiny respondentov</Link>.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={picked} onValueChange={setPicked}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Vyber skupinu..." /></SelectTrigger>
              <SelectContent>
                {groups.filter((g) => !assignedIds.has(g.id)).map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name} ({g.member_emails.length} kontaktov)</SelectItem>
                ))}
                {groups.filter((g) => !assignedIds.has(g.id)).length === 0 && (
                  <SelectItem value="_none" disabled>Všetky skupiny už priradené</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button onClick={assign} disabled={!picked}><Send className="mr-2 h-3 w-3" />Priradiť & poslať</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aktívne priradenia ({assigns.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {assigns.map((a) => {
            const g = groups.find((x) => x.id === a.group_id);
            return (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium"><UsersRound className="h-3 w-3" />{g?.name ?? a.group_id}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.invited_count} pozvánok · priradené {new Date(a.assigned_at).toLocaleDateString("sk-SK")}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { unassignTestFromGroup(a.id); toast.success("Odpojené"); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
          {assigns.length === 0 && <p className="text-sm text-muted-foreground">Žiadne priradenia — vyber skupinu vyššie.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function currentUserIdGuard() {
  // re-export to avoid circular imports in this file scope
  return "usr_me";
}

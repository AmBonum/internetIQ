import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Share2,
  Save,
  Trash2,
  Plus,
  Search,
  Globe,
  Lock,
  Link2,
  Users,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  KeyRound,
  Eye,
  EyeOff,
  BarChart3,
  Timer,
  Trophy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { CategoryMultiSelect } from "@/components/admin/CategoryMultiSelect";
import { ShareDialog } from "@/components/user/ShareDialog";
import { branchLabel, mockQuestions } from "@/lib/admin-mock-data";
import {
  mockUserSets,
  mockUserInvites,
  mockUserShares,
  attemptsForSet,
  currentUser,
  type UserTestSet,
  type InviteStatus,
  type UserTestAttempt,
} from "@/lib/user-mock-data";

export const Route = createFileRoute("/app/sets/$setId")({
  head: () => ({
    meta: [
      { title: "Detail sady · SubenAI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetDetailPage,
});

const visibilityMeta = {
  private: { label: "Súkromné", Icon: Lock, tone: "bg-muted text-muted-foreground" },
  unlisted: { label: "Cez odkaz", Icon: Link2, tone: "bg-amber-500/10 text-amber-600" },
  public: { label: "Verejné", Icon: Globe, tone: "bg-emerald-500/10 text-emerald-600" },
} as const;

const statusMeta: Record<InviteStatus, { label: string; tone: string; Icon: typeof Clock }> = {
  pending: { label: "Čaká", tone: "bg-amber-500/10 text-amber-600", Icon: Clock },
  accepted: { label: "Prijaté", tone: "bg-emerald-500/10 text-emerald-600", Icon: CheckCircle2 },
  expired: { label: "Expirované", tone: "bg-muted text-muted-foreground", Icon: XCircle },
  bounced: { label: "Bounced", tone: "bg-destructive/10 text-destructive", Icon: XCircle },
};

function SetDetailPage() {
  const { setId } = Route.useParams();
  const navigate = useNavigate();

  const initial = useMemo(
    () => mockUserSets.find((s) => s.id === setId),
    [setId],
  );

  const [set, setSet] = useState<UserTestSet | null>(initial ?? null);
  const [shareOpen, setShareOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (!set) {
    return (
      <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-xl font-semibold text-foreground">Sada sa nenašla</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sada s ID <code>{setId}</code> neexistuje alebo bola zmazaná.
          </p>
          <Button asChild className="mt-6">
            <Link to="/app">
              <ArrowLeft className="mr-2 h-4 w-4" /> Späť na moje sady
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const update = (patch: Partial<UserTestSet>) =>
    setSet((p) => (p ? { ...p, ...patch, updated_at: new Date().toISOString() } : p));

  const save = () => {
    // In production: PATCH /api/user-sets/:id
    const idx = mockUserSets.findIndex((s) => s.id === set.id);
    if (idx >= 0) mockUserSets[idx] = set;
    toast.success("Sada uložená");
  };

  const remove = () => {
    const idx = mockUserSets.findIndex((s) => s.id === set.id);
    if (idx >= 0) mockUserSets.splice(idx, 1);
    toast.success("Sada vymazaná");
    navigate({ to: "/app" });
  };

  const availableQuestions = mockQuestions.filter(
    (q) =>
      !set.question_ids.includes(q.id) &&
      (set.categories.length === 0 || q.categories.some((c) => set.categories.includes(c))) &&
      (search.trim().length === 0 ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.excerpt.toLowerCase().includes(search.toLowerCase())),
  );

  const selectedQuestions = set.question_ids
    .map((id) => mockQuestions.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const addQuestion = (id: string) =>
    update({ question_ids: [...set.question_ids, id] });
  const removeQuestion = (id: string) =>
    update({ question_ids: set.question_ids.filter((qid) => qid !== id) });

  const shares = mockUserShares.filter((s) => s.set_id === set.id);
  const invites = mockUserInvites.filter((i) => i.set_id === set.id);
  const attempts = useMemo(() => attemptsForSet(set.id), [set.id]);

  const v = visibilityMeta[set.visibility];

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/app"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Späť na moje sady
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {set.title || "Bez názvu"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={`${v.tone} hover:${v.tone}`}>
                <v.Icon className="mr-1 h-3 w-3" /> {v.label}
              </Badge>
              {set.categories.map((c) => (
                <Badge key={c} variant="secondary" className="font-normal">
                  {branchLabel(c)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" /> Zdieľať
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={remove}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Zmazať
            </Button>
            <Button size="sm" onClick={save}>
              <Save className="mr-2 h-4 w-4" /> Uložiť
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Otázky" value={set.question_ids.length} />
          <Stat label="Pokusy" value={set.attempts.toLocaleString("sk-SK")} />
          <Stat label="Zdieľania" value={set.shared_with_count} />
          <Stat
            label="Aktualizované"
            value={new Date(set.updated_at).toLocaleDateString("sk-SK")}
          />
        </div>

        <Tabs defaultValue="details" className="mt-8">
          <TabsList>
            <TabsTrigger value="details">Detaily</TabsTrigger>
            <TabsTrigger value="questions">
              Otázky <span className="ml-1 text-muted-foreground">({selectedQuestions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sharing">
              Zdieľanie <span className="ml-1 text-muted-foreground">({shares.length + invites.length})</span>
            </TabsTrigger>
            <TabsTrigger value="results">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Výsledky <span className="ml-1 text-muted-foreground">({attempts.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* DETAILS */}
          <TabsContent value="details" className="mt-4">
            <Card className="border-border/60">
              <CardContent className="grid gap-5 p-5 sm:p-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Názov sady</Label>
                  <Input
                    id="title"
                    value={set.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Popis</Label>
                  <Textarea
                    id="desc"
                    rows={4}
                    value={set.description}
                    onChange={(e) => update({ description: e.target.value })}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">/s/</span>
                      <Input
                        id="slug"
                        value={set.slug}
                        onChange={(e) =>
                          update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/s/${set.slug}`,
                          );
                          toast.success("Link skopírovaný");
                        }}
                        aria-label="Skopírovať odkaz"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Viditeľnosť</Label>
                    <Select
                      value={set.visibility}
                      onValueChange={(val) =>
                        update({ visibility: val as UserTestSet["visibility"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Súkromné — iba ja</SelectItem>
                        <SelectItem value="unlisted">Cez odkaz — kto má link</SelectItem>
                        <SelectItem value="public">Verejné — vidí ho každý</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Branže</Label>
                  <CategoryMultiSelect
                    value={set.categories}
                    onChange={(v) => update({ categories: v })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Otázky budeš môcť pridávať len z vybraných branží.
                  </p>
                </div>
                <PasswordField
                  value={set.password}
                  onChange={(p) => update({ password: p })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUESTIONS */}
          <TabsContent value="questions" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Vybrané otázky</h3>
                    <Badge variant="secondary">{selectedQuestions.length}</Badge>
                  </div>
                  {selectedQuestions.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      Zatiaľ žiadne otázky. Pridaj ich z pravého panela.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedQuestions.map((q) => (
                        <li
                          key={q.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-border/40 bg-card/50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{q.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {q.excerpt}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {q.categories.map((c) => (
                                <Badge key={c} variant="outline" className="text-[10px] font-normal">
                                  {branchLabel(c)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeQuestion(q.id)}
                            aria-label="Odstrániť"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Pridať z knižnice</h3>
                    <Badge variant="secondary">{availableQuestions.length}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Hľadať otázku..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {availableQuestions.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      {set.categories.length === 0
                        ? "Najprv vyber aspoň jednu branžu v Detailoch."
                        : "Žiadne ďalšie otázky vo vybraných branžiach."}
                    </p>
                  ) : (
                    <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                      {availableQuestions.slice(0, 25).map((q) => (
                        <li
                          key={q.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-border/40 bg-card/50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{q.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {q.excerpt}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => addQuestion(q.id)}
                            aria-label="Pridať"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SHARING */}
          <TabsContent value="sharing" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      <Link2 className="mr-1 inline h-4 w-4" /> Odkazy
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Vytvoriť
                    </Button>
                  </div>
                  {shares.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      Žiadne aktívne odkazy.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {shares.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-card/50 p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-mono text-xs">/s/{s.target}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.access === "play" ? "Hranie" : s.access === "edit" ? "Editácia" : "Náhľad"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/s/${s.target}`,
                              );
                              toast.success("Skopírované");
                            }}
                            aria-label="Skopírovať"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      <Mail className="mr-1 inline h-4 w-4" /> Pozvánky
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                      <Users className="mr-1 h-3.5 w-3.5" /> Pozvať
                    </Button>
                  </div>
                  {invites.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                      Zatiaľ nikoho si nepozval/a.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {invites.map((i) => {
                        const st = statusMeta[i.status];
                        return (
                          <li
                            key={i.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-card/50 p-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{i.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Odoslané {new Date(i.sent_at).toLocaleDateString("sk-SK")}
                              </p>
                            </div>
                            <Badge className={`${st.tone} hover:${st.tone}`}>
                              <st.Icon className="mr-1 h-3 w-3" /> {st.label}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RESULTS / DASHBOARD */}
          <TabsContent value="results" className="mt-4">
            <ResultsDashboard attempts={attempts} questionIds={set.question_ids} />
          </TabsContent>
        </Tabs>
      </main>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} set={set} />
    </div>
  );
}

function PasswordField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [show, setShow] = useState(false);
  const enabled = value !== null;
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Heslo pre respondentov
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Bez hesla môže test vyplniť ktokoľvek s odkazom. S heslom ho respondent
            zadá pred štartom.
          </p>
        </div>
        <Button
          type="button"
          variant={enabled ? "outline" : "default"}
          size="sm"
          onClick={() => onChange(enabled ? null : "")}
        >
          {enabled ? "Vypnúť heslo" : "Zapnúť heslo"}
        </Button>
      </div>
      {enabled && (
        <div className="flex items-center gap-2">
          <Input
            type={show ? "text" : "password"}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Napr. tajne2025"
            maxLength={64}
            className="font-mono"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Skryť" : "Zobraziť"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

const formatDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function ResultsDashboard({
  attempts,
  questionIds,
}: {
  attempts: UserTestAttempt[];
  questionIds: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (attempts.length === 0)
      return { avg: 0, best: 0, worst: 0, avgTime: 0, passRate: 0 };
    const scores = attempts.map((a) => a.score);
    const passed = scores.filter((s) => s >= 60).length;
    return {
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / attempts.length),
      best: Math.max(...scores),
      worst: Math.min(...scores),
      avgTime: Math.round(
        attempts.reduce((a, x) => a + x.duration_ms, 0) / attempts.length,
      ),
      passRate: Math.round((passed / attempts.length) * 100),
    };
  }, [attempts]);

  const questionStats = useMemo(() => {
    return questionIds.map((qid) => {
      const ans = attempts.flatMap((a) => a.answers).filter((x) => x.question_id === qid);
      const correct = ans.filter((x) => x.is_correct).length;
      const total = ans.length;
      const avgTime = total ? Math.round(ans.reduce((a, x) => a + x.time_ms, 0) / total) : 0;
      const q = mockQuestions.find((q) => q.id === qid);
      return {
        id: qid,
        title: q?.title ?? qid,
        correct,
        total,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        avgTime,
      };
    });
  }, [attempts, questionIds]);

  if (attempts.length === 0) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Zatiaľ žiadne vyplnenia. Zdieľaj odkaz alebo pošli pozvánku.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KPI label="Vyplnení" value={attempts.length} Icon={Users} />
        <KPI label="Priemerné skóre" value={`${stats.avg}%`} Icon={Trophy} />
        <KPI label="Úspešnosť (≥60%)" value={`${stats.passRate}%`} Icon={CheckCircle2} />
        <KPI label="Najlepšie" value={`${stats.best}%`} Icon={Trophy} />
        <KPI label="Priemerný čas" value={formatDuration(stats.avgTime)} Icon={Timer} />
      </div>

      {/* Per-respondent table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="border-b border-border/40 p-4">
            <h3 className="font-semibold text-foreground">Respondenti</h3>
            <p className="text-xs text-muted-foreground">
              Klikni na riadok pre detailný rozpis odpovedí
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {attempts.map((a) => {
              const isOpen = expanded === a.id;
              const correctCount = a.answers.filter((x) => x.is_correct).length;
              const scoreColor =
                a.score >= 80
                  ? "text-emerald-600"
                  : a.score >= 60
                  ? "text-amber-600"
                  : "text-destructive";
              return (
                <div key={a.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                    className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted/30"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {a.respondent_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.respondent_email} · {formatDateTime(a.finished_at)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-muted-foreground">Správne</p>
                      <p className="text-sm font-medium">
                        {correctCount}/{a.answers.length}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-muted-foreground">Čas</p>
                      <p className="text-sm font-medium">{formatDuration(a.duration_ms)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Skóre</p>
                      <p className={`text-lg font-semibold ${scoreColor}`}>{a.score}%</p>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 bg-muted/20 px-4 pb-4 pl-12">
                      {a.answers.map((ans, idx) => {
                        const q = mockQuestions.find((q) => q.id === ans.question_id);
                        return (
                          <div
                            key={ans.question_id}
                            className="flex items-start justify-between gap-3 rounded-md border border-border/40 bg-card p-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 text-xs font-mono text-muted-foreground">
                                #{idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {q?.title ?? ans.question_id}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {q?.excerpt}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Timer className="h-3 w-3" />
                                {formatDuration(ans.time_ms)}
                              </span>
                              {ans.is_correct ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                                  <CheckCircle2 className="mr-1 h-3 w-3" /> Správne
                                </Badge>
                              ) : (
                                <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
                                  <XCircle className="mr-1 h-3 w-3" /> Nesprávne
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-question breakdown */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <h3 className="mb-4 font-semibold text-foreground">Analýza otázok</h3>
          <div className="space-y-3">
            {questionStats.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="truncate font-medium text-foreground">{q.title}</p>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      <Timer className="mr-1 inline h-3 w-3" />
                      {formatDuration(q.avgTime)}
                    </span>
                    <span className="font-mono text-foreground">{q.accuracy}%</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      q.accuracy >= 80
                        ? "bg-emerald-500"
                        : q.accuracy >= 50
                        ? "bg-amber-500"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${q.accuracy}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {q.correct} z {q.total} respondentov odpovedalo správne
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | number;
  Icon: typeof Users;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Header() {
  return (
    <header className="border-b border-border/40 bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          SubenAI
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3 text-sm">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {currentUser.avatar_initials}
          </span>
          <span className="hidden sm:inline">{currentUser.display_name}</span>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Shield, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getTestByShareId, getQuestion, createSession, completeSession } from "@/lib/platform/store";

export const Route = createFileRoute("/t/$shareId")({
  head: () => ({ meta: [{ title: "SubenAI — vypĺňanie testu" }, { name: "robots", content: "noindex" }] }),
  component: RespondentPage,
});

type Stage = "intro" | "password" | "intake" | "questions" | "done";

function RespondentPage() {
  const { shareId } = Route.useParams();
  const nav = useNavigate();
  const test = getTestByShareId(shareId);

  const [stage, setStage] = useState<Stage>("intro");
  const [consent, setConsent] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwAttempts, setPwAttempts] = useState(0);
  const [intake, setIntake] = useState<Record<string, string>>({});
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: string; value: string; is_correct: boolean | null; time_ms: number }[]>([]);
  const [questionStart, setQuestionStart] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card><CardContent className="p-8 text-center"><p>Test nebol nájdený.</p><Link to="/" className="text-primary underline">Domov</Link></CardContent></Card>
      </div>
    );
  }

  const questions = test.question_ids.map((qid) => getQuestion(qid)).filter(Boolean) as ReturnType<typeof getQuestion>[];

  const startTest = () => {
    if (!consent) return toast.error("Pre pokračovanie udeľ súhlas s GDPR.");
    if (test.password) return setStage("password");
    setStage("intake");
  };

  const submitPassword = () => {
    if (pwInput === test.password) { setPwAttempts(0); setStage("intake"); return; }
    const n = pwAttempts + 1;
    setPwAttempts(n);
    if (n >= 5) toast.error("Príliš veľa pokusov — IP zablokovaná na 15 min (demo).");
    else toast.error(`Nesprávne heslo (${n}/5)`);
  };

  const startQuestions = () => {
    const missing = test.intake_fields.filter((f) => f.required && !intake[f.id]);
    if (missing.length) return toast.error(`Vyplň: ${missing.map((m) => m.label).join(", ")}`);
    const s = createSession(test.id, intake, consent);
    setSessionId(s.id);
    setQuestionStart(Date.now());
    setStage("questions");
  };

  const answer = (value: string) => {
    const q = questions[qIdx]!;
    const time_ms = Date.now() - questionStart;
    const expected = Array.isArray(q.correct) ? (q.options?.[q.correct[0]] ?? null) : (typeof q.correct === "string" ? q.correct : null);
    const is_correct = expected ? value === expected : null;
    const next = [...answers, { question_id: q.id, value, is_correct, time_ms }];
    setAnswers(next);
    if (qIdx + 1 < questions.length) {
      setQIdx(qIdx + 1);
      setQuestionStart(Date.now());
    } else {
      const score = completeSession(sessionId!, next);
      setFinalScore(score);
      setStage("done");
    }
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground"><Sparkles className="h-4 w-4" /></span>
            SubenAI
          </Link>
          <Badge variant="outline">Účel: {test.gdpr_purpose}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {stage === "intro" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <h1 className="text-2xl font-semibold">{test.title}</h1>
              <p className="text-sm text-muted-foreground">{test.description}</p>
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> GDPR — súhlas so spracovaním</p>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                  <li>Účel: <strong>{test.gdpr_purpose}</strong></li>
                  <li>Doba uchovania: {test.anonymize_after_days ? `${test.anonymize_after_days} dní (potom anonymizácia)` : "podľa potreby"}</li>
                  <li>Behaviorálne tracking eventy: {test.allow_behavioral_tracking ? "áno" : "nie"}</li>
                  <li>Tvoje práva: prístup, výmaz, portabilita (DSR formulár v Helpe)</li>
                </ul>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} />
                Súhlasím so spracovaním údajov pre uvedený účel.
              </label>
              <Button onClick={startTest} className="w-full">Začať test</Button>
            </CardContent>
          </Card>
        )}

        {stage === "password" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Heslo</h2>
              <p className="text-sm text-muted-foreground">Autor testu vyžaduje heslo.</p>
              <Input type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} placeholder="Zadaj heslo" />
              {pwAttempts > 0 && <p className="text-xs text-destructive">Pokusy: {pwAttempts}/5</p>}
              <Button onClick={submitPassword} disabled={pwAttempts >= 5}>Pokračovať</Button>
            </CardContent>
          </Card>
        )}

        {stage === "intake" && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">Pred začiatkom</h2>
              {test.intake_fields.map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label>{f.label}{f.required && <span className="text-destructive"> *</span>} {f.pii && <Badge variant="outline" className="ml-1 text-[10px]">PII</Badge>}</Label>
                  {f.type === "select" ? (
                    <select className="w-full rounded-md border bg-background p-2" value={intake[f.id] ?? ""} onChange={(e) => setIntake({ ...intake, [f.id]: e.target.value })}>
                      <option value="">Vyber...</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <Input type={f.type === "email" ? "email" : f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={intake[f.id] ?? ""} onChange={(e) => setIntake({ ...intake, [f.id]: e.target.value })} />
                  )}
                </div>
              ))}
              <Button onClick={startQuestions} className="w-full">Pokračovať na otázky</Button>
            </CardContent>
          </Card>
        )}

        {stage === "questions" && questions[qIdx] && (
          <div className="space-y-4">
            <Progress value={((qIdx + 1) / questions.length) * 100} />
            <p className="text-xs text-muted-foreground">Otázka {qIdx + 1} z {questions.length}</p>
            <Card>
              <CardContent className="space-y-4 p-6">
                <p className="text-base font-medium">{questions[qIdx]!.prompt}</p>
                {questions[qIdx]!.options ? (
                  <RadioGroup onValueChange={answer}>
                    {questions[qIdx]!.options!.map((o) => (
                      <label key={o} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted">
                        <RadioGroupItem value={o} /> {o}
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    <Input placeholder="Tvoja odpoveď..." onKeyDown={(e) => { if (e.key === "Enter") answer((e.target as HTMLInputElement).value); }} />
                    <p className="text-xs text-muted-foreground">Stlač Enter pre odoslanie</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {stage === "done" && (
          <Card>
            <CardContent className="space-y-4 p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="text-2xl font-semibold">Hotovo!</h2>
              <p className="text-6xl font-bold">{finalScore}%</p>
              <p className="text-sm text-muted-foreground">Tvoje skóre bolo uložené. Autor testu dostane notifikáciu.</p>
              <Button variant="outline" onClick={() => nav({ to: "/" })}>Zatvoriť</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

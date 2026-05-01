import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { TestFlow } from "@/components/quiz/TestFlow";
import { Button } from "@/components/ui/button";
import {
  RespondentIntakeForm,
  type RespondentIntakeOk,
} from "@/components/composer/RespondentIntakeForm";
import { supabase } from "@/integrations/supabase/client";
import { resolveQuestions } from "@/lib/quiz/composer";
import { ROUTES } from "@/config/routes";

type Status = "loading" | "ready" | "not_found" | "error";

interface TestSetDto {
  id: string;
  question_ids: string[];
  passing_threshold: number;
  max_questions: number;
  creator_label: string | null;
  source_pack_slugs: string[] | null;
  collects_responses: boolean;
  created_at: string;
}

export const Route = createFileRoute("/test/zostava/$id")({
  head: () => ({
    meta: [{ title: "Zdieľaný test — subenai" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: ZostavaPage,
});

function ZostavaPage() {
  const { id } = useParams({ from: "/test/zostava/$id" });
  return <ZostavaView id={id} />;
}

interface Props {
  id: string;
}

export function ZostavaView({ id }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [testSet, setTestSet] = useState<TestSetDto | null>(null);
  const [started, setStarted] = useState(false);
  const [eduIntake, setEduIntake] = useState<RespondentIntakeOk | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("test_sets")
        .select(
          "id, question_ids, passing_threshold, max_questions, creator_label, source_pack_slugs, collects_responses, created_at",
        )
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      if (!data) {
        setStatus("not_found");
        return;
      }
      setTestSet(data as TestSetDto);
      setStatus("ready");
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const resolved = useMemo(() => {
    if (!testSet) return null;
    return resolveQuestions(testSet.question_ids);
  }, [testSet]);

  if (status === "loading") {
    return <CenteredMessage>Načítavam zostavu…</CenteredMessage>;
  }

  if (status === "not_found") {
    return (
      <CenteredMessage tone="warn">
        <h1 className="text-2xl font-bold text-foreground">Test nenájdený</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tento odkaz neukazuje na žiadnu zostavu. Mohol byť odstránený alebo URL je preklepnuté.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to={ROUTES.zostav}>Zostaviť vlastný test</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.testy}>Pozrieť existujúce sady</Link>
          </Button>
        </div>
      </CenteredMessage>
    );
  }

  if (status === "error" || !testSet || !resolved) {
    return (
      <CenteredMessage tone="warn">
        <h1 className="text-2xl font-bold text-foreground">Niečo sa pokazilo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Skús obnoviť stránku. Ak chyba pretrvá, daj nám vedieť cez stránku Kontakt v päte.
        </p>
      </CenteredMessage>
    );
  }

  if (started) {
    return (
      <div className="min-h-screen bg-hero">
        <TestFlow
          config={{
            kind: "composer",
            questions: resolved.questions,
            passingThreshold: testSet.passing_threshold,
            label: "tento test",
            testSetId: testSet.id,
            edu: eduIntake
              ? {
                  token: eduIntake.token,
                  respondentName: eduIntake.name,
                  respondentEmail: eduIntake.email,
                }
              : undefined,
          }}
        />
      </div>
    );
  }

  // Edu mode — intake form precedes the test. Without a successful intake
  // we never call setStarted(true), so this gate is the entry point.
  if (testSet.collects_responses && !eduIntake) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl px-4 pb-12 pt-12 sm:pt-16">
          <header className="text-center md:text-left">
            <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
              ← Späť na domov
            </Link>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {testSet.creator_label?.trim() || "Pripravený test pre teba"}
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              📋 {resolved.questions.length} otázok · vyhovenie pri skóre ≥{" "}
              {testSet.passing_threshold} %
            </p>
          </header>
          <div className="mt-8">
            <RespondentIntakeForm
              setId={testSet.id}
              authorLabel={testSet.creator_label?.trim() || null}
              onReady={(ok) => {
                setEduIntake(ok);
                setStarted(true);
              }}
            />
          </div>
          <Footer />
        </main>
      </div>
    );
  }

  const heading = testSet.creator_label?.trim() || "Pripravený test pre teba";
  const sourcesLine =
    testSet.source_pack_slugs && testSet.source_pack_slugs.length > 0
      ? `Zostavené z ${testSet.source_pack_slugs.length === 1 ? "packu" : "packov"}: ${testSet.source_pack_slugs.join(", ")}`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-12 sm:pt-16">
        <header className="text-center md:text-left">
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            <span aria-label="Počet otázok">📋 {resolved.questions.length} otázok</span>
            {" · "}
            <span>Vyhovenie pri skóre ≥ {testSet.passing_threshold} %</span>
          </p>
          {sourcesLine ? <p className="mt-2 text-sm text-muted-foreground">{sourcesLine}</p> : null}
          {resolved.missing > 0 ? (
            <p
              role="status"
              className="mt-4 inline-block rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground"
            >
              Z pôvodnej zostavy chýba {resolved.missing}{" "}
              {resolved.missing === 1 ? "otázka" : "otázok"} — autor banky ich pravdepodobne
              premenoval. Test pobeží s {resolved.questions.length} platnými.
            </p>
          ) : null}
        </header>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <Button
            size="lg"
            onClick={() => setStarted(true)}
            disabled={resolved.questions.length === 0}
          >
            Spustiť test →
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.zostav}>Zostaviť vlastný</Link>
          </Button>
        </div>

        {resolved.questions.length === 0 ? (
          <p className="mt-6 text-center text-sm text-warning md:text-left">
            Z tejto zostavy nezostala žiadna platná otázka. Daj autorovi vedieť, alebo si zostav
            vlastný test.
          </p>
        ) : null}

        <Footer />
      </main>
    </div>
  );
}

function CenteredMessage({ children, tone }: { children: React.ReactNode; tone?: "warn" }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div
          className={
            tone === "warn"
              ? "rounded-2xl border border-amber-500/40 bg-card/60 p-6"
              : "text-sm text-muted-foreground"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}

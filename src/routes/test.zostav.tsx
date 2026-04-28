import { useCallback, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { PackPreloadChips } from "@/components/composer/PackPreloadChips";
import { QuestionPicker } from "@/components/composer/QuestionPicker";
import { ComposerSettings } from "@/components/composer/ComposerSettings";
import { listPublishedPacks, getPackBySlug } from "@/content/test-packs";
import { QUESTIONS } from "@/lib/quiz/questions";
import {
  COMPOSER_LIMITS,
  computeHoneypotRatio,
  decodeConfig,
  validateComposerConfig,
} from "@/lib/quiz/composer";
import { ROUTES } from "@/config/routes";

interface ZostavSearch {
  config?: string;
}

export const Route = createFileRoute("/test/zostav")({
  validateSearch: (search: Record<string, unknown>): ZostavSearch => ({
    config: typeof search.config === "string" ? search.config : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Zostav vlastný test pre tím — subenai" },
      {
        name: "description",
        content:
          "Vyber otázky podľa kategórie a obtiažnosti, nastav prah úspešnosti, zdieľaj test s tímom. Žiadna registrácia, anonymné výsledky.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: ComposerPage,
});

function ComposerPage() {
  const search = useSearch({ from: "/test/zostav" });
  const navigate = useNavigate();

  const initial = useMemo(() => {
    if (!search.config) return null;
    const decoded = decodeConfig(search.config);
    if (!decoded) return null;
    const validation = validateComposerConfig(decoded);
    if (!validation.ok) return null;
    return decoded;
  }, [search.config]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initial?.questionIds ?? []),
  );
  const [selectedPackSlugs, setSelectedPackSlugs] = useState<Set<string>>(
    () => new Set(initial?.sourcePackSlugs ?? []),
  );
  const [passingThreshold, setPassingThreshold] = useState(
    initial?.passingThreshold ?? COMPOSER_LIMITS.defaultThreshold,
  );
  const [maxQuestions, setMaxQuestions] = useState(
    initial?.maxQuestions ?? COMPOSER_LIMITS.defaultMax,
  );
  const [creatorLabel, setCreatorLabel] = useState(initial?.creatorLabel ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packs = useMemo(() => listPublishedPacks(), []);
  const honeypotRatio = useMemo(() => computeHoneypotRatio(Array.from(selectedIds)), [selectedIds]);

  const togglePack = useCallback((slug: string) => {
    const pack = getPackBySlug(slug);
    if (!pack) return;
    setSelectedPackSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        // Remove pack's question_ids — but keep manually-added ones
        // (a question is "manual" only if no other selected pack still
        // references it).
        setSelectedIds((prevIds) => {
          const stillReferenced = new Set<string>();
          for (const otherSlug of next) {
            const other = getPackBySlug(otherSlug);
            other?.questionIds.forEach((id) => stillReferenced.add(id));
          }
          const removed = new Set(pack.questionIds);
          const result = new Set<string>();
          for (const id of prevIds) {
            if (!removed.has(id) || stillReferenced.has(id)) result.add(id);
          }
          return result;
        });
      } else {
        next.add(slug);
        setSelectedIds((prevIds) => {
          const result = new Set(prevIds);
          for (const id of pack.questionIds) {
            if (result.size >= COMPOSER_LIMITS.maxQuestions) break;
            result.add(id);
          }
          return result;
        });
      }
      return next;
    });
  }, []);

  const toggleQuestion = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < COMPOSER_LIMITS.maxQuestions) next.add(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (selectedIds.size >= 10) {
      const ok = window.confirm(
        `Zrušiť výber? Stratíš ${selectedIds.size} vybraných otázok. Akciu nedá vrátiť späť.`,
      );
      if (!ok) return;
    }
    setSelectedIds(new Set());
    setSelectedPackSlugs(new Set());
    setError(null);
  }, [selectedIds.size]);

  const selectedCount = selectedIds.size;
  const canSubmit =
    selectedCount >= COMPOSER_LIMITS.minQuestions &&
    selectedCount <= COMPOSER_LIMITS.maxQuestions &&
    selectedCount <= maxQuestions &&
    !submitting;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const ids = Array.from(selectedIds);
      const response = await fetch("/api/test-sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question_ids: ids,
          passing_threshold: passingThreshold,
          max_questions: ids.length,
          creator_label: creatorLabel.trim() || undefined,
          source_pack_slugs: selectedPackSlugs.size > 0 ? Array.from(selectedPackSlugs) : undefined,
        }),
      });
      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        setError(payload.error ?? "submit_failed");
        setSubmitting(false);
        return;
      }
      navigate({ to: ROUTES.zostava, params: { id: payload.id } });
    } catch {
      setError("network_error");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-10 text-center md:text-left">
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Zostav vlastný test pre tím
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Vyber otázky podľa <strong className="text-foreground">tvojej</strong> branže a hrozieb,
            nastav prah úspešnosti, zdieľaj jediným linkom. Žiadna registrácia, anonymné výsledky.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12" aria-labelledby="composer-h">
          <h2 id="composer-h" className="sr-only">
            Composer testu
          </h2>

          <section aria-labelledby="step-1-h" className="space-y-3">
            <h3 id="step-1-h" className="text-lg font-semibold text-foreground">
              <span className="text-primary">1.</span> Predefinované sady{" "}
              <span className="text-sm font-normal text-muted-foreground">(voliteľné)</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Klikni na sady ktoré najlepšie pasujú tvojej firme. Otázky sa pridajú automaticky;
              môžeš ich neskôr odobrať alebo doplniť ručne.
            </p>
            <PackPreloadChips
              packs={packs}
              selectedSlugs={selectedPackSlugs}
              onToggle={togglePack}
            />
          </section>

          <section
            aria-labelledby="step-2-h"
            className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6"
          >
            <h3 id="step-2-h" className="text-lg font-semibold text-foreground">
              <span className="text-primary">2.</span> Otázky
            </h3>
            <QuestionPicker
              questions={QUESTIONS}
              selectedIds={selectedIds}
              onToggle={toggleQuestion}
            />
          </section>

          <section
            aria-labelledby="step-3-h"
            className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6"
          >
            <h3 id="step-3-h" className="text-lg font-semibold text-foreground">
              <span className="text-primary">3.</span> Nastavenia
            </h3>
            <ComposerSettings
              passingThreshold={passingThreshold}
              onThresholdChange={setPassingThreshold}
              maxQuestions={maxQuestions}
              onMaxQuestionsChange={setMaxQuestions}
              selectedCount={selectedCount}
              honeypotRatio={honeypotRatio}
              creatorLabel={creatorLabel}
              onCreatorLabelChange={setCreatorLabel}
            />
          </section>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-foreground"
            >
              Niečo sa pokazilo: <code>{error}</code>. Skús to prosím znova.
            </div>
          ) : null}
        </form>

        <Footer />
      </main>

      <div
        role="region"
        aria-label="Akcie composeru"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={`text-sm font-semibold ${
              canSubmit ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {selectedCount < COMPOSER_LIMITS.minQuestions
              ? `Vyber aspoň ${COMPOSER_LIMITS.minQuestions} otázok (zostáva ${COMPOSER_LIMITS.minQuestions - selectedCount})`
              : `Vybraných: ${selectedCount} · prah ${passingThreshold} %`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedCount === 0 || submitting}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vyčistiť výber
            </button>
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector("form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-gradient px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? "Ukladám…" : "Zdieľať zostavu"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

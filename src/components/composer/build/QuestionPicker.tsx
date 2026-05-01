import { useMemo, useState, type ChangeEvent } from "react";
import type { Category, Difficulty, Question } from "@/lib/quiz/bank/questions";
import { COMPOSER_LIMITS } from "@/lib/quiz/composer";

const CATEGORY_LABELS: Record<Category, string> = {
  phishing: "Phishing",
  url: "URL",
  fake_vs_real: "Fake vs. real",
  scenario: "Scenár",
  honeypot: "Vyzerá podozrivo, ale OK",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Ľahké",
  medium: "Stredné",
  hard: "Ťažké",
};

const ALL_CATEGORIES: Category[] = ["phishing", "url", "fake_vs_real", "scenario", "honeypot"];
const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  questions: Question[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

export function QuestionPicker({ questions, selectedIds, onToggle }: Props) {
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set());
  const [activeDifficulties, setActiveDifficulties] = useState<Set<Difficulty>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (activeCategories.size > 0 && !activeCategories.has(q.category)) return false;
      if (activeDifficulties.size > 0 && !activeDifficulties.has(q.difficulty)) return false;
      if (trimmed && !q.prompt.toLowerCase().includes(trimmed)) return false;
      return true;
    });
  }, [questions, activeCategories, activeDifficulties, search]);

  const atMax = selectedIds.size >= COMPOSER_LIMITS.maxQuestions;

  function toggleCategory(c: Category) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }
  function toggleDifficulty(d: Difficulty) {
    setActiveDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <FilterRow
          label="Kategória"
          options={ALL_CATEGORIES}
          activeSet={activeCategories}
          onToggle={(c) => toggleCategory(c as Category)}
          labels={CATEGORY_LABELS}
        />
        <FilterRow
          label="Obtiažnosť"
          options={ALL_DIFFICULTIES}
          activeSet={activeDifficulties}
          onToggle={(d) => toggleDifficulty(d as Difficulty)}
          labels={DIFFICULTY_LABELS}
        />
        <div>
          <label htmlFor="picker-search" className="sr-only">
            Hľadaj v texte otázky
          </label>
          <input
            id="picker-search"
            type="search"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Hľadaj v texte otázky…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p
          aria-live="polite"
          className={`font-semibold ${atMax ? "text-amber-500" : "text-foreground"}`}
        >
          Vybraných: {selectedIds.size} / {COMPOSER_LIMITS.maxQuestions}
        </p>
        <p className="text-xs text-muted-foreground">
          {filtered.length} z {questions.length} otázok zodpovedá filtru
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-card/50 p-4 text-center text-sm text-muted-foreground">
          Filtru nezodpovedá žiadna otázka. Skús uvolniť kategóriu alebo zmazať vyhľadávanie.
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {filtered.map((q) => {
            const selected = selectedIds.has(q.id);
            const disabled = !selected && atMax;
            return (
              // AC-10 native virtualization: content-visibility:auto skips
              // paint + layout for off-screen items; contain-intrinsic-size
              // gives the browser a height hint so the scrollbar stays
              // accurate. Zero JS overhead vs react-window. Graceful fallback
              // on older browsers — they just paint everything.
              <li key={q.id} className="[content-visibility:auto] [contain-intrinsic-size:0_88px]">
                <label
                  htmlFor={`pick-${q.id}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    selected
                      ? "border-primary/60 bg-primary/5"
                      : disabled
                        ? "cursor-not-allowed border-border/40 bg-card/30 opacity-60"
                        : "border-border bg-card/70 hover:border-primary/30"
                  }`}
                >
                  <input
                    id={`pick-${q.id}`}
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => onToggle(q.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border bg-background"
                  />
                  <div className="flex-1 space-y-1 text-sm">
                    <p className="font-medium text-foreground">{q.prompt}</p>
                    <p className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {CATEGORY_LABELS[q.category]}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </span>
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface FilterRowProps<T extends string> {
  label: string;
  options: readonly T[];
  activeSet: ReadonlySet<T>;
  onToggle: (option: T) => void;
  labels: Record<T, string>;
}

function FilterRow<T extends string>({
  label,
  options,
  activeSet,
  onToggle,
  labels,
}: FilterRowProps<T>) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = activeSet.has(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {labels[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getTestQuestions, type Question } from "@/lib/quiz/questions";
import {
  buildAnswerRecord,
  computeScore,
  type AnswerRecord,
  type ScoreResult,
} from "@/lib/quiz/scoring";
import { QuestionCard } from "./QuestionCard";
import { ResultsView } from "./ResultsView";

type Phase = "intro" | "playing" | "done";

/**
 * Unified config for TestFlow. The default flow uses the random
 * banked picker. Pack and composer flows pass a curated, ordered
 * list with custom passing threshold and a label rendered as the
 * „Vyhovuje pre {label}" badge in ResultsView.
 */
export type TestFlowConfig =
  | { kind: "default" }
  | {
      kind: "pack";
      questions: Question[];
      passingThreshold: number;
      label: string;
    }
  | {
      kind: "composer";
      questions: Question[];
      passingThreshold: number;
      label: string;
      testSetId: string;
    };

const RESULT_STORAGE_KEY_PREFIX = "iiq_last_result_v1";

interface PersistedResult {
  result: ScoreResult;
  answers: AnswerRecord[];
}

function storageKeyFor(config: TestFlowConfig): string {
  if (config.kind === "default") return `${RESULT_STORAGE_KEY_PREFIX}:default`;
  if (config.kind === "pack") return `${RESULT_STORAGE_KEY_PREFIX}:pack:${config.label}`;
  return `${RESULT_STORAGE_KEY_PREFIX}:composer:${config.testSetId}`;
}

function isBackForwardNavigation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const entry = window.performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    return entry?.type === "back_forward";
  } catch {
    return false;
  }
}

function loadPersistedResult(key: string): PersistedResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedResult;
    if (!parsed.result || !Array.isArray(parsed.answers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedResult(key: string, payload: PersistedResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // sessionStorage can be disabled / quota-full; non-fatal.
  }
}

function clearPersistedResult(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // non-fatal
  }
}

export function TestFlow({ config = { kind: "default" } }: { config?: TestFlowConfig } = {}) {
  const storageKey = storageKeyFor(config);
  // Restore prior completed test ONLY when the user used the browser's
  // back/forward button — fresh navigation (link click, address bar) must
  // start a clean test, even if a stale result lives in sessionStorage.
  // Drop any stale entry for this key on fresh navigation so it can't
  // resurface later in the same tab via cross-test contamination.
  const restored =
    typeof window !== "undefined" && isBackForwardNavigation()
      ? loadPersistedResult(storageKey)
      : (clearPersistedResult(storageKey), null);

  const [phase, setPhase] = useState<Phase>(restored ? "done" : "intro");
  const [questions, setQuestions] = useState<Question[]>(
    config.kind === "default" ? [] : config.questions,
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>(restored?.answers ?? []);
  const [result, setResult] = useState<ScoreResult | null>(restored?.result ?? null);

  // Pick questions on mount — only when starting fresh.
  useEffect(() => {
    if (restored) return;
    if (config.kind === "default") {
      setQuestions(getTestQuestions());
    } else {
      setQuestions(config.questions);
    }
    const t = setTimeout(() => setPhase("playing"), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(optionId: string | null, responseMs: number) {
    const q = questions[index];
    const record = buildAnswerRecord(q, optionId, responseMs);
    const next = [...answers, record];
    setAnswers(next);

    if (index + 1 >= questions.length) {
      const finalResult = computeScore(next);
      setResult(finalResult);
      setPhase("done");
      savePersistedResult(storageKey, { result: finalResult, answers: next });
    } else {
      setIndex(index + 1);
    }
  }

  function restart() {
    clearPersistedResult(storageKey);
    setQuestions(config.kind === "default" ? getTestQuestions() : config.questions);
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setPhase("intro");
    setTimeout(() => setPhase("playing"), 700);
  }

  const passingThreshold = config.kind === "default" ? undefined : config.passingThreshold;
  const passLabel = config.kind === "default" ? undefined : config.label;

  // Render done state FIRST — when restoring from sessionStorage we have
  // result but questions=[] (questions are reshuffled on restart, not
  // needed for the review screen which looks them up by id).
  if (phase === "done" && result) {
    return (
      <ResultsView
        result={result}
        answers={answers}
        onRestart={restart}
        passingThreshold={passingThreshold}
        passLabel={passLabel}
      />
    );
  }

  if (phase === "intro" || questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="text-3xl font-bold animate-fade-in-up">Pripravený?</div>
        <div className="mt-2 text-muted-foreground animate-fade-in-up">
          Odpovedaj rýchlo. Čas beží.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Späť
        </Link>
      </div>
      <QuestionCard
        question={questions[index]}
        index={index}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  );
}

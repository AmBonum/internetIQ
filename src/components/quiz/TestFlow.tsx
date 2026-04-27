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

const RESULT_STORAGE_KEY = "iiq_last_result_v1";

interface PersistedResult {
  result: ScoreResult;
  answers: AnswerRecord[];
}

function loadPersistedResult(): PersistedResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedResult;
    if (!parsed.result || !Array.isArray(parsed.answers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedResult(payload: PersistedResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage can be disabled / quota-full; non-fatal.
  }
}

function clearPersistedResult() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

export function TestFlow({ config = { kind: "default" } }: { config?: TestFlowConfig } = {}) {
  // Restore prior completed test from sessionStorage (per-tab) so that
  // browser-back from a course CTA returns the user to their result
  // instead of restarting the quiz.
  const restored = typeof window !== "undefined" ? loadPersistedResult() : null;

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
      savePersistedResult({ result: finalResult, answers: next });
    } else {
      setIndex(index + 1);
    }
  }

  function restart() {
    clearPersistedResult();
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

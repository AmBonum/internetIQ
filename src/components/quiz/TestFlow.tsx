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

export function TestFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);

  // Pick questions on mount
  useEffect(() => {
    setQuestions(getTestQuestions());
    // brief intro pause
    const t = setTimeout(() => setPhase("playing"), 900);
    return () => clearTimeout(t);
  }, []);

  function handleAnswer(optionId: string | null, responseMs: number) {
    const q = questions[index];
    const record = buildAnswerRecord(q, optionId, responseMs);
    const next = [...answers, record];
    setAnswers(next);

    if (index + 1 >= questions.length) {
      setResult(computeScore(next));
      setPhase("done");
    } else {
      setIndex(index + 1);
    }
  }

  function restart() {
    setQuestions(getTestQuestions());
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setPhase("intro");
    setTimeout(() => setPhase("playing"), 700);
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

  if (phase === "done" && result) {
    return <ResultsView result={result} answers={answers} onRestart={restart} />;
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

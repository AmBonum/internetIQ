import type { Question } from "@/lib/quiz/bank/questions";

export type AnswerFeedbackState = "correct" | "wrong" | "timeout";
export type AnswerFeedbackMode = "live" | "review";

export function deriveState(question: Question, selectedId: string | null): AnswerFeedbackState {
  if (selectedId === null) return "timeout";
  const picked = question.options.find((o) => o.id === selectedId);
  return picked?.correct ? "correct" : "wrong";
}

export const HEADLINES: Record<AnswerFeedbackMode, Record<AnswerFeedbackState, string>> = {
  live: {
    timeout: "⏱️ Príliš pomaly. Scammer by ťa už dostal.",
    correct: "✅ Správne. Scammer si hľadá ďalšieho.",
    wrong: "❌ Ups. Nalietol si.",
  },
  review: {
    timeout: "⏱️ Nezodpovedané — vypršal čas.",
    correct: "✅ Správna odpoveď.",
    wrong: "❌ Nesprávna odpoveď.",
  },
};

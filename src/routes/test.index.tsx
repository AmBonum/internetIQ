import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const TestFlow = lazy(() =>
  import("@/components/quiz/TestFlow").then((m) => ({ default: m.TestFlow })),
);

export const Route = createFileRoute("/test/")({
  head: () => ({
    meta: [
      { title: "Test prebieha · subenai" },
      {
        name: "description",
        content: "Odpovedaj rýchlo. Čas beží. 10 otázok. 90 sekúnd.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TestPage,
});

function TestPage() {
  return (
    <div className="min-h-screen bg-hero">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            Načítavam test…
          </div>
        }
      >
        <TestFlow />
      </Suspense>
    </div>
  );
}

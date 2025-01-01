import { createFileRoute } from "@tanstack/react-router";
import { TestFlow } from "@/components/quiz/TestFlow";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Test prebieha · Internet IQ Test" },
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
      <TestFlow />
    </div>
  );
}

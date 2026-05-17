import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[image:var(--gradient-subtle)] px-4">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">SubenAI Admin Console</h1>
        <p className="mt-3 text-muted-foreground">
          Administračné rozhranie pre platformu <span className="font-medium text-foreground">subenai.sk</span> —
          správa otázok, používateľov, kategórií a reportov na jednom mieste.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/app">
              Moje sady testov <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Prihlásenie</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/docs">Dokumentácia</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/admin-login">Admin</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

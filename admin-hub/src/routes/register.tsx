import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Registrácia · SubenAI" },
      { name: "description", content: "Vytvor si účet a začni rozosielať vlastné sady testov." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [accept, setAccept] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accept) return toast.error("Musíš súhlasiť s podmienkami používania");
    if (form.password.length < 8) return toast.error("Heslo musí mať aspoň 8 znakov");
    toast.success("Účet vytvorený (dummy)");
    navigate({ to: "/app" });
  };

  return (
    <AuthShell
      title="Vytvor si účet"
      subtitle="Zadarmo, bez kreditiek. Stačí email."
      footer={
        <span>
          Už máš účet?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Prihlás sa
          </Link>
        </span>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => toast.info("Google sign-up — pripravený na napojenie")}
      >
        Pokračovať cez Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[image:var(--gradient-subtle)] px-2 text-muted-foreground">alebo</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Meno</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jana Nováková"
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="tvoj@email.sk"
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Heslo</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="aspoň 8 znakov"
              className="pl-9"
              required
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={accept}
            onCheckedChange={(v) => setAccept(Boolean(v))}
            className="mt-0.5"
          />
          <span>
            Súhlasím s{" "}
            <a href="#" className="text-foreground underline-offset-2 hover:underline">
              podmienkami používania
            </a>{" "}
            a{" "}
            <a href="#" className="text-foreground underline-offset-2 hover:underline">
              ochranou súkromia
            </a>
            .
          </span>
        </label>

        <Button type="submit" className="w-full">
          Vytvoriť účet
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}

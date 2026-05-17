import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Prihlásenie · SubenAI" },
      { name: "description", content: "Prihlás sa do SubenAI a spravuj svoje vlastné sady testov." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Vyplň email a heslo");
    setLoading(true);
    // TODO: napojiť na Lovable Cloud (supabase.auth.signInWithPassword)
    setTimeout(() => {
      toast.success("Prihlásený (dummy)");
      setLoading(false);
      navigate({ to: "/app" });
    }, 400);
  };

  return (
    <AuthShell
      title="Prihlás sa do SubenAI"
      subtitle="Pokračuj s emailom alebo cez Google."
      footer={
        <span>
          Ešte nemáš účet?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Vytvor si ho zadarmo
          </Link>
        </span>
      }
    >
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => toast.info("Google login — pripravený na napojenie")}
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        Pokračovať cez Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[image:var(--gradient-subtle)] px-2 text-muted-foreground">alebo email</span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tvoj@email.sk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Heslo</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
              Zabudol som heslo
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
          Zapamätaj si ma na tomto zariadení
        </label>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Prihlasujem..." : "Prihlásiť sa"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Si admin?{" "}
        <Link to="/admin-login" className="font-medium text-foreground hover:text-primary">
          Prihlásenie pre administrátorov
        </Link>
      </p>
    </AuthShell>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24 12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3C40.4 35.7 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

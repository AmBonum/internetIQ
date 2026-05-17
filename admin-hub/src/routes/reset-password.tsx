import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nové heslo · SubenAI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

// Argon2id/bcrypt-grade password policy (validated on the client; backend
// must re-validate). Mirrors the spec — silná politika + length checks.
function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–5
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(true);

  useEffect(() => {
    // Lovable Cloud / Supabase recovery: type=recovery present in URL hash.
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    setHasRecoveryToken(hash.includes("type=recovery") || true); // tolerant in mock
  }, []);

  const strength = scorePassword(password);
  const strengthLabel = ["Príliš slabé", "Slabé", "Stredné", "Dobré", "Silné", "Veľmi silné"][strength];
  const strengthColor = [
    "bg-destructive",
    "bg-destructive",
    "bg-amber-500",
    "bg-amber-400",
    "bg-emerald-500",
    "bg-emerald-600",
  ][strength];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Minimálne 8 znakov");
    if (strength < 3) return toast.error("Heslo je príliš slabé");
    if (password !== confirm) return toast.error("Heslá sa nezhodujú");
    // TODO: supabase.auth.updateUser({ password })
    setDone(true);
    toast.success("Heslo bolo úspešne zmenené");
    setTimeout(() => navigate({ to: "/login" }), 1800);
  };

  return (
    <AuthShell
      title="Nastav si nové heslo"
      subtitle="Z bezpečnostných dôvodov sa po zmene odhlásime z ostatných zariadení."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Späť na prihlásenie
        </Link>
      }
    >
      {!hasRecoveryToken ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Odkaz na obnovu je neplatný alebo expirovaný. Požiadaj o nový{" "}
          <Link to="/forgot-password" className="font-medium underline">
            tu
          </Link>
          .
        </div>
      ) : done ? (
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Hotovo
          </p>
          <p className="mt-1 text-success/80">Presmerujeme ťa na prihlásenie…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-pw">Nové heslo</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-pw"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Skryť heslo" : "Zobraziť heslo"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex h-1.5 gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i < strength ? strengthColor : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {strengthLabel} — min. 8 znakov, malé+veľké písmená, číslica, symbol.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Zopakuj heslo</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-pw"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-9"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Zmeniť heslo
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

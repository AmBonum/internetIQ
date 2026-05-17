import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck, KeyRound } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin prihlásenie · SubenAI" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Vyplň prihlasovacie údaje");
    if (otp.length < 6) return toast.error("Zadaj 6-miestny 2FA kód");
    setLoading(true);
    // TODO: napojiť na Lovable Cloud (supabase.auth) + overiť admin rolu z user_roles tabuľky
    setTimeout(() => {
      try { localStorage.setItem("subenai.isAdmin", "1"); } catch { /* ignore */ }
      toast.success("Vitaj späť, admin (dummy)");
      setLoading(false);
      navigate({ to: "/admin" });
    }, 500);
  };

  return (
    <AuthShell
      variant="admin"
      title="Admin prihlásenie"
      subtitle="Iba pre overených administrátorov subenai.sk."
      footer={
        <span>
          Si bežný používateľ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Prihlás sa tu
          </Link>
        </span>
      }
    >
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          Chránené dvojfaktorovou autentifikáciou
        </p>
        <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">
          Po napojení na Lovable Cloud sa rola overuje cez tabuľku <code>user_roles</code> s
          policy <code>has_role(auth.uid(), &apos;admin&apos;)</code>.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email">Pracovný email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="admin@subenai.sk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-pass">Heslo</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="admin-pass"
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

        <div className="space-y-2">
          <Label htmlFor="otp">2FA kód (TOTP)</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123 456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="pl-9 tracking-[0.4em]"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Overujem..." : "Vstúpiť do admina"}
        </Button>
      </form>
    </AuthShell>
  );
}

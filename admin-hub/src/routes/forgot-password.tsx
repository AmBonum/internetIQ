import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Obnova hesla · SubenAI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Zadaj svoj email");
    // TODO: supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })
    setSent(true);
    toast.success("Email s inštrukciami bol odoslaný");
  };

  return (
    <AuthShell
      title="Zabudol si heslo?"
      subtitle="Pošleme ti odkaz na nastavenie nového."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Späť na prihlásenie
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Skontroluj si email
          </p>
          <p className="mt-1 text-success/80">
            Ak existuje účet s adresou <strong>{email}</strong>, do pár minút ti príde odkaz na
            obnovenie hesla. Skontroluj aj priečinok Spam.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reset-email"
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
          <Button type="submit" className="w-full">
            Poslať odkaz
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

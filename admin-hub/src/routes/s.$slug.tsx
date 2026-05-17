import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  Play,
  Sparkles,
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { branchLabel } from "@/lib/admin-mock-data";
import { mockUserSets } from "@/lib/user-mock-data";

export const Route = createFileRoute("/s/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Pozvánka do testu · SubenAI` },
      {
        name: "description",
        content: `Otestuj sa v sade "${params.slug}" — krátky test rozpoznávania podvodov od SubenAI.`,
      },
      { property: "og:title", content: "Som pozvaný do testu na SubenAI" },
      { property: "og:description", content: "Krátky test rozpoznávania podvodov." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RespondentLandingPage,
});

// Mock: niektoré sady majú per-test heslo (autor ho nastavil pri tvorbe).
// V realite: GET /api/share/:slug → { requires_password, set_summary, ... }
const passwordProtectedSlugs = new Set(["uctaren-q4"]);

function RespondentLandingPage() {
  const { slug } = Route.useParams();
  const set = useMemo(() => mockUserSets.find((s) => s.slug === slug), [slug]);

  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(
    !set || !passwordProtectedSlugs.has(slug),
  );
  const [consent, setConsent] = useState(false);
  const [behavioral, setBehavioral] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (!set) {
    return (
      <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Odkaz je neplatný alebo expirovaný
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sada <code className="rounded bg-muted px-1.5 py-0.5">/s/{slug}</code> už nie je dostupná.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Naspäť na SubenAI</Link>
          </Button>
        </main>
      </div>
    );
  }

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Zadaj heslo");
    // TODO: server check (Argon2id), rate-limited
    if (password.length < 3) {
      return toast.error("Nesprávne heslo");
    }
    setAuthenticated(true);
    toast.success("Sada odomknutá");
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return toast.error("Bez súhlasu so spracovaním nemôžeme pokračovať");
    if (!name.trim()) return toast.error("Zadaj svoje meno / prezývku");
    // TODO: POST /api/share/:slug/sessions { name, email, consent, behavioral }
    toast.success("Test sa spúšťa…");
    // Tu by sme presmerovali na /t/{sessionId}/q/1
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-subtle)]">
      <Header />

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Test summary */}
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Pozýva ťa {set.owner_name}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {set.title}
                </h1>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{set.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {set.categories.map((c) => (
                <Badge key={c} variant="secondary" className="font-normal">
                  {branchLabel(c)}
                </Badge>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat icon={ClipboardList} label="Otázok" value={String(set.question_ids.length)} />
              <Stat
                icon={Clock}
                label="Cca čas"
                value={`${Math.max(2, Math.round(set.question_ids.length * 0.5))} min`}
              />
              <Stat icon={Users} label="Pokusov" value={set.attempts.toLocaleString("sk-SK")} />
            </div>

            <Separator />

            <div className="rounded-lg border border-border/40 bg-card/40 p-4 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Odpovede ukladáme pseudonymizovane. Po teste si môžeš zvoliť zaslanie výsledkov
                  na email. Údaje môžeš kedykoľvek vymazať podľa <Link to="/" className="underline">Zásad ochrany súkromia</Link>.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action column */}
        <Card className="border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="space-y-5 p-6 sm:p-8">
            {!authenticated ? (
              <>
                <div className="space-y-1">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Lock className="h-4 w-4 text-primary" /> Vyžaduje sa heslo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Autor ochránil túto sadu jednorazovým heslom. Nájdeš ho v pozvánke.
                  </p>
                </div>
                <form onSubmit={unlock} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="share-pw">Heslo</Label>
                    <Input
                      id="share-pw"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      maxLength={128}
                      autoFocus
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Odomknúť
                  </Button>
                </form>
              </>
            ) : (
              <form onSubmit={start} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Pred štartom</h2>
                  <p className="text-sm text-muted-foreground">
                    Krátky úvod — bez registrácie. Vyplnenie zaberie pár minút.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="r-name">Meno alebo prezývka *</Label>
                  <Input
                    id="r-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="napr. Janka"
                    maxLength={80}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="r-email">
                    Email <span className="text-muted-foreground">(voliteľný — pošleme ti výsledky)</span>
                  </Label>
                  <Input
                    id="r-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ty@example.sk"
                    maxLength={255}
                  />
                </div>

                <Separator />

                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Súhlasím so spracovaním odpovedí pre účely vyhodnotenia tohto testu
                    podľa <Link to="/" className="underline">Zásad ochrany súkromia</Link>. *
                  </span>
                </label>

                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Checkbox
                    checked={behavioral}
                    onCheckedChange={(v) => setBehavioral(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    Voliteľne — povoliť anonymné meranie času na otázku (pomáha zlepšovať obsah).
                  </span>
                </label>

                <Button type="submit" className="w-full" size="lg">
                  <Play className="mr-2 h-4 w-4" /> Začať test
                </Button>

                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-success" /> Bez registrácie · ESC
                  prerušíš kedykoľvek
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border/40 bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          SubenAI
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">Prihlásiť sa</Link>
        </Button>
      </div>
    </header>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

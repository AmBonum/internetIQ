import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { UserCog, Save, RotateCcw, Mail, User as UserIcon, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { useCurrentUser, updateCurrentUser } from "@/lib/platform/store";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/account/profile")({
  head: () => ({ meta: [{ title: "Môj profil · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Meno musí mať aspoň 2 znaky.").max(80, "Maximálne 80 znakov."),
  email: z.string().trim().email("Neplatný formát e-mailu.").max(255),
  avatar_initials: z.string().trim().min(1, "Aspoň 1 znak.").max(3, "Maximálne 3 znaky.").regex(/^[A-Za-zÀ-ž0-9]+$/, "Iba písmená/číslice."),
});

function ProfilePage() {
  const me = useCurrentUser();
  const [displayName, setDisplayName] = useState(me.display_name);
  const [email, setEmail] = useState(me.email);
  const [initials, setInitials] = useState(me.avatar_initials);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // keep form in sync when store changes externally
  useEffect(() => {
    setDisplayName(me.display_name);
    setEmail(me.email);
    setInitials(me.avatar_initials);
  }, [me.display_name, me.email, me.avatar_initials]);

  const dirty =
    displayName !== me.display_name || email !== me.email || initials !== me.avatar_initials;

  const handleSave = () => {
    const parsed = profileSchema.safeParse({
      display_name: displayName,
      email,
      avatar_initials: initials.toUpperCase(),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      toast.error("Skontroluj polia formulára.");
      return;
    }
    setErrors({});
    updateCurrentUser(parsed.data);
    toast.success("Profil bol uložený.");
  };

  const handleReset = () => {
    setDisplayName(me.display_name);
    setEmail(me.email);
    setInitials(me.avatar_initials);
    setErrors({});
  };

  const autoInitials = displayName
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Účet"
        title="Môj profil"
        accentWords={1}
        icon={UserCog}
        subtitle={
          <>
            Uprav si meno, e-mail a iniciály avatara. Heslo a 2FA spravuješ v sekcii{" "}
            <Link to="/app/account/security" className="underline">Bezpečnosť účtu</Link>.
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Osobné údaje</CardTitle>
          <CardDescription>
            Tieto údaje sa zobrazujú v hlavičke aplikácie, v pozvánkach a v audit logu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
              {(initials || autoInitials || "?").slice(0, 3)}
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">Náhľad avatara</p>
              <p className="text-xs text-muted-foreground">
                Avatar sa generuje z iniciálov. Pri zmene mena ich navrhneme automaticky.
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">Zobrazované meno</Label>
              <Input
                id="display_name"
                value={displayName}
                maxLength={80}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  const next = e.target.value
                    .split(/\s+/).filter(Boolean).slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "").join("");
                  if (next && initials === me.avatar_initials) setInitials(next);
                }}
                aria-invalid={!!errors.display_name}
              />
              {errors.display_name && <p className="text-xs text-destructive">{errors.display_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                maxLength={255}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              <p className="text-xs text-muted-foreground">
                Po napojení Lovable Cloud bude zmena e-mailu vyžadovať potvrdenie cez verifikačný odkaz.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initials">Iniciály avatara</Label>
              <Input
                id="initials"
                value={initials}
                maxLength={3}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                aria-invalid={!!errors.avatar_initials}
              />
              {errors.avatar_initials && <p className="text-xs text-destructive">{errors.avatar_initials}</p>}
            </div>

            <div className="space-y-2">
              <Label>ID účtu</Label>
              <Input value={me.id} readOnly disabled />
              <p className="text-xs text-muted-foreground">Interný identifikátor — needituje sa.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {dirty ? (
                <Badge variant="secondary">Neuložené zmeny</Badge>
              ) : (
                <Badge variant="outline">Aktuálne uložené</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleReset} disabled={!dirty}>
                <RotateCcw className="mr-2 h-4 w-4" /> Vrátiť
              </Button>
              <Button onClick={handleSave} disabled={!dirty}>
                <Save className="mr-2 h-4 w-4" /> Uložiť zmeny
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Heslo a 2FA</CardTitle>
          <CardDescription>Zmena hesla a dvojfaktorové overenie sa nachádza v samostatnej sekcii.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/app/account/security">Prejsť na Bezpečnosť účtu</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Key, Lock, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/account/security")({
  head: () => ({ meta: [{ title: "Bezpečnosť · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
});

const score = (p: string) => {
  let s = 0;
  if (p.length >= 8) s += 25;
  if (p.length >= 12) s += 25;
  if (/[A-Z]/.test(p)) s += 15;
  if (/[0-9]/.test(p)) s += 15;
  if (/[^a-zA-Z0-9]/.test(p)) s += 20;
  return Math.min(100, s);
};

const SESSIONS = [
  { id: "s1", device: "MacBook Pro · Chrome 130", ip: "188.121.x.x", location: "Bratislava, SK", current: true, last: "teraz" },
  { id: "s2", device: "iPhone · Safari", ip: "188.121.x.x", location: "Bratislava, SK", current: false, last: "pred 2 hod." },
  { id: "s3", device: "Windows · Firefox", ip: "212.5.x.x", location: "Žilina, SK", current: false, last: "pred 3 dňami" },
];

function SecurityPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const strength = score(pw);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Účet"
        title="Bezpečnosť účtu"
        accentWords={1}
        icon={Shield}
        subtitle="Heslo, prihlasovacie sedenia a politika bezpečnosti."
      />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Zmena hesla</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2"><Label>Nové heslo</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>Potvrdiť</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs"><span>Sila hesla</span><span>{strength < 40 ? "Slabé" : strength < 75 ? "Stredné" : "Silné"}</span></div>
            <Progress value={strength} />
          </div>
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Politika hesla</p>
            <ul className="mt-1 list-disc pl-4">
              <li>min. 8 znakov (odporúčané 12+)</li>
              <li>aspoň 1 veľké písmeno, 1 číslo, 1 špeciálny znak</li>
              <li>hashing: <code>Argon2id</code> (m=64 MiB, t=3, p=4)</li>
              <li>rate-limit: 5 pokusov / 15 min na IP, lockout 1 h pri prekročení</li>
            </ul>
          </div>
          <Button disabled={!pw || pw !== pw2} onClick={() => { toast.success("Heslo zmenené"); setPw(""); setPw2(""); }}>Zmeniť heslo</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Aktívne sedenia</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {SESSIONS.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{s.device} {s.current && <Badge className="ml-2">aktuálne</Badge>}</p>
                <p className="text-xs text-muted-foreground">{s.location} · {s.ip} · {s.last}</p>
              </div>
              {!s.current && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.success("Sedenie ukončené")}>Odhlásiť</Button>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Dvojfaktorové overenie</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">2FA cez TOTP appku (Authy, Google Authenticator).</p>
          <Button variant="outline" onClick={() => toast.success("QR kód vygenerovaný (demo)")}>Aktivovať 2FA</Button>
        </CardContent>
      </Card>
    </div>
  );
}

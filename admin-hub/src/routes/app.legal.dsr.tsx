import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createDSR, useDSR } from "@/lib/platform/store";
import type { DSRRequest } from "@/lib/platform/types";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/legal/dsr")({
  head: () => ({ meta: [{ title: "GDPR žiadosť · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: DSRPage,
});

function DSRPage() {
  const dsr = useDSR();
  const mine = dsr.slice(0, 5);
  const [email, setEmail] = useState("");
  const [type, setType] = useState<DSRRequest["type"]>("access");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!email.includes("@")) return toast.error("Neplatný e-mail");
    createDSR({ requester_email: email, type, note });
    toast.success("Žiadosť podaná — odpovieme do 30 dní");
    setEmail(""); setNote("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GDPR"
        title="GDPR žiadosť (DSR)"
        accentWords={1}
        icon={FileText}
        subtitle="Prístup k údajom · Výmaz · Portabilita · SLA 30 dní."
      />

      <Card>
        <CardHeader><CardTitle>Podať novú žiadosť</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2"><Label>E-mail dotknutej osoby</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.sk" /></div>
          <div className="space-y-2">
            <Label>Typ žiadosti</Label>
            <Select value={type} onValueChange={(v) => setType(v as DSRRequest["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Prístup k údajom (čl. 15)</SelectItem>
                <SelectItem value="erase">Výmaz (čl. 17 — právo na zabudnutie)</SelectItem>
                <SelectItem value="portability">Portabilita (čl. 20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Poznámka</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Spresnenie žiadosti..." /></div>
          <Button onClick={submit}><ShieldCheck className="mr-2 h-4 w-4" /> Podať žiadosť</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Posledné žiadosti</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {mine.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{d.requester_email} · {d.type}</p>
                <p className="text-xs text-muted-foreground">{d.note}</p>
                <p className="text-xs text-muted-foreground">SLA do: {new Date(d.sla_due_at).toLocaleDateString("sk-SK")}</p>
              </div>
              <Badge variant={d.status === "completed" ? "default" : "secondary"}>{d.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

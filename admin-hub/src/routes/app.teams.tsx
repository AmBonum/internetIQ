import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Users, UserPlus, Crown, Pencil, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useTeams, useTeamMembers, addTeamMember, removeTeamMember, updateTeamMemberRole,
} from "@/lib/platform/store";
import type { Role } from "@/lib/platform/types";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/teams")({
  head: () => ({ meta: [{ title: "Tímy · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: TeamsPage,
});

const ROLE_ICON = { owner: Crown, editor: Pencil, viewer: Eye } as const;
const ROLE_LABEL: Record<Role, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

function TeamsPage() {
  const teams = useTeams();
  const members = useTeamMembers();
  const [activeTeam, setActiveTeam] = useState(teams[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");

  const teamMembers = members.filter((m) => m.team_id === activeTeam);

  const invite = () => {
    if (!email.includes("@")) return toast.error("Neplatný e-mail");
    addTeamMember(activeTeam, email, role);
    toast.success(`Pozvánka odoslaná: ${email}`);
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Spolupráca"
        title="Tímy a roly"
        accentWords={1}
        icon={Users}
        subtitle="Spravuj členov tímu a ich oprávnenia (Owner / Editor / Viewer)."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {teams.map((t) => (
          <Card key={t.id} onClick={() => setActiveTeam(t.id)} className={`cursor-pointer ${activeTeam === t.id ? "border-primary" : "border-border/60"}`}>
            <CardContent className="p-4">
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">{members.filter((m) => m.team_id === t.id).length} členov</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Pozvať člena</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="email@firma.sk" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{(["owner","editor","viewer"] as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={invite}><UserPlus className="mr-2 h-4 w-4" /> Pozvať</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Členovia</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {teamMembers.map((m) => {
            const Icon = ROLE_ICON[m.role];
            return (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{m.display_name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary"><Icon className="mr-1 h-3 w-3" /> {ROLE_LABEL[m.role]}</Badge>
                  <Select value={m.role} onValueChange={(v) => updateTeamMemberRole(m.id, v as Role)}>
                    <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{(["owner","editor","viewer"] as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { removeTeamMember(m.id); toast.success("Člen odstránený"); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
          {teamMembers.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Žiadni členovia</p>}
        </CardContent>
      </Card>
    </div>
  );
}

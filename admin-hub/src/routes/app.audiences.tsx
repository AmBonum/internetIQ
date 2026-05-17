import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Users, Send, Trash2, Search, Mail, X, Upload, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  addGroupMembers, assignTestToGroup, assignmentsForGroup, createGroup,
  currentUserId, deleteGroup, removeGroupMember, unassignTestFromGroup,
  updateGroup, useAssignments, useGroups, useTests,
} from "@/lib/platform/store";
import type { RespondentGroup } from "@/lib/platform/types";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/audiences")({
  head: () => ({ meta: [{ title: "Skupiny respondentov · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: AudiencesPage,
});

function AudiencesPage() {
  const groups = useGroups();
  useAssignments();
  const myGroups = groups.filter((g) => g.owner_id === currentUserId());
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<RespondentGroup | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Publikum"
        title="Skupiny respondentov"
        accentWords={1}
        icon={Users}
        subtitle="Ulož si publikum raz a priraď mu testy hromadne — netreba pridávať e-maily po jednom."
        actions={
          <Button size="sm" className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-3 w-3" />Nová skupina
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Skupiny" value={myGroups.length} />
        <Kpi label="Celkom kontaktov" value={myGroups.reduce((a, g) => a + g.member_emails.length, 0)} />
        <Kpi label="Aktívnych priradení" value={myGroups.reduce((a, g) => a + assignmentsForGroup(g.id).length, 0)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {myGroups.map((g) => {
          const assigns = assignmentsForGroup(g.id);
          return (
            <Card key={g.id} className="cursor-pointer transition hover:border-primary/60" onClick={() => setSelected(g)}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4 text-primary" /> {g.name}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{g.member_emails.length} kontaktov</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.tags.map((t) => <Badge key={t} variant="outline" className="font-normal text-[10px]">{t}</Badge>)}
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span><ClipboardList className="mr-1 inline h-3 w-3" /> {assigns.length} priradených testov</span>
                  <span>upravené {new Date(g.updated_at).toLocaleDateString("sk-SK")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {myGroups.length === 0 && (
          <Card className="md:col-span-2 border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Žiadne skupiny — vytvor prvú a priraď jej test jedným klikom.
            </CardContent>
          </Card>
        )}
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GroupDetailDialog group={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </CardContent></Card>
  );
}

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [emails, setEmails] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Zadaj názov skupiny");
    const g = createGroup({
      name: name.trim(), description: description.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      emails_raw: emails,
    });
    toast.success(`Skupina vytvorená (${g.member_emails.length} kontaktov)`);
    setName(""); setDescription(""); setTags(""); setEmails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nová skupina respondentov</DialogTitle>
          <DialogDescription>Vlož e-maily (oddelené čiarkou, medzerou, alebo novým riadkom).</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2"><Label>Názov</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="napr. HR oddelenie" /></div>
          <div className="space-y-2"><Label>Popis</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="krátky popis" /></div>
          <div className="space-y-2"><Label>Tagy (oddelené čiarkou)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="HR, interní" /></div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Upload className="h-3 w-3" />E-maily</Label>
            <Textarea rows={6} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="anna@firma.sk, peter@firma.sk&#10;eva@firma.sk" />
            <p className="text-xs text-muted-foreground">Duplikáty a neplatné formáty preskočíme automaticky.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
            <Button type="submit">Vytvoriť skupinu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GroupDetailDialog({ group, onOpenChange }: { group: RespondentGroup | null; onOpenChange: (o: boolean) => void }) {
  const tests = useTests().filter((t) => t.owner_id === currentUserId());
  const assignments = useAssignments();
  const [bulk, setBulk] = useState("");
  const [search, setSearch] = useState("");
  const [assignId, setAssignId] = useState<string>("");

  const groupAssigns = useMemo(() => assignments.filter((a) => a.group_id === group?.id), [assignments, group]);
  const assignedIds = new Set(groupAssigns.map((a) => a.test_id));
  const availableTests = tests.filter((t) => !assignedIds.has(t.id) && t.status !== "archived");

  if (!group) return null;

  const filteredEmails = group.member_emails.filter((e) => e.includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!bulk.trim()) return;
    const added = addGroupMembers(group.id, bulk);
    toast.success(added ? `Pridaných ${added} nových kontaktov` : "Žiadne nové kontakty");
    setBulk("");
  };

  const handleAssign = () => {
    if (!assignId) return toast.error("Vyber test");
    const a = assignTestToGroup(assignId, group.id);
    if (a) toast.success(`Priradené — odoslaných ${a.invited_count} pozvánok`);
    setAssignId("");
  };

  const handleRename = (name: string) => updateGroup(group.id, { name });

  return (
    <Dialog open={Boolean(group)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            <Input value={group.name} onChange={(e) => handleRename(e.target.value)} className="border-0 px-0 text-lg font-semibold focus-visible:ring-0" />
          </DialogTitle>
          <DialogDescription>{group.description || "Bez popisu"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assign test */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Priradiť test skupine</CardTitle>
              <CardDescription className="text-xs">Všetkým členom odošleme pozvánku s linkom.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={assignId} onValueChange={setAssignId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Vyber test..." /></SelectTrigger>
                  <SelectContent>
                    {availableTests.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title} ({t.question_ids.length} otázok)</SelectItem>
                    ))}
                    {availableTests.length === 0 && <SelectItem value="_none" disabled>Všetky testy už priradené</SelectItem>}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!assignId}><Send className="mr-2 h-3 w-3" />Priradiť</Button>
              </div>

              {groupAssigns.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Aktívne priradenia</p>
                  {groupAssigns.map((a) => {
                    const t = tests.find((x) => x.id === a.test_id);
                    return (
                      <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate">{t?.title ?? a.test_id}</div>
                          <div className="text-xs text-muted-foreground">
                            <Send className="mr-1 inline h-3 w-3" />{a.invited_count} pozvánok · {new Date(a.assigned_at).toLocaleDateString("sk-SK")}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => unassignTestFromGroup(a.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add members */}
          <div className="space-y-2">
            <Label className="text-sm">Pridať e-maily (hromadne)</Label>
            <div className="flex gap-2">
              <Textarea rows={2} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="anna@firma.sk, peter@firma.sk..." />
              <Button onClick={handleAdd} disabled={!bulk.trim()}><Plus className="mr-2 h-3 w-3" />Pridať</Button>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Členovia <Badge variant="secondary" className="ml-2">{group.member_emails.length}</Badge></Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-8 w-48 pl-7 text-xs" placeholder="Hľadať..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="max-h-64 divide-y overflow-y-auto rounded-md border">
              {filteredEmails.map((e) => (
                <div key={e} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 truncate"><Mail className="h-3 w-3 text-muted-foreground" />{e}</span>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeGroupMember(group.id, e)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {filteredEmails.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">Žiadni členovia v tomto filtri.</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="destructive" size="sm" onClick={() => { deleteGroup(group.id); toast.success("Skupina zmazaná"); onOpenChange(false); }}>
            <Trash2 className="mr-2 h-3 w-3" />Zmazať skupinu
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zavrieť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

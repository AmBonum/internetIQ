import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Share2,
  Sparkles,
  Globe,
  Lock,
  Link2,
  Users,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShareDialog } from "@/components/user/ShareDialog";
import { PageHeader } from "@/components/app/page-header";
import { CategoryMultiSelect } from "@/components/admin/CategoryMultiSelect";
import { branchLabel } from "@/lib/admin-mock-data";
import {
  mockUserSets,
  currentUser,
  type UserTestSet,
} from "@/lib/user-mock-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Moje sady testov · SubenAI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppPage,
});

const visibilityMeta = {
  private: { label: "Súkromné", Icon: Lock, tone: "bg-muted text-muted-foreground" },
  unlisted: { label: "Cez odkaz", Icon: Link2, tone: "bg-amber-500/10 text-amber-600" },
  public: { label: "Verejné", Icon: Globe, tone: "bg-emerald-500/10 text-emerald-600" },
} as const;

function AppPage() {
  const [sets, setSets] = useState<UserTestSet[]>(mockUserSets);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareSet, setShareSet] = useState<UserTestSet | null>(null);

  const createSet = (data: Pick<UserTestSet, "title" | "description" | "categories" | "visibility">) => {
    const id = `uts_${Date.now().toString(36)}`;
    const slug = data.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSets((p) => [
      {
        id,
        owner_id: currentUser.id,
        owner_name: currentUser.display_name,
        title: data.title,
        description: data.description,
        slug,
        categories: data.categories,
        question_ids: [],
        visibility: data.visibility,
        password: null,
        attempts: 0,
        shared_with_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      ...p,
    ]);
    toast.success("Sada vytvorená");
  };

  const removeSet = (id: string) => {
    setSets((p) => p.filter((s) => s.id !== id));
    toast.success("Sada vymazaná");
  };

  return (
    <div>
      <main>
        <PageHeader
          eyebrow="Prehľad"
          title="Moje sady testov"
          accentWords={1}
          subtitle="Vytvor si vlastné sady, zdieľaj ich linkom alebo pošli pozvánky na email."
          actions={
            <Button size="sm" className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nová sada testov
            </Button>
          }
        />

        {/* Stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatTile label="Sady testov" value={sets.length} />
          <StatTile
            label="Celkom pokusov"
            value={sets.reduce((a, s) => a + s.attempts, 0).toLocaleString("sk-SK")}
          />
          <StatTile
            label="Zdieľaných"
            value={sets.reduce((a, s) => a + s.shared_with_count, 0)}
          />
        </div>

        {/* Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sets.map((s) => {
            const v = visibilityMeta[s.visibility];
            return (
              <Card key={s.id} className="border-border/60 shadow-[var(--shadow-card)]">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/app/sets/$setId"
                        params={{ setId: s.id }}
                        className="font-semibold leading-tight text-foreground hover:text-primary"
                      >
                        {s.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    </div>
                    <Badge className={`shrink-0 ${v.tone} hover:${v.tone}`}>
                      <v.Icon className="mr-1 h-3 w-3" /> {v.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {s.categories.map((c) => (
                      <Badge key={c} variant="secondary" className="font-normal">
                        {branchLabel(c)}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{s.question_ids.length} otázok</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {s.shared_with_count} zdieľaní
                    </span>
                    <span>{s.attempts.toLocaleString("sk-SK")} pokusov</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link to="/app/sets/$setId" params={{ setId: s.id }}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Upraviť
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeSet(s.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Zmazať
                      </Button>
                    </div>
                    <Button size="sm" onClick={() => setShareSet(s)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Zdieľať
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sets.length === 0 && (
            <Card className="border-dashed border-border/60 md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                Zatiaľ žiadne sady. Vytvor si prvú a pošli ju komukoľvek.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <CreateSetDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={createSet} />
      <ShareDialog open={Boolean(shareSet)} onOpenChange={(o) => !o && setShareSet(null)} set={shareSet} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function CreateSetDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (d: Pick<UserTestSet, "title" | "description" | "categories" | "visibility">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<UserTestSet["visibility"]>("unlisted");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Zadaj názov sady");
    if (categories.length === 0) return toast.error("Vyber aspoň jednu branžu");
    onCreate({ title: title.trim(), description: description.trim(), categories, visibility });
    setTitle("");
    setDescription("");
    setCategories([]);
    setVisibility("unlisted");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nová sada testov</DialogTitle>
          <DialogDescription>
            Pomenuj sadu a vyber branže — otázky pridáš v ďalšom kroku.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-title">Názov</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Napr. Bezpečnosť pre kolegov"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-desc">Popis</Label>
            <Textarea
              id="t-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krátky popis pre príjemcov..."
            />
          </div>
          <div className="space-y-2">
            <Label>Branže</Label>
            <CategoryMultiSelect value={categories} onChange={setCategories} />
          </div>
          <div className="space-y-2">
            <Label>Viditeľnosť</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as UserTestSet["visibility"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Súkromné — iba ja</SelectItem>
                <SelectItem value="unlisted">Cez odkaz — kto má link</SelectItem>
                <SelectItem value="public">Verejné — vidí ho každý</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit">Vytvoriť sadu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

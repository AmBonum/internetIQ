import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminRepo, useAdminState } from "@/lib/admin/store";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

type Kind = "branch" | "topic";
interface EditorState {
  open: boolean;
  kind: Kind;
  id?: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}
const emptyEditor = (kind: Kind): EditorState => ({
  open: true,
  kind,
  name: "",
  slug: "",
  description: "",
  color: "#6366f1",
});

function CategoriesPage() {
  const branches = useAdminState((s) => s.categories);
  const topics = useAdminState((s) => s.topics);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ kind: Kind; id: string; name: string } | null>(
    null,
  );

  const submit = () => {
    if (!editor) return;
    if (!editor.name.trim()) return toast.error("Názov je povinný");
    const slug = editor.slug.trim() || editor.name.toLowerCase().replace(/\s+/g, "-");
    const payload = { name: editor.name, slug, description: editor.description, color: editor.color };
    const repo = editor.kind === "branch" ? adminRepo.categories : adminRepo.topics;
    if (editor.id) {
      repo.update(editor.id, payload);
      toast.success("Uložené");
    } else {
      repo.create(payload);
      toast.success("Vytvorené");
    }
    setEditor(null);
  };

  const renderGrid = (items: typeof branches, kind: Kind, addLabel: string, countLabel: string, getCount: (c: typeof branches[number]) => number) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <Card key={c.id} className="group border-border/60 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elegant)]">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="h-10 w-10 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)` }} />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{c.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs">{c.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{getCount(c)}</p>
              <p className="text-xs text-muted-foreground">{countLabel} · /{c.slug}</p>
            </div>
            <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditor({ open: true, kind, id: c.id, name: c.name, slug: c.slug, description: c.description, color: c.color })}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmDel({ kind, id: c.id, name: c.name })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <button type="button" onClick={() => setEditor(emptyEditor(kind))} className="flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary">
        <Plus className="h-5 w-5" />
        {addLabel}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Kategórie" description="Branže pre otázky a témy pre bezplatné školenia." />

      <Tabs defaultValue="branches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branches">Branže ({branches.length})</TabsTrigger>
          <TabsTrigger value="topics">Témy školení ({topics.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="branches" className="space-y-4">
          {renderGrid(branches, "branch", "Nová branža", "otázok", (c) => (c as { questions_count: number }).questions_count)}
        </TabsContent>
        <TabsContent value="topics" className="space-y-4">
          {renderGrid(topics as unknown as typeof branches, "topic", "Nová téma školenia", "školení", (c) => (c as unknown as { trainings_count: number }).trainings_count)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editor?.id ? "Upraviť" : "Nová"} {editor?.kind === "branch" ? "branža" : "téma"}</DialogTitle>
            <DialogDescription>Slug sa použije v URL. Farba sa zobrazí v náhľadoch.</DialogDescription>
          </DialogHeader>
          {editor && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Názov</Label><Input value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Slug</Label><Input value={editor.slug} onChange={(e) => setEditor({ ...editor, slug: e.target.value })} placeholder="auto z názvu" /></div>
              <div className="space-y-1.5"><Label>Popis</Label><Textarea rows={3} value={editor.description} onChange={(e) => setEditor({ ...editor, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Farba</Label><input type="color" value={editor.color} onChange={(e) => setEditor({ ...editor, color: e.target.value })} className="h-10 w-20 rounded border border-border/60" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor(null)}>Zrušiť</Button>
            <Button onClick={submit}>{editor?.id ? "Uložiť" : "Vytvoriť"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(o) => !o && setConfirmDel(null)}
        title="Vymazať?"
        description={confirmDel ? `„${confirmDel.name}" bude odstránené.` : ""}
        confirmLabel="Vymazať"
        destructive
        onConfirm={() => {
          if (confirmDel) {
            (confirmDel.kind === "branch" ? adminRepo.categories : adminRepo.topics).remove(confirmDel.id);
            toast.success("Vymazané");
            setConfirmDel(null);
          }
        }}
      />
    </div>
  );
}

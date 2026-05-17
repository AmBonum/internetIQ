import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  MoreHorizontal,
  Clock,
  Eye,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TrainingEditor } from "@/components/admin/TrainingEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TRAINING_TOPICS,
  topicLabel,
  type AdminTraining,
} from "@/lib/admin-mock-data";
import { adminRepo, useAdminState } from "@/lib/admin/store";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export const Route = createFileRoute("/admin/trainings")({
  component: TrainingsPage,
});

function TrainingsPage() {
  const trainings = useAdminState((s) => s.trainings);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTraining | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminTraining | null>(null);

  const filtered = useMemo(
    () =>
      trainings.filter((t) => {
        if (topic !== "all" && t.topic !== topic) return false;
        if (status !== "all" && t.status !== status) return false;
        if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [trainings, query, topic, status],
  );

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (t: AdminTraining) => {
    setEditing(t);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bezplatné školenia"
        description="Krátke školenia (5 – 20 min) o tom, ako rozoznať najčastejšie podvody na slovenskom internete."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nové školenie
          </Button>
        }
      />

      <Card className="border-border/60 shadow-[var(--shadow-card)]">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Hľadať školenie..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Téma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky témy</SelectItem>
                {TRAINING_TOPICS.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-[160px]">
                <SelectValue placeholder="Stav" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky stavy</SelectItem>
                <SelectItem value="published">Publikované</SelectItem>
                <SelectItem value="draft">Koncept</SelectItem>
                <SelectItem value="archived">Archivované</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Školenie</TableHead>
                  <TableHead>Téma</TableHead>
                  <TableHead>Trvanie</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Zobrazenia</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium">{t.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {t.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{topicLabel(t.topic)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t.duration_min} min
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                        <Eye className="h-3 w-3" />
                        {t.views.toLocaleString("sk-SK")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akcie</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => toast.info("Náhľad školenia")}>
                              Zobraziť náhľad
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(t)}>Upraviť</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const copy = adminRepo.trainings.create({
                                  title: `${t.title} (kópia)`,
                                  topic: t.topic,
                                  description: t.description,
                                  duration_min: t.duration_min,
                                  status: "draft",
                                });
                                toast.success(`Duplikované: ${copy.title}`);
                              }}
                            >
                              Duplikovať
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setConfirmDelete(t)}
                            >
                              Vymazať
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Žiadne školenia
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            Zobrazených {filtered.length} z {trainings.length}
          </p>
        </CardContent>
      </Card>

      <TrainingEditor open={editorOpen} onOpenChange={setEditorOpen} training={editing} />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Vymazať školenie?"
        description={confirmDelete ? `Školenie „${confirmDelete.title}" bude odstránené.` : ""}
        confirmLabel="Vymazať"
        destructive
        onConfirm={() => {
          if (confirmDelete) {
            adminRepo.trainings.remove(confirmDelete.id);
            toast.success("Školenie vymazané");
            setConfirmDelete(null);
          }
        }}
      />
    </div>
  );
}

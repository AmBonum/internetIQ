import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TRAINING_TOPICS,
  type AdminTraining,
  type TrainingStatus,
} from "@/lib/admin-mock-data";
import { adminRepo } from "@/lib/admin/store";

export interface TrainingEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training?: AdminTraining | null;
  onSave?: (data: Partial<AdminTraining>) => void;
}

const empty = {
  title: "",
  description: "",
  topic: TRAINING_TOPICS[0].slug,
  duration_min: 10,
  status: "draft" as TrainingStatus,
};

export function TrainingEditor({ open, onOpenChange, training, onSave }: TrainingEditorProps) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) {
      setForm(
        training
          ? {
              title: training.title,
              description: training.description,
              topic: training.topic,
              duration_min: training.duration_min,
              status: training.status,
            }
          : empty,
      );
    }
  }, [open, training]);

  const isEdit = Boolean(training);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Názov je povinný");
      return;
    }
    if (isEdit && training) {
      adminRepo.trainings.update(training.id, form);
    } else {
      adminRepo.trainings.create(form);
    }
    onSave?.(form);
    toast.success(isEdit ? "Školenie uložené" : "Školenie vytvorené");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Upraviť školenie" : "Nové školenie"}</DialogTitle>
          <DialogDescription>
            Krátke bezplatné školenie (5 – 20 minút) zaradené do témy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-title">Názov školenia</Label>
            <Input
              id="t-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Napr. Ako rozoznať podvodnú SMS o doručení balíka"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="t-desc">Popis</Label>
            <Textarea
              id="t-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Krátky popis obsahu školenia."
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label>Téma</Label>
              <Select value={form.topic} onValueChange={(v) => setForm((f) => ({ ...f, topic: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_TOPICS.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="t-dur">Trvanie (min)</Label>
              <Input
                id="t-dur"
                type="number"
                min={1}
                max={120}
                value={form.duration_min}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration_min: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label>Stav</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as TrainingStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Koncept</SelectItem>
                  <SelectItem value="published">Publikované</SelectItem>
                  <SelectItem value="archived">Archivované</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit">{isEdit ? "Uložiť zmeny" : "Vytvoriť školenie"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

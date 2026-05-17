import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { headerStore } from "@/lib/admin/cms-store";
import { useHeader } from "@/lib/admin/cms-hooks";

export const Route = createFileRoute("/admin/header")({
  component: HeaderPage,
});

function HeaderPage() {
  const h = useHeader();
  const patch = (p: Partial<typeof h>) => headerStore.set((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hlavička webu"
        description="Zmeny sa ukladajú automaticky. Logo, prihlásenie, hlavné CTA a oznamovacia lišta."
        actions={
          <Button variant="outline" onClick={() => toast.success("Konfigurácia hlavičky je uložená")}>
            <Check className="mr-2 h-4 w-4" />
            Uložené
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Text loga</Label>
            <Input value={h.logoText} onChange={(e) => patch({ logoText: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>URL obrázka loga (voliteľné)</Label>
            <Input
              placeholder="/logo.svg"
              value={h.logoImageUrl ?? ""}
              onChange={(e) => patch({ logoImageUrl: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akcie v hlavičke</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Zobraziť tlačidlo Prihlásenie</div>
              <div className="text-xs text-muted-foreground">Sekundárny odkaz pre prihlásených používateľov.</div>
            </div>
            <Switch checked={h.showLogin} onCheckedChange={(v) => patch({ showLogin: v })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Prihlásenie — text</Label>
              <Input value={h.loginLabel} onChange={(e) => patch({ loginLabel: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Prihlásenie — URL</Label>
              <Input value={h.loginUrl} onChange={(e) => patch({ loginUrl: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Hlavné CTA — text</Label>
              <Input value={h.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Hlavné CTA — URL</Label>
              <Input value={h.ctaUrl} onChange={(e) => patch({ ctaUrl: e.target.value })} />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Lepkavá hlavička</div>
              <div className="text-xs text-muted-foreground">Hlavička sa drží navrchu pri scrollovaní.</div>
            </div>
            <Switch checked={h.sticky} onCheckedChange={(v) => patch({ sticky: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oznamovacia lišta</CardTitle>
          <CardDescription>Tenký pásik nad hlavičkou — vhodný na akcie, blog upozornenia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="text-sm font-medium">Aktívne</div>
            <Switch
              checked={h.announcementEnabled}
              onCheckedChange={(v) => patch({ announcementEnabled: v })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Text oznamu</Label>
            <Textarea
              rows={2}
              value={h.announcement ?? ""}
              onChange={(e) => patch({ announcement: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

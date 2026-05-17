import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { footerStore, newId } from "@/lib/admin/cms-store";
import { useFooter } from "@/lib/admin/cms-hooks";

export const Route = createFileRoute("/admin/footer")({
  component: FooterPage,
});

function FooterPage() {
  const f = useFooter();
  const patch = (p: Partial<typeof f>) => footerStore.set((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Päta webu"
        description="Zmeny sa ukladajú automaticky. Kontakt, sociálne siete, newsletter a copyright."
        actions={
          <Button variant="outline" onClick={() => toast.success("Konfigurácia päty je uložená")}>
            <Check className="mr-2 h-4 w-4" />
            Uložené
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Text loga</Label>
            <Input value={f.logoText} onChange={(e) => patch({ logoText: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Tagline</Label>
            <Input value={f.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Copyright</Label>
            <Input value={f.copyright} onChange={(e) => patch({ copyright: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input value={f.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Telefón</Label>
              <Input
                value={f.contactPhone ?? ""}
                onChange={(e) => patch({ contactPhone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Adresa</Label>
            <Textarea
              rows={2}
              value={f.address ?? ""}
              onChange={(e) => patch({ address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Sociálne siete</CardTitle>
            <CardDescription>Ikony v päte webu.</CardDescription>
          </div>
          <Button
            onClick={() =>
              patch({
                socials: [...f.socials, { id: newId("s"), platform: "Facebook", url: "https://" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Pridať
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {f.socials.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-md border bg-card p-3">
              <Input
                className="w-40"
                value={s.platform}
                onChange={(e) =>
                  patch({
                    socials: f.socials.map((x) =>
                      x.id === s.id ? { ...x, platform: e.target.value } : x,
                    ),
                  })
                }
              />
              <Input
                value={s.url}
                onChange={(e) =>
                  patch({
                    socials: f.socials.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)),
                  })
                }
              />
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => patch({ socials: f.socials.filter((x) => x.id !== s.id) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="text-sm font-medium">Aktívne</div>
            <Switch checked={f.newsletterEnabled} onCheckedChange={(v) => patch({ newsletterEnabled: v })} />
          </div>
          <div className="grid gap-2">
            <Label>Nadpis</Label>
            <Input
              value={f.newsletterHeading}
              onChange={(e) => patch({ newsletterHeading: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

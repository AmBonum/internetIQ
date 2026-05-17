import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="sm:w-72">{children}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nastavenia" description="Konfigurácia platformy SubenAI." />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Všeobecné</TabsTrigger>
          <TabsTrigger value="moderation">Moderovanie</TabsTrigger>
          <TabsTrigger value="integrations">Integrácie</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Identita platformy</CardTitle>
              <CardDescription>Základné údaje zobrazené používateľom.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <SettingRow label="Názov platformy" description="Zobrazuje sa v hlavičke a emailoch.">
                <Input defaultValue="SubenAI" />
              </SettingRow>
              <SettingRow label="Doména" description="Hlavná adresa.">
                <Input defaultValue="www.subenai.sk" />
              </SettingRow>
              <SettingRow label="Popis" description="Krátky popis pre SEO.">
                <Textarea rows={2} defaultValue="Komunita pre otázky a odpovede o AI." />
              </SettingRow>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Lokalizácia</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <SettingRow label="Predvolený jazyk"><Input defaultValue="sk" /></SettingRow>
              <SettingRow label="Časové pásmo"><Input defaultValue="Europe/Bratislava" /></SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="mt-6 space-y-6">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Pravidlá obsahu</CardTitle>
              <CardDescription>Ako sa nové otázky a odpovede schvaľujú.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <SettingRow label="Manuálne schvaľovanie otázok" description="Každá nová otázka musí byť schválená moderátorom.">
                <div className="flex justify-end"><Switch /></div>
              </SettingRow>
              <SettingRow label="Automatická detekcia spamu" description="AI filter pre podozrivý obsah.">
                <div className="flex justify-end"><Switch defaultChecked /></div>
              </SettingRow>
              <SettingRow label="Minimálna dĺžka otázky" description="Počet znakov."><Input type="number" defaultValue="20" /></SettingRow>
              <SettingRow label="Zakázané slová" description="Oddelené čiarkou."><Textarea rows={2} placeholder="spam, reklama, ..." /></SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Integrácie</CardTitle>
              <CardDescription>Pripojené služby a poskytovatelia.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              <SettingRow label="Supabase" description="Databáza a autentifikácia.">
                <div className="flex items-center justify-end gap-2 text-sm"><span className="inline-flex h-2 w-2 rounded-full bg-success" />Pripojené</div>
              </SettingRow>
              <SettingRow label="Stripe" description="Sponzorstvo a dary.">
                <div className="flex items-center justify-end gap-2 text-sm"><span className="inline-flex h-2 w-2 rounded-full bg-success" />Pripojené</div>
              </SettingRow>
              <SettingRow label="Cloudflare Pages" description="Hosting a CDN.">
                <div className="flex items-center justify-end gap-2 text-sm"><span className="inline-flex h-2 w-2 rounded-full bg-success" />Aktívne</div>
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6 space-y-6">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>API kľúče</CardTitle>
              <CardDescription>Spravujte prístup k verejnému API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">sk_live_••••••••••••••••3f2a</p>
                  <p className="mt-1 text-xs text-muted-foreground">Vytvorený 12. mar 2026</p>
                </div>
                <Button variant="outline" size="sm">Rotovať</Button>
              </div>
              <Button variant="outline" size="sm">Vytvoriť nový kľúč</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline">Zrušiť</Button>
        <Button onClick={() => toast.success("Nastavenia uložené")}>Uložiť zmeny</Button>
      </div>
    </div>
  );
}

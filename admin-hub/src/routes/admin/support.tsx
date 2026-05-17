import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Heart,
  Plus,
  Trash2,
  Save,
  Star,
  StarOff,
  ExternalLink,
  CreditCard,
  Eye,
  EyeOff,
  RefreshCcw,
  ArrowUpDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  supportStore,
  defaultSupportConfig,
  defaultAmounts,
  type AmountPreset,
  type Sponsor,
  type SupportConfig,
} from "@/lib/admin/support-config";
import { exportToCSV } from "@/lib/admin/export";

export const Route = createFileRoute("/admin/support")({
  head: () => ({
    meta: [
      { title: "Podpora · SubenAI Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportAdminPage,
});

function SupportAdminPage() {
  const [config, setConfig] = useState<SupportConfig>({ ...supportStore.config });
  const [amounts, setAmounts] = useState<AmountPreset[]>([...supportStore.amounts]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([...supportStore.sponsors]);
  const [revealKey, setRevealKey] = useState(false);

  const dirty = useMemo(
    () =>
      JSON.stringify(config) !== JSON.stringify(supportStore.config) ||
      JSON.stringify(amounts) !== JSON.stringify(supportStore.amounts),
    [config, amounts],
  );

  const update = (patch: Partial<SupportConfig>) =>
    setConfig((p) => ({ ...p, ...patch }));

  const save = () => {
    supportStore.config = { ...config, updated_at: new Date().toISOString() };
    supportStore.amounts = [...amounts];
    setConfig({ ...supportStore.config });
    toast.success("Nastavenia podpory uložené");
  };

  const reset = () => {
    setConfig({ ...defaultSupportConfig });
    setAmounts([...defaultAmounts]);
    toast.info("Obnovené na predvolené");
  };

  // Amounts CRUD
  const addAmount = () => {
    const next = Math.max(...amounts.map((a) => a.amount), 0) + 5;
    setAmounts((p) => [
      ...p,
      { id: `amt_${Date.now().toString(36)}`, amount: next },
    ]);
  };
  const updateAmount = (id: string, patch: Partial<AmountPreset>) =>
    setAmounts((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const removeAmount = (id: string) =>
    setAmounts((p) => p.filter((a) => a.id !== id));
  const toggleHighlight = (id: string) =>
    setAmounts((p) =>
      p.map((a) => ({ ...a, highlighted: a.id === id ? !a.highlighted : false })),
    );
  const moveAmount = (id: string, dir: -1 | 1) =>
    setAmounts((p) => {
      const idx = p.findIndex((a) => a.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= p.length) return p;
      const next = [...p];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });

  // Sponsor controls
  const toggleSponsorPublic = (id: string) => {
    setSponsors((p) => {
      const next = p.map((s) => (s.id === id ? { ...s, public: !s.public } : s));
      supportStore.sponsors = next;
      return next;
    });
    toast.success("Aktualizované");
  };
  const removeSponsor = (id: string) => {
    setSponsors((p) => {
      const next = p.filter((s) => s.id !== id);
      supportStore.sponsors = next;
      return next;
    });
    toast.success("Sponzor odstránený");
  };
  const exportSponsors = () =>
    exportToCSV(
      sponsors.map((s) => ({
        meno: s.display_name,
        suma_eur: s.amount_total.toFixed(2),
        frekvencia: s.frequency,
        verejny: s.public ? "ano" : "nie",
        od: new Date(s.first_donation_at).toLocaleDateString("sk-SK"),
      })),
      [
        { key: "meno", label: "Meno" },
        { key: "suma_eur", label: "Suma (€)" },
        { key: "frekvencia", label: "Frekvencia" },
        { key: "verejny", label: "Verejný" },
        { key: "od", label: "Od" },
      ],
      "sponzori.csv",
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Heart className="h-6 w-6 text-primary" />
            Podpora & Stripe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Spravuj formulár /podpora, Stripe kľúče, sumy a verejný zoznam sponzorov.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={config.stripe_mode === "live" ? "default" : "secondary"}
            className="uppercase"
          >
            {config.stripe_mode === "live" ? "LIVE" : "TEST"}
          </Badge>
          <Button variant="outline" size="sm" onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Obnoviť
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty}>
            <Save className="mr-2 h-4 w-4" /> Uložiť
          </Button>
        </div>
      </div>

      <Tabs defaultValue="form" className="space-y-4">
        <TabsList>
          <TabsTrigger value="form">Formulár</TabsTrigger>
          <TabsTrigger value="amounts">Sumy ({amounts.length})</TabsTrigger>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="sponsors">Sponzori ({sponsors.length})</TabsTrigger>
          <TabsTrigger value="legal">Súhlasy & texty</TabsTrigger>
        </TabsList>

        {/* FORM */}
        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obsah stránky /podpora</CardTitle>
              <CardDescription>Nadpis, podnadpis a CTA tlačidlo formulára.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nadpis">
                <Input
                  value={config.page_title}
                  onChange={(e) => update({ page_title: e.target.value })}
                />
              </Field>
              <Field label="CTA tlačidlo">
                <Input
                  value={config.cta_label}
                  onChange={(e) => update({ cta_label: e.target.value })}
                />
              </Field>
              <Field label="Podnadpis" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={config.page_subtitle}
                  onChange={(e) => update({ page_subtitle: e.target.value })}
                />
              </Field>
              <Field label="Frekvencia">
                <Select
                  value={config.frequency}
                  onValueChange={(v) =>
                    update({ frequency: v as SupportConfig["frequency"] })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Iba jednorazové</SelectItem>
                    <SelectItem value="monthly">Iba mesačné</SelectItem>
                    <SelectItem value="both">Jednorazové + mesačné</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Predvolená voľba">
                <Select
                  value={config.default_frequency}
                  onValueChange={(v) =>
                    update({ default_frequency: v as "one_time" | "monthly" })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Jednorazovo</SelectItem>
                    <SelectItem value="monthly">Mesačne</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Min. suma (€)">
                <Input
                  type="number"
                  min={1}
                  value={config.min_amount}
                  onChange={(e) => update({ min_amount: Number(e.target.value) })}
                />
              </Field>
              <Field label="Max. suma (€)">
                <Input
                  type="number"
                  min={1}
                  value={config.max_amount}
                  onChange={(e) => update({ max_amount: Number(e.target.value) })}
                />
              </Field>
              <ToggleRow
                label="Povoliť vlastnú sumu"
                description="Pridá voľbu „Iná suma“."
                checked={config.allow_custom_amount}
                onChange={(v) => update({ allow_custom_amount: v })}
              />
              <ToggleRow
                label="Vyžadovať DIČ"
                description="Inak je pole DIČ voliteľné (per § 74)."
                checked={config.require_dic}
                onChange={(v) => update({ require_dic: v })}
              />
              <ToggleRow
                label="Verejné poďakovanie"
                description="Užívatelia môžu byť pridaní na /sponzori."
                checked={config.public_sponsor_optin_enabled}
                onChange={(v) => update({ public_sponsor_optin_enabled: v })}
              />
              <Field label="Stránka sponzorov">
                <Input
                  value={config.sponsors_page_path}
                  onChange={(e) => update({ sponsors_page_path: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AMOUNTS */}
        <TabsContent value="amounts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preset sumy</CardTitle>
                <CardDescription>
                  Tieto sumy sa zobrazia ako rýchle dlaždice vo formulári.
                </CardDescription>
              </div>
              <Button size="sm" onClick={addAmount}>
                <Plus className="mr-2 h-4 w-4" /> Pridať sumu
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Poradie</TableHead>
                    <TableHead>Suma (€)</TableHead>
                    <TableHead>Štítok (voliteľný)</TableHead>
                    <TableHead className="w-32">Zvýraznené</TableHead>
                    <TableHead className="w-20 text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amounts.map((a, i) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveAmount(a.id, -1)}
                            disabled={i === 0}
                            aria-label="Posunúť hore"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5 rotate-180" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveAmount(a.id, 1)}
                            disabled={i === amounts.length - 1}
                            aria-label="Posunúť dole"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={a.amount}
                          onChange={(e) =>
                            updateAmount(a.id, { amount: Number(e.target.value) })
                          }
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="napr. Najčastejšie"
                          value={a.label ?? ""}
                          onChange={(e) =>
                            updateAmount(a.id, { label: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleHighlight(a.id)}
                        >
                          {a.highlighted ? (
                            <>
                              <Star className="mr-1 h-3.5 w-3.5 fill-current" /> Áno
                            </>
                          ) : (
                            <>
                              <StarOff className="mr-1 h-3.5 w-3.5" /> Nie
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeAmount(a.id)}
                          aria-label="Zmazať"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STRIPE */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Stripe pripojenie
              </CardTitle>
              <CardDescription>
                Kľúče sú uložené ako secrets na backende. Tu vidíš iba maskovaný náhľad.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Režim">
                <Select
                  value={config.stripe_mode}
                  onValueChange={(v) =>
                    update({ stripe_mode: v as SupportConfig["stripe_mode"] })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test (sandbox)</SelectItem>
                    <SelectItem value="live">Live (produkcia)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Krajina účtu">
                <Input
                  value={config.stripe_account_country}
                  onChange={(e) =>
                    update({ stripe_account_country: e.target.value.toUpperCase() })
                  }
                  maxLength={2}
                />
              </Field>
              <Field label="Mena">
                <Input
                  value={config.currency}
                  onChange={(e) => update({ currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </Field>
              <Field label="Publishable key (pk_…)">
                <Input
                  value={config.stripe_publishable_key}
                  onChange={(e) =>
                    update({ stripe_publishable_key: e.target.value })
                  }
                  placeholder="pk_live_..."
                />
              </Field>
              <Field label="Secret key (sk_…)">
                <div className="flex gap-2">
                  <Input
                    type={revealKey ? "text" : "password"}
                    value={config.stripe_secret_key_masked}
                    onChange={(e) =>
                      update({ stripe_secret_key_masked: e.target.value })
                    }
                    placeholder="sk_live_..."
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setRevealKey((v) => !v)}
                      >
                        {revealKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{revealKey ? "Skryť" : "Zobraziť"}</TooltipContent>
                  </Tooltip>
                </div>
              </Field>
              <Field label="Webhook secret (whsec_…)">
                <Input
                  value={config.stripe_webhook_secret_masked}
                  onChange={(e) =>
                    update({ stripe_webhook_secret_masked: e.target.value })
                  }
                  placeholder="whsec_..."
                />
              </Field>
              <Field label="Success URL">
                <Input
                  value={config.success_url}
                  onChange={(e) => update({ success_url: e.target.value })}
                />
              </Field>
              <Field label="Cancel URL">
                <Input
                  value={config.cancel_url}
                  onChange={(e) => update({ cancel_url: e.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">
                  Webhook endpoint na backende:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    POST /api/public/stripe/webhook
                  </code>
                </p>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <a
                    href="https://dashboard.stripe.com/webhooks"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Otvoriť Stripe Dashboard <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPONSORS */}
        <TabsContent value="sponsors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sponzori</CardTitle>
                <CardDescription>
                  Spravuj zobrazenie na verejnej stránke {config.sponsors_page_path}.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={exportSponsors}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meno / Firma</TableHead>
                    <TableHead>Suma celkom</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Od</TableHead>
                    <TableHead className="w-32">Verejne</TableHead>
                    <TableHead className="w-16 text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.display_name}</TableCell>
                      <TableCell>{s.amount_total.toFixed(2)} €</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {s.frequency === "monthly"
                            ? "Mesačne"
                            : s.frequency === "one_time"
                              ? "Jednorazovo"
                              : "Mix"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.first_donation_at).toLocaleDateString("sk-SK")}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={s.public}
                          onCheckedChange={() => toggleSponsorPublic(s.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeSponsor(s.id)}
                          aria-label="Zmazať"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sponsors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Zatiaľ žiadni sponzori.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEGAL */}
        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Súhlasy a právne texty</CardTitle>
              <CardDescription>
                Použité priamo vo formulári /podpora a v päte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Súhlas — okamžité poskytovanie (§ 7 ods. 6)">
                <Textarea
                  rows={3}
                  value={config.consent_invoice_text}
                  onChange={(e) => update({ consent_invoice_text: e.target.value })}
                />
              </Field>
              <Field label="Súhlas — spracovanie údajov">
                <Textarea
                  rows={3}
                  value={config.consent_privacy_text}
                  onChange={(e) => update({ consent_privacy_text: e.target.value })}
                />
              </Field>
              <Field label="Päta formulára (Stripe disclaimer)">
                <Textarea
                  rows={4}
                  value={config.footer_disclaimer}
                  onChange={(e) => update({ footer_disclaimer: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-card/40 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

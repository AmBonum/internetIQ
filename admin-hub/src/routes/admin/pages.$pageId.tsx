import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  pagesStore,
  newId,
  blankSection,
  sectionKindLabels,
  type Page,
  type Section,
  type SectionKind,
  type FeatureItem,
  type FaqItem,
  type StatItem,
  type TestimonialItem,
  type PricingPlan,
} from "@/lib/admin/cms-store";
import { usePages } from "@/lib/admin/cms-hooks";

export const Route = createFileRoute("/admin/pages/$pageId")({
  component: PageEditor,
});

function updatePage(id: string, patch: (p: Page) => Page) {
  pagesStore.set((prev) =>
    prev.map((p) => (p.id === id ? { ...patch(p), updatedAt: new Date().toISOString() } : p)),
  );
}

function PageEditor() {
  const { pageId } = Route.useParams();
  const pages = usePages();
  const page = useMemo(() => pages.find((p) => p.id === pageId), [pages, pageId]);
  const [addKind, setAddKind] = useState<SectionKind>("hero");

  if (!page) {
    return (
      <div className="space-y-4">
        <PageHeader title="Stránka nenájdená" />
        <Button asChild variant="outline">
          <Link to="/admin/pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na zoznam
          </Link>
        </Button>
      </div>
    );
  }

  const patchPage = (patch: Partial<Page>) => updatePage(page.id, (p) => ({ ...p, ...patch }));

  const patchSection = (sid: string, patch: Partial<Section>) =>
    updatePage(page.id, (p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)),
    }));

  const moveSection = (idx: number, dir: -1 | 1) =>
    updatePage(page.id, (p) => {
      const arr = [...p.sections];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...p, sections: arr };
    });

  const addSection = () => {
    updatePage(page.id, (p) => ({ ...p, sections: [...p.sections, blankSection(addKind)] }));
    toast.success(`Pridaná sekcia: ${sectionKindLabels[addKind]}`);
  };

  const removeSection = (sid: string) =>
    updatePage(page.id, (p) => ({ ...p, sections: p.sections.filter((s) => s.id !== sid) }));

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/admin/pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Späť na podstránky
          </Link>
        </Button>
        <PageHeader
          title={page.title || "Bez názvu"}
          description={page.slug}
          actions={
            <>
              <Button asChild variant="outline">
                <a href={page.slug} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Zobraziť
                </a>
              </Button>
              <Button onClick={() => toast.success("Zmeny sú uložené")}>Uložené</Button>
            </>
          }
        />
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Sekcie ({page.sections.length})</TabsTrigger>
          <TabsTrigger value="details">Detaily</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* SECTIONS */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Pridať sekciu</CardTitle>
                <CardDescription>
                  Stránka má {page.sections.length} {page.sections.length === 1 ? "sekciu" : "sekcií"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={addKind} onValueChange={(v) => setAddKind(v as SectionKind)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sectionKindLabels).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSection}>
                  <Plus className="mr-2 h-4 w-4" />
                  Pridať
                </Button>
              </div>
            </CardHeader>
          </Card>

          {page.sections.map((s, i) => (
            <SectionCard
              key={s.id}
              section={s}
              index={i}
              total={page.sections.length}
              onChange={(p) => patchSection(s.id, p)}
              onMove={(dir) => moveSection(i, dir)}
              onRemove={() => removeSection(s.id)}
            />
          ))}

          {page.sections.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Žiadne sekcie. Pridaj prvú vyššie.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DETAILS */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Základné údaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Názov stránky</Label>
                <Input value={page.title} onChange={(e) => patchPage({ title: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>URL (slug)</Label>
                <Input value={page.slug} onChange={(e) => patchPage({ slug: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Popis</Label>
                <Textarea
                  rows={3}
                  value={page.description}
                  onChange={(e) => patchPage({ description: e.target.value })}
                />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label>Stav</Label>
                <Select value={page.status} onValueChange={(v) => patchPage({ status: v as Page["status"] })}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Koncept</SelectItem>
                    <SelectItem value="published">Publikované</SelectItem>
                    <SelectItem value="archived">Archív</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Zobraziť v sitemap.xml</div>
                  <div className="text-xs text-muted-foreground">Vyhľadávače budú stránku indexovať.</div>
                </div>
                <Switch
                  checked={page.showInSitemap}
                  onCheckedChange={(v) => patchPage({ showInSitemap: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO a sociálne siete</CardTitle>
              <CardDescription>Meta tagy a OG image pre zdieľanie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Meta title</Label>
                <Input value={page.title} onChange={(e) => patchPage({ title: e.target.value })} />
                <p className="text-xs text-muted-foreground">{page.title.length} / 60 znakov</p>
              </div>
              <div className="grid gap-2">
                <Label>Meta description</Label>
                <Textarea
                  rows={3}
                  value={page.description}
                  onChange={(e) => patchPage({ description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{page.description.length} / 160 znakov</p>
              </div>
              <div className="grid gap-2">
                <Label>OG image URL</Label>
                <Input
                  placeholder="/og/moja-stranka.jpg"
                  value={page.ogImage ?? ""}
                  onChange={(e) => patchPage({ ogImage: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section editor
// ────────────────────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  section: Section;
  index: number;
  total: number;
  onChange: (p: Partial<Section>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <Card className={section.enabled ? "" : "opacity-60"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">
            #{index + 1}
          </Badge>
          <div>
            <CardTitle className="text-base">{sectionKindLabels[section.kind]}</CardTitle>
            <CardDescription>{section.heading || <em>bez nadpisu</em>}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange({ enabled: !section.enabled })}
            title={section.enabled ? "Skryť" : "Zobraziť"}
          >
            {section.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SectionFields section={section} onChange={onChange} />
        <Separator />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Pozadie</Label>
            <Select
              value={section.background ?? "default"}
              onValueChange={(v) => onChange({ background: v as Section["background"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Štandardné</SelectItem>
                <SelectItem value="muted">Tlmené</SelectItem>
                <SelectItem value="primary">Primárne</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Zarovnanie</Label>
            <Select
              value={section.align ?? "left"}
              onValueChange={(v) => onChange({ align: v as Section["align"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Vľavo</SelectItem>
                <SelectItem value="center">Na stred</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(section.kind === "features" || section.kind === "gallery" || section.kind === "pricing") && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Počet stĺpcov</Label>
              <Select
                value={String(section.columns ?? 3)}
                onValueChange={(v) => onChange({ columns: Number(v) as 2 | 3 | 4 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionFields({ section, onChange }: { section: Section; onChange: (p: Partial<Section>) => void }) {
  const k = section.kind;

  const Common = (
    <>
      {(k === "hero" || k === "cta" || k === "rich_text" || k === "features" || k === "faq" ||
        k === "stats" || k === "testimonials" || k === "gallery" || k === "pricing" ||
        k === "contact_form") && (
        <>
          <div className="grid gap-2">
            <Label>Nadpis (eyebrow)</Label>
            <Input
              value={section.eyebrow ?? ""}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
              placeholder="Voliteľný malý nadpis nad hlavným"
            />
          </div>
          <div className="grid gap-2">
            <Label>Nadpis</Label>
            <Input value={section.heading ?? ""} onChange={(e) => onChange({ heading: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Podnadpis</Label>
            <Textarea
              rows={2}
              value={section.subheading ?? ""}
              onChange={(e) => onChange({ subheading: e.target.value })}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-3">
      {Common}

      {(k === "hero" || k === "cta") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Tlačidlo — text</Label>
            <Input value={section.ctaLabel ?? ""} onChange={(e) => onChange({ ctaLabel: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Tlačidlo — URL</Label>
            <Input value={section.ctaUrl ?? ""} onChange={(e) => onChange({ ctaUrl: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Sekundárne tlačidlo — text</Label>
            <Input
              value={section.secondaryCtaLabel ?? ""}
              onChange={(e) => onChange({ secondaryCtaLabel: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Sekundárne tlačidlo — URL</Label>
            <Input
              value={section.secondaryCtaUrl ?? ""}
              onChange={(e) => onChange({ secondaryCtaUrl: e.target.value })}
            />
          </div>
        </div>
      )}

      {(k === "hero" || k === "image") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Obrázok URL</Label>
            <Input value={section.imageUrl ?? ""} onChange={(e) => onChange({ imageUrl: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Alt text</Label>
            <Input value={section.imageAlt ?? ""} onChange={(e) => onChange({ imageAlt: e.target.value })} />
          </div>
        </div>
      )}

      {k === "rich_text" && (
        <div className="grid gap-2">
          <Label>Obsah</Label>
          <Textarea
            rows={6}
            value={section.body ?? ""}
            onChange={(e) => onChange({ body: e.target.value })}
          />
        </div>
      )}

      {k === "features" && (
        <ListEditor<FeatureItem>
          label="Karty"
          items={section.features ?? []}
          newItem={() => ({ id: newId("f"), title: "Nová karta", description: "", icon: "Sparkles" })}
          onChange={(items) => onChange({ features: items })}
          render={(it, patch) => (
            <>
              <Input
                placeholder="Názov"
                value={it.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Popis"
                value={it.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
              <Input
                placeholder="Lucide ikona (napr. MessageSquare)"
                value={it.icon ?? ""}
                onChange={(e) => patch({ icon: e.target.value })}
              />
            </>
          )}
        />
      )}

      {k === "faq" && (
        <ListEditor<FaqItem>
          label="Otázky"
          items={section.faqs ?? []}
          newItem={() => ({ id: newId("q"), question: "Nová otázka?", answer: "" })}
          onChange={(items) => onChange({ faqs: items })}
          render={(it, patch) => (
            <>
              <Input
                placeholder="Otázka"
                value={it.question}
                onChange={(e) => patch({ question: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Odpoveď"
                value={it.answer}
                onChange={(e) => patch({ answer: e.target.value })}
              />
            </>
          )}
        />
      )}

      {k === "stats" && (
        <ListEditor<StatItem>
          label="Čísla"
          items={section.stats ?? []}
          newItem={() => ({ id: newId("st"), label: "Popis", value: "100+" })}
          onChange={(items) => onChange({ stats: items })}
          render={(it, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Hodnota" value={it.value} onChange={(e) => patch({ value: e.target.value })} />
              <Input placeholder="Popis" value={it.label} onChange={(e) => patch({ label: e.target.value })} />
            </div>
          )}
        />
      )}

      {k === "testimonials" && (
        <ListEditor<TestimonialItem>
          label="Referencie"
          items={section.testimonials ?? []}
          newItem={() => ({ id: newId("t"), quote: "", author: "" })}
          onChange={(items) => onChange({ testimonials: items })}
          render={(it, patch) => (
            <>
              <Textarea
                rows={2}
                placeholder="Citát"
                value={it.quote}
                onChange={(e) => patch({ quote: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Autor"
                  value={it.author}
                  onChange={(e) => patch({ author: e.target.value })}
                />
                <Input
                  placeholder="Rola / mesto"
                  value={it.role ?? ""}
                  onChange={(e) => patch({ role: e.target.value })}
                />
              </div>
            </>
          )}
        />
      )}

      {k === "gallery" && (
        <ListEditor
          label="Obrázky"
          items={section.gallery ?? []}
          newItem={() => ({ id: newId("g"), url: "", alt: "" })}
          onChange={(items) => onChange({ gallery: items })}
          render={(it, patch) => (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="URL obrázka" value={it.url} onChange={(e) => patch({ url: e.target.value })} />
              <Input
                placeholder="Alt text"
                value={it.alt ?? ""}
                onChange={(e) => patch({ alt: e.target.value })}
              />
            </div>
          )}
        />
      )}

      {k === "pricing" && (
        <ListEditor<PricingPlan>
          label="Cenové balíky"
          items={section.pricing ?? []}
          newItem={() => ({
            id: newId("p"),
            name: "Nový balík",
            price: "0 €",
            features: [],
            ctaLabel: "Vybrať",
            ctaUrl: "/",
          })}
          onChange={(items) => onChange({ pricing: items })}
          render={(it, patch) => (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Názov" value={it.name} onChange={(e) => patch({ name: e.target.value })} />
                <Input placeholder="Cena" value={it.price} onChange={(e) => patch({ price: e.target.value })} />
                <Input
                  placeholder="Obdobie (mes.)"
                  value={it.period ?? ""}
                  onChange={(e) => patch({ period: e.target.value })}
                />
              </div>
              <Textarea
                rows={3}
                placeholder="Funkcie (každá na nový riadok)"
                value={it.features.join("\n")}
                onChange={(e) => patch({ features: e.target.value.split("\n").filter(Boolean) })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="CTA text"
                  value={it.ctaLabel ?? ""}
                  onChange={(e) => patch({ ctaLabel: e.target.value })}
                />
                <Input
                  placeholder="CTA URL"
                  value={it.ctaUrl ?? ""}
                  onChange={(e) => patch({ ctaUrl: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={!!it.highlighted}
                  onCheckedChange={(v) => patch({ highlighted: v })}
                />
                Zvýrazniť ako odporúčaný
              </label>
            </>
          )}
        />
      )}
    </div>
  );
}

function ListEditor<T extends { id: string }>({
  label,
  items,
  newItem,
  onChange,
  render,
}: {
  label: string;
  items: T[];
  newItem: () => T;
  onChange: (items: T[]) => void;
  render: (it: T, patch: (p: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button size="sm" variant="outline" onClick={() => onChange([...items, newItem()])}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Pridať
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.id} className="space-y-2 rounded-md border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">#{i + 1}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onChange(items.filter((x) => x.id !== it.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {render(it, (p) =>
              onChange(items.map((x) => (x.id === it.id ? { ...x, ...p } : x))),
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
            Zatiaľ nič. Klikni „Pridať".
          </div>
        )}
      </div>
    </div>
  );
}

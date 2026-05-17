import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuStore, newId, type MenuItem, type MenuLocation } from "@/lib/admin/cms-store";
import { useMenu } from "@/lib/admin/cms-hooks";

export const Route = createFileRoute("/admin/navigation")({
  component: NavigationPage,
});

const LOCATIONS: { id: MenuLocation; title: string; description: string }[] = [
  { id: "header", title: "Hlavné menu (header)", description: "Navigácia v hornej časti webu." },
  { id: "footer_product", title: "Footer — Produkt", description: "Stĺpec v päte: produktové odkazy." },
  { id: "footer_company", title: "Footer — Firma", description: "Stĺpec v päte: o nás, blog, kontakt." },
  { id: "footer_legal", title: "Footer — Právne", description: "Stĺpec v päte: GDPR, podmienky, cookies." },
];

function NavigationPage() {
  const items = useMenu();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigácia"
        description="Spravuj odkazy v hlavičke a päte webu."
      />

      <Tabs defaultValue="header">
        <TabsList>
          {LOCATIONS.map((l) => (
            <TabsTrigger key={l.id} value={l.id}>
              {l.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {LOCATIONS.map((l) => (
          <TabsContent key={l.id} value={l.id} className="space-y-4">
            <MenuList location={l.id} title={l.title} description={l.description} items={items} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MenuList({
  location,
  title,
  description,
  items,
}: {
  location: MenuLocation;
  title: string;
  description: string;
  items: MenuItem[];
}) {
  const filtered = items.filter((i) => i.location === location).sort((a, b) => a.order - b.order);

  const add = () =>
    menuStore.set((prev) => [
      ...prev,
      {
        id: newId("m"),
        label: "Nová položka",
        url: "/",
        location,
        order: filtered.length + 1,
      },
    ]);

  const patch = (id: string, p: Partial<MenuItem>) =>
    menuStore.set((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const remove = (id: string) => {
    menuStore.set((prev) => prev.filter((x) => x.id !== id));
    toast.success("Odstránené");
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = filtered.findIndex((x) => x.id === id);
    const target = idx + dir;
    if (target < 0 || target >= filtered.length) return;
    const a = filtered[idx];
    const b = filtered[target];
    menuStore.set((prev) =>
      prev.map((x) => {
        if (x.id === a.id) return { ...x, order: b.order };
        if (x.id === b.id) return { ...x, order: a.order };
        return x;
      }),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Pridať položku
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.map((it, i) => (
          <div key={it.id} className="flex items-center gap-2 rounded-md border bg-card p-3">
            <div className="flex flex-col">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={i === 0}
                onClick={() => move(it.id, -1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={i === filtered.length - 1}
                onClick={() => move(it.id, 1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-xs">Text odkazu</Label>
                <Input value={it.label} onChange={(e) => patch(it.id, { label: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">URL</Label>
                <Input value={it.url} onChange={(e) => patch(it.id, { url: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs">
                <Switch
                  checked={!!it.openInNewTab}
                  onCheckedChange={(v) => patch(it.id, { openInNewTab: v })}
                />
                <ExternalLink className="h-3 w-3" />
              </label>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(it.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            Žiadne položky.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

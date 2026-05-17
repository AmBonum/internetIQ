import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Lock, Send, Archive, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTests, currentUserId } from "@/lib/platform/store";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/tests/")({
  head: () => ({ meta: [{ title: "Moje testy · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: TestsList,
});

function TestsList() {
  const tests = useTests().filter((t) => t.owner_id === currentUserId());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft" | "archived">("all");

  const filtered = tests.filter((t) =>
    (status === "all" || t.status === status) &&
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Testy"
        title="Moje testy"
        accentWords={1}
        subtitle="Spravuj draft, publikuj a sleduj výsledky."
        actions={
          <Button size="sm" asChild className="btn-primary">
            <Link to="/app/tests/new"><Plus className="mr-2 h-3 w-3" />Nový test</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-7" placeholder="Hľadať..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <TabsList>
            <TabsTrigger value="all">Všetky ({tests.length})</TabsTrigger>
            <TabsTrigger value="published"><Send className="mr-1 h-3 w-3" />Publikované</TabsTrigger>
            <TabsTrigger value="draft"><FileEdit className="mr-1 h-3 w-3" />Drafty</TabsTrigger>
            <TabsTrigger value="archived"><Archive className="mr-1 h-3 w-3" />Archív</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((t) => (
          <Link key={t.id} to="/app/tests/$testId" params={{ testId: t.id }}>
            <Card className="cursor-pointer transition hover:border-primary/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.title}</div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  <Badge variant={t.status === "published" ? "default" : t.status === "draft" ? "secondary" : "outline"} className="shrink-0 text-[10px]">
                    {t.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>v{t.version}</span>
                  <span>·</span>
                  <span>{t.question_ids.length} otázok</span>
                  {t.password && <><span>·</span><Lock className="h-3 w-3" />heslo</>}
                  {t.segmentation.map((s) => <Badge key={s} variant="secondary" className="font-normal text-[10px]">{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Card className="md:col-span-2"><CardContent className="p-8 text-center text-sm text-muted-foreground">Žiadne testy v tomto filtri.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

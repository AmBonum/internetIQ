import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuestions } from "@/lib/platform/store";
import type { QuestionType } from "@/lib/platform/types";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/library")({
  head: () => ({ meta: [{ title: "Knižnica otázok · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: LibraryPage,
});

const TYPE_LABEL: Record<QuestionType, string> = {
  single: "Jednovýber", multi: "Viacvýber", scale_1_5: "Škála 1-5", scale_1_10: "Škála 1-10",
  nps: "NPS", matrix: "Matrix", ranking: "Ranking", slider: "Slider",
  short_text: "Krátky text", long_text: "Dlhý text", date: "Dátum", time: "Čas",
  file_upload: "Súbor", image_choice: "Obrázok", yes_no: "Áno/Nie",
};

function LibraryPage() {
  const questions = useQuestions();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");

  const cats = useMemo(() => Array.from(new Set(questions.map((x) => x.category))), [questions]);
  const filtered = questions.filter((x) =>
    (type === "all" || x.type === type) &&
    (cat === "all" || x.category === cat) &&
    (!q || x.prompt.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Obsah"
        title="Knižnica otázok"
        accentWords={1}
        subtitle={`Globálna knižnica · ${questions.length} otázok · 15 typov`}
      />
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Hľadať..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky typy</SelectItem>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky kategórie</SelectItem>
              {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.slice(0, 60).map((qq) => (
          <Card key={qq.id} className="border-border/60">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{qq.prompt}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">{TYPE_LABEL[qq.type]}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">{qq.category}</Badge>
                <Badge variant="secondary" className="text-[10px]">{qq.difficulty}</Badge>
                <Badge variant={qq.status === "approved" ? "default" : "outline"} className="text-[10px]">{qq.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length > 60 && <p className="text-center text-xs text-muted-foreground">Zobrazených prvých 60 z {filtered.length}</p>}
    </div>
  );
}

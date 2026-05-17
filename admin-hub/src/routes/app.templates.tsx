import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Layers, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTest, useTemplates } from "@/lib/platform/store";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";

export const Route = createFileRoute("/app/templates")({
  head: () => ({ meta: [{ title: "Šablóny · SubenAI" }, { name: "robots", content: "noindex" }] }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const templates = useTemplates();
  const nav = useNavigate();

  const useTemplate = (tpl: typeof templates[number]) => {
    const t = createTest({
      title: `${tpl.title} (z šablóny)`,
      description: tpl.description,
      gdpr_purpose: tpl.gdpr_purpose,
      question_ids: tpl.question_ids,
      use_predefined_set: true,
      predefined_set_id: tpl.id,
    });
    toast.success("Test vytvorený zo šablóny");
    nav({ to: "/app/tests/$testId", params: { testId: t.id } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knižnica"
        title="Šablóny testov"
        accentWords={1}
        icon={Layers}
        subtitle="Vyber pripravenú šablónu a uprav podľa potreby."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((tpl) => (
          <Card key={tpl.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium"><Layers className="h-4 w-4 text-primary" />{tpl.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">{tpl.question_ids.length} otázok</Badge>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <Badge variant="outline" className="font-normal text-[10px]">{tpl.gdpr_purpose}</Badge>
                <Button size="sm" onClick={() => useTemplate(tpl)}><Sparkles className="mr-2 h-3 w-3" />Použiť šablónu</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

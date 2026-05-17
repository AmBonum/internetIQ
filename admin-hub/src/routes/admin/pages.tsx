import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Copy, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pagesStore, newId, type Page } from "@/lib/admin/cms-store";
import { usePages } from "@/lib/admin/cms-hooks";

export const Route = createFileRoute("/admin/pages")({
  component: PagesPage,
});

function statusVariant(s: Page["status"]) {
  return s === "published" ? "default" : s === "draft" ? "secondary" : "outline";
}

function PagesPage() {
  const pages = usePages();

  const createPage = () => {
    const id = newId("pg");
    const p: Page = {
      id,
      slug: "/nova-stranka-" + id.slice(-4),
      title: "Nová stránka",
      description: "",
      status: "draft",
      showInSitemap: true,
      updatedAt: new Date().toISOString(),
      sections: [],
    };
    pagesStore.set((prev) => [p, ...prev]);
    toast.success("Stránka vytvorená");
  };

  const duplicate = (page: Page) => {
    const copy: Page = {
      ...page,
      id: newId("pg"),
      slug: page.slug + "-kopia",
      title: page.title + " (kópia)",
      status: "draft",
      updatedAt: new Date().toISOString(),
      sections: page.sections.map((s) => ({ ...s, id: newId("sec") })),
    };
    pagesStore.set((prev) => [copy, ...prev]);
    toast.success("Skopírované");
  };

  const remove = (id: string) => {
    pagesStore.set((prev) => prev.filter((p) => p.id !== id));
    toast.success("Zmazané");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Podstránky"
        description="Spravuj stránky webu — obsah, sekcie, SEO a stav publikovania."
        actions={
          <Button onClick={createPage}>
            <Plus className="mr-2 h-4 w-4" />
            Nová stránka
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stránka</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Sekcie</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Aktualizované</TableHead>
                <TableHead className="text-right">Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                  <TableCell>{p.sections.length}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>
                      {p.status === "published" ? "Publikované" : p.status === "draft" ? "Koncept" : "Archív"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("sk-SK")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Otvoriť na webe">
                        <a href={p.slug} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button asChild size="icon" variant="ghost" title="Editovať">
                        <Link to="/admin/pages/$pageId" params={{ pageId: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" title="Duplikovať" onClick={() => duplicate(p)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Zmazať"
                        onClick={() => remove(p.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { type ShareCardConfig, type ShareRatingTier } from "@/lib/admin-mock-data";
import { adminRepo, useAdminState } from "@/lib/admin/store";

export const Route = createFileRoute("/admin/share-card")({
  component: ShareCardPage,
});

const tierForScore = (cfg: ShareCardConfig, percent: number) => {
  const sorted = [...cfg.tiers].sort((a, b) => a.min_score - b.min_score);
  let match = sorted[0];
  for (const t of sorted) if (percent >= t.min_score) match = t;
  return match;
};

const interpolate = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

function ShareCardPage() {
  const cfg = useAdminState((s) => s.shareCard);
  const [previewScore, setPreviewScore] = useState(7);
  const [previewTotal, setPreviewTotal] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const percent = Math.round((previewScore / previewTotal) * 100);
  const tier = useMemo(() => tierForScore(cfg, percent), [cfg, percent]);

  const vars = {
    score: previewScore,
    total: previewTotal,
    percent,
    label: tier.label,
    emoji: tier.emoji,
  };
  const title = interpolate(cfg.title_template, vars);
  const subtitle = interpolate(cfg.subtitle_template, vars);
  const shareText = interpolate(cfg.share_text, vars);

  const update = <K extends keyof ShareCardConfig>(key: K, value: ShareCardConfig[K]) =>
    adminRepo.shareCard.update({ [key]: value } as Partial<ShareCardConfig>);

  const updateTier = (id: string, patch: Partial<ShareRatingTier>) =>
    adminRepo.shareCard.update({
      tiers: cfg.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  const addTier = () =>
    adminRepo.shareCard.update({
      tiers: [
        ...cfg.tiers,
        {
          id: `t_${Date.now()}`,
          min_score: 50,
          label: "Nový stupeň",
          emoji: "✨",
          color: "#6366f1",
        },
      ],
    });
  const removeTier = (id: string) =>
    adminRepo.shareCard.update({ tiers: cfg.tiers.filter((t) => t.id !== id) });

  const downloadPng = async () => {
    // Render preview into canvas 1200x630
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = 1200;
    c.height = 630;

    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, cfg.background_from);
    grad.addColorStop(1, cfg.background_to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    // accent bar
    ctx.fillStyle = tier.color;
    ctx.fillRect(0, 0, 1200, 12);

    // logo
    if (cfg.show_logo) {
      ctx.fillStyle = cfg.text_color;
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.fillText("SubenAI", 60, 80);
    }

    // score ring
    if (cfg.show_score_ring) {
      const cx = 950;
      const cy = 315;
      const r = 130;
      ctx.lineWidth = 22;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = tier.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (percent / 100) * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = cfg.text_color;
      ctx.font = "bold 72px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${percent}%`, cx, cy + 24);
      ctx.textAlign = "left";
    }

    // title
    ctx.fillStyle = cfg.text_color;
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText(title, 60, 280);

    // subtitle
    ctx.fillStyle = cfg.text_color;
    ctx.globalAlpha = 0.85;
    ctx.font = "32px system-ui, sans-serif";
    ctx.fillText(subtitle, 60, 340);
    ctx.globalAlpha = 1;

    // footer
    ctx.fillStyle = cfg.accent_color;
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText(cfg.footer_text, 60, 580);

    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "share-card.png";
    a.click();
    toast.success("Obrázok stiahnutý");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link to="/admin/tests">
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na testy
        </Link>
      </Button>

      <PageHeader
        title="Share karta výsledku testu"
        description="Editor obrázka pre zdieľanie výsledku na sociálnych sieťach po dokončení testu. Zmeny sa ukladajú automaticky."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { adminRepo.shareCard.reset(); toast.info("Obnovené na predvolené"); }}>
              Obnoviť
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPng}>
              <Download className="mr-2 h-4 w-4" /> Stiahnuť PNG
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Live preview */}
        <Card className="lg:col-span-3 border-border/60 shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Náhľad (1200×630)</CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <Switch
                  checked={cfg.enabled}
                  onCheckedChange={(v) => update("enabled", v)}
                />
                <span className="text-muted-foreground">
                  {cfg.enabled ? "Zobraziť po teste" : "Vypnuté"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="relative aspect-[1200/630] w-full overflow-hidden rounded-xl shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${cfg.background_from}, ${cfg.background_to})`,
                color: cfg.text_color,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-2"
                style={{ background: tier.color }}
              />
              {cfg.show_logo && (
                <div className="absolute left-[5%] top-[10%] text-2xl font-bold">
                  SubenAI
                </div>
              )}

              <div className="absolute left-[5%] top-[40%] w-[55%] space-y-2">
                <div className="text-[44px] font-bold leading-tight">{title}</div>
                <div className="text-xl opacity-80">{subtitle}</div>
              </div>

              {cfg.show_score_ring && (
                <div className="absolute right-[8%] top-1/2 -translate-y-1/2">
                  <div className="relative h-56 w-56">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth="9"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={tier.color}
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={`${(percent / 100) * 264} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold">
                      {percent}%
                    </div>
                  </div>
                </div>
              )}

              <div
                className="absolute bottom-[8%] left-[5%] text-base font-medium"
                style={{ color: cfg.accent_color }}
              >
                {cfg.footer_text}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                Náhľad parametre
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Skóre: {previewScore}</Label>
                  <Slider
                    min={0}
                    max={previewTotal}
                    step={1}
                    value={[previewScore]}
                    onValueChange={(v) => setPreviewScore(v[0])}
                  />
                </div>
                <div>
                  <Label className="text-xs">Celkom: {previewTotal}</Label>
                  <Slider
                    min={1}
                    max={30}
                    step={1}
                    value={[previewTotal]}
                    onValueChange={(v) => {
                      setPreviewTotal(v[0]);
                      if (previewScore > v[0]) setPreviewScore(v[0]);
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Aktívny stupeň: <Badge variant="secondary">{tier.emoji} {tier.label}</Badge>
              </div>
              <div className="rounded-md border border-border/60 bg-background p-2 text-xs">
                <div className="flex items-center gap-1 font-medium">
                  <Share2 className="h-3 w-3" /> Text pre zdieľanie:
                </div>
                <p className="mt-1 text-muted-foreground">{shareText}</p>
                <p className="mt-1 text-primary">{cfg.hashtags}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Texty a šablóny</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <Label className="text-xs">
                  Titulok (premenné: {"{label} {emoji} {percent} {score} {total}"})
                </Label>
                <Input
                  value={cfg.title_template}
                  onChange={(e) => update("title_template", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Podtitulok</Label>
                <Input
                  value={cfg.subtitle_template}
                  onChange={(e) => update("subtitle_template", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Pätka</Label>
                <Input
                  value={cfg.footer_text}
                  onChange={(e) => update("footer_text", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Text pre share na soc. sietí</Label>
                <Textarea
                  rows={2}
                  value={cfg.share_text}
                  onChange={(e) => update("share_text", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs">Hashtagy</Label>
                <Input
                  value={cfg.hashtags}
                  onChange={(e) => update("hashtags", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Vzhľad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="Pozadie od"
                  value={cfg.background_from}
                  onChange={(v) => update("background_from", v)}
                />
                <ColorField
                  label="Pozadie do"
                  value={cfg.background_to}
                  onChange={(v) => update("background_to", v)}
                />
                <ColorField
                  label="Text"
                  value={cfg.text_color}
                  onChange={(v) => update("text_color", v)}
                />
                <ColorField
                  label="Akcent (pätka)"
                  value={cfg.accent_color}
                  onChange={(v) => update("accent_color", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
                <Label>Zobraziť logo</Label>
                <Switch
                  checked={cfg.show_logo}
                  onCheckedChange={(v) => update("show_logo", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
                <Label>Zobraziť skóre kruh</Label>
                <Switch
                  checked={cfg.show_score_ring}
                  onCheckedChange={(v) => update("show_score_ring", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Vtipné hodnotenia (stupne)</CardTitle>
                <Button size="sm" variant="outline" onClick={addTier}>
                  <Plus className="mr-1 h-3 w-3" /> Pridať
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...cfg.tiers]
                .sort((a, b) => a.min_score - b.min_score)
                .map((t) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-[60px_1fr_70px_50px_32px] items-center gap-2 rounded-md border border-border/60 p-2"
                  >
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={t.min_score}
                      onChange={(e) =>
                        updateTier(t.id, { min_score: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs"
                    />
                    <Input
                      value={t.label}
                      onChange={(e) => updateTier(t.id, { label: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Input
                      value={t.emoji}
                      onChange={(e) => updateTier(t.id, { emoji: e.target.value })}
                      className="h-8 text-center text-xs"
                    />
                    <input
                      type="color"
                      value={t.color}
                      onChange={(e) => updateTier(t.id, { color: e.target.value })}
                      className="h-8 w-full cursor-pointer rounded border border-border/60"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeTier(t.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              <p className="text-[11px] text-muted-foreground">
                Stupeň sa vyberá podľa <b>min. skóre</b> v percentách (vrátane).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-border/60"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-xs"
        />
      </div>
    </div>
  );
}

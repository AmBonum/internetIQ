import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Link as LinkIcon,
  Mail,
  Plus,
  Send,
  Trash2,
  X,
  Twitter,
  Facebook,
  MessageCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SharedAccess, UserTestSet } from "@/lib/user-mock-data";

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  set: UserTestSet | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ShareDialog({ open, onOpenChange, set }: ShareDialogProps) {
  const shareUrl = useMemo(
    () => (set ? `https://subenai.sk/s/${set.slug}` : ""),
    [set],
  );

  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [access, setAccess] = useState<SharedAccess>("play");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && set) {
      setEmails([]);
      setDraft("");
      setMessage(
        `Ahoj! Skús túto sadu otázok "${set.title}" na SubenAI — zaberie ti to len pár minút.`,
      );
    }
  }, [open, set]);

  const tryAddDraft = () => {
    const cleaned = draft
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    const bad: string[] = [];
    const good: string[] = [];
    for (const e of cleaned) {
      if (!EMAIL_RE.test(e)) bad.push(e);
      else if (!emails.includes(e)) good.push(e);
    }
    if (good.length) setEmails((p) => [...p, ...good]);
    if (bad.length) toast.error(`Neplatný email: ${bad.join(", ")}`);
    setDraft("");
  };

  const onDraftKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " " || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        tryAddDraft();
      }
    } else if (e.key === "Backspace" && !draft && emails.length) {
      setEmails((p) => p.slice(0, -1));
    }
  };

  const remove = (email: string) => setEmails((p) => p.filter((e) => e !== email));

  const sendInvites = () => {
    if (draft.trim()) tryAddDraft();
    setTimeout(() => {
      if (!emails.length) {
        toast.error("Pridaj aspoň jeden email");
        return;
      }
      setSending(true);
      // TODO: zavolať user-invites server fn → vytvorí tokeny + pošle cez Lovable Emails
      setTimeout(() => {
        toast.success(`Odoslaných ${emails.length} pozvánok`);
        setSending(false);
        onOpenChange(false);
      }, 600);
    }, 0);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl).then(
      () => toast.success("Odkaz skopírovaný"),
      () => toast.error("Nepodarilo sa skopírovať"),
    );
  };

  if (!set) return null;

  const shareText = encodeURIComponent(
    `Otestuj sa: ${set.title} na SubenAI — ${shareUrl}`,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Zdieľať „{set.title}"</DialogTitle>
          <DialogDescription>
            Pošli sadu kolegom alebo rodine. Môžeš zdieľať odkazom alebo poslať pozvánku
            priamo na ich email.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Pozvať emailom
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="mr-2 h-4 w-4" />
              Verejný odkaz
            </TabsTrigger>
          </TabsList>

          {/* ---- EMAIL INVITES ---- */}
          <TabsContent value="email" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Príjemcovia</Label>
              <div className="rounded-md border border-input bg-background p-2">
                <div className="flex flex-wrap gap-1.5">
                  {emails.map((e) => (
                    <Badge key={e} variant="secondary" className="gap-1 pl-2 pr-1">
                      {e}
                      <button
                        type="button"
                        onClick={() => remove(e)}
                        className="rounded-sm p-0.5 opacity-60 hover:bg-background hover:opacity-100"
                        aria-label={`Odstrániť ${e}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onDraftKey}
                    onBlur={() => draft.trim() && tryAddDraft()}
                    placeholder={
                      emails.length
                        ? "Pridať ďalší..."
                        : "email@example.sk, druhy@example.sk..."
                    }
                    className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Odde\u013e enterom, čiarkou alebo medzerou. Maximálne 50 adries na jedno odoslanie.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Práva</Label>
                <Select value={access} onValueChange={(v) => setAccess(v as SharedAccess)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="play">Iba spustiť test</SelectItem>
                    <SelectItem value="view">Pozrieť otázky</SelectItem>
                    <SelectItem value="edit">Upraviť sadu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pridaných</Label>
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {emails.length} {emails.length === 1 ? "príjemca" : "príjemcov"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="msg">Krátky odkaz (voliteľné)</Label>
              <Textarea
                id="msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Napíš pár slov, prečo by si to mali spraviť..."
                maxLength={300}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Zrušiť
              </Button>
              <Button type="button" onClick={sendInvites} disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Posielam..." : `Poslať pozvánky (${emails.length})`}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ---- PUBLIC LINK ---- */}
          <TabsContent value="link" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Verejný odkaz</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={copyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Kopírovať
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ktokoľvek s týmto odkazom si môže pustiť test. Môžeš ho kedykoľvek
                deaktivovať v detaile sady.
              </p>
            </div>

            {set.password ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  🔒 Test je chránený heslom
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Respondenti budú musieť zadať heslo:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                    {set.password}
                  </code>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Zmeň alebo vypni heslo v Detailoch sady.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  💡 Tip: V detaile sady môžeš zapnúť ochranu heslom, aby test mohli
                  vyplniť len ľudia, ktorým ho pošleš.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Zdieľať na sociálnych sieťach</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Twitter className="mr-2 h-4 w-4" /> X / Twitter
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Facebook className="mr-2 h-4 w-4" /> Facebook
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-medium text-foreground">Aktívne pozvánky</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {set.shared_with_count} ľudí má prístup k tejto sade. Spravuj v detaile sady.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// remove unused import warning helper
void Trash2;

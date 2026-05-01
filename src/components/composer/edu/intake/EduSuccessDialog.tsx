import { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/browser/clipboard";

interface Props {
  publicUrl: string;
  resultsUrl: string;
  password: string;
  onClose: () => void;
}

type CopyKey = "public" | "results" | "password" | null;

export function EduSuccessDialog({ publicUrl, resultsUrl, password, onClose }: Props) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState<CopyKey>(null);

  async function copy(value: string, key: Exclude<CopyKey, null>) {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Only allow close after the author has explicitly acknowledged —
        // closing prematurely loses the password forever (no reset path).
        if (!next && acknowledged) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg"
        onEscapeKeyDown={(e) => {
          if (!acknowledged) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!acknowledged) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edu test vytvorený</DialogTitle>
          <DialogDescription>
            Skopíruj si <strong className="text-foreground">obidva linky aj heslo PRED</strong> tým,
            ako zatvoríš toto okno. Heslo nikam neukladáme — ak ho stratíš, výsledky späť nezískaš.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field
            label="Link pre respondentov"
            value={publicUrl}
            hint="Pošli tento link študentom / kolegom."
            copied={copied === "public"}
            onCopy={() => copy(publicUrl, "public")}
          />
          <Field
            label="Link na výsledky (pre teba)"
            value={resultsUrl}
            hint="Po zadaní hesla uvidíš všetky odpovede."
            copied={copied === "results"}
            onCopy={() => copy(resultsUrl, "results")}
          />
          <Field
            label="Heslo"
            value={password}
            hint="Bez hesla sa k výsledkom nedostaneš. Reset cez e-mail neexistuje."
            mono
            copied={copied === "password"}
            onCopy={() => copy(password, "password")}
          />
        </div>

        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer accent-primary"
            />
            <span className="leading-relaxed">
              Linky aj heslo som si <strong>zaznamenal/a</strong> (password manager, poznámka).
              Beriem na vedomie, že po zatvorení tohto okna ich už nikde nezobrazíme a heslo sa nedá
              obnoviť.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button onClick={onClose} disabled={!acknowledged}>
            Hotovo, zatvoriť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}

function Field({ label, value, hint, mono, copied, onCopy }: FieldProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground hover:border-primary"
          aria-label={`Skopírovať ${label}`}
        >
          {copied ? (
            <>
              <Check className="size-3" aria-hidden /> Skopírované
            </>
          ) : (
            <>
              <Copy className="size-3" aria-hidden /> Kopírovať
            </>
          )}
        </button>
      </div>
      <p className={`mt-2 break-all ${mono ? "font-mono text-sm" : "text-sm"} text-foreground`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

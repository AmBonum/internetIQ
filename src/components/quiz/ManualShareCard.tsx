import { useState } from "react";

interface Props {
  /** Bare share URL without UTM — IG/TikTok captions aren't clickable, so
   * UTM tags would be dead ballast and only make the line longer. */
  url: string;
  /** Canonical share caption (same as Web Share API / share grid). */
  text: string;
  onDownloadStory: () => Promise<void>;
  downloading: boolean;
}

/**
 * Instagram and TikTok have no public web share intent — they're closed
 * ecosystems. Users must save an image and paste a caption into the app
 * manually. This card pairs the existing IG Story PNG download with a
 * one-click caption-to-clipboard action and 4-step instructions.
 *
 * Deliberately does NOT attempt deep-links (e.g. `instagram://`): they fail
 * silently when the app isn't installed, which is worse UX than the
 * explicit two-step flow.
 */
export function ManualShareCard({ url, text, onDownloadStory, downloading }: Props) {
  const [copied, setCopied] = useState(false);
  const caption = `${text} ${url}`;

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Insecure-context clipboard write can throw; swallow silently —
      // there's no good fallback here and an alert would be intrusive.
    }
  }

  return (
    <div className="mt-6 animate-fade-in-up rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="text-base font-bold">📲 Instagram & TikTok</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tieto siete nemajú web share — stiahni obrázok a vlož caption manuálne.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDownloadStory}
          disabled={downloading}
          aria-label="Stiahnuť IG Story obrázok"
          className="rounded-xl bg-accent-gradient px-5 py-3 text-base font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {downloading ? "Generujem…" : "📥 Stiahni IG Story PNG"}
        </button>
        <button
          type="button"
          onClick={handleCopyCaption}
          aria-label="Skopírovať caption do schránky"
          className="rounded-xl border-2 border-border bg-card px-5 py-3 text-base font-semibold transition-colors hover:border-primary/60"
        >
          {copied ? "✅ Skopírované" : "📋 Skopíruj caption"}
        </button>
      </div>

      <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-foreground/80">
        <li>Stiahni obrázok kliknutím vyššie.</li>
        <li>Skopíruj caption text.</li>
        <li>Otvor Instagram Story alebo TikTok appku.</li>
        <li>Vyber stiahnutý obrázok zo Photos a vlož caption.</li>
      </ol>
    </div>
  );
}

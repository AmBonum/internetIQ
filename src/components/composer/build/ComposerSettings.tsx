import type { ChangeEvent } from "react";
import { COMPOSER_LIMITS } from "@/lib/quiz/composer";

interface Props {
  passingThreshold: number;
  onThresholdChange: (next: number) => void;
  maxQuestions: number;
  onMaxQuestionsChange: (next: number) => void;
  selectedCount: number;
  honeypotRatio: number;
  creatorLabel: string;
  onCreatorLabelChange: (next: string) => void;
}

export function ComposerSettings({
  passingThreshold,
  onThresholdChange,
  maxQuestions,
  onMaxQuestionsChange,
  selectedCount,
  honeypotRatio,
  creatorLabel,
  onCreatorLabelChange,
}: Props) {
  const thresholdTone =
    passingThreshold < 60
      ? "text-red-500"
      : passingThreshold < 70
        ? "text-amber-500"
        : "text-primary";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="threshold-slider" className="text-sm font-semibold text-foreground">
            Prah úspešnosti
          </label>
          <span className={`text-2xl font-black ${thresholdTone}`}>{passingThreshold}%</span>
        </div>
        <input
          id="threshold-slider"
          type="range"
          min={COMPOSER_LIMITS.minThreshold}
          max={COMPOSER_LIMITS.maxThreshold}
          step={5}
          value={passingThreshold}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onThresholdChange(Number(e.target.value))}
          aria-valuemin={COMPOSER_LIMITS.minThreshold}
          aria-valuemax={COMPOSER_LIMITS.maxThreshold}
          aria-valuenow={passingThreshold}
          className="mt-2 w-full accent-primary"
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Pri skóre <strong className="text-foreground">{passingThreshold}/100</strong> a vyššom
          dostane člen tímu badge „Vyhovuje" pri výsledku.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="max-slider" className="text-sm font-semibold text-foreground">
            Maximálne otázok
          </label>
          <span className="text-2xl font-black text-foreground">{maxQuestions}</span>
        </div>
        <input
          id="max-slider"
          type="range"
          min={COMPOSER_LIMITS.minQuestions}
          max={COMPOSER_LIMITS.maxQuestions}
          step={1}
          value={maxQuestions}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onMaxQuestionsChange(Number(e.target.value))
          }
          aria-valuemin={COMPOSER_LIMITS.minQuestions}
          aria-valuemax={COMPOSER_LIMITS.maxQuestions}
          aria-valuenow={maxQuestions}
          className="mt-2 w-full accent-primary"
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Aktuálne vybraných: <strong className="text-foreground">{selectedCount}</strong>. Ak
          posunieš pod tento počet, otázky vyžiadajú odobrať.
        </p>
      </div>

      <div>
        <label htmlFor="creator-label" className="text-sm font-semibold text-foreground">
          Pomenovanie zostavy{" "}
          <span className="text-xs font-normal text-muted-foreground">(voliteľné)</span>
        </label>
        <input
          id="creator-label"
          type="text"
          value={creatorLabel}
          onChange={(e) =>
            onCreatorLabelChange(e.target.value.slice(0, COMPOSER_LIMITS.labelMaxLen))
          }
          maxLength={COMPOSER_LIMITS.labelMaxLen}
          placeholder="napr. E-shop Q1 2026 onboarding"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {COMPOSER_LIMITS.labelMaxLen - creatorLabel.length} znakov zostáva
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pomer „vyzerá podozrivo, ale OK" otázok
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          <strong className="text-foreground">{Math.round(honeypotRatio * 100)} %</strong> z výberu
          sú legit prípady. Vyšší pomer učí dôveru, nižší ostražitosť.
        </p>
      </div>
    </div>
  );
}

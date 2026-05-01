import type { TestPack } from "@/content/test-packs";

interface Props {
  packs: TestPack[];
  selectedSlugs: ReadonlySet<string>;
  onToggle: (slug: string) => void;
}

export function PackPreloadChips({ packs, selectedSlugs, onToggle }: Props) {
  if (packs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Žiadne predefinované sady momentálne nie sú k dispozícii.
      </p>
    );
  }
  return (
    <ul className="flex flex-wrap gap-2" role="group" aria-label="Predefinované sady na pre-load">
      {packs.map((p) => {
        const active = selectedSlugs.has(p.slug);
        return (
          <li key={p.slug}>
            <button
              type="button"
              onClick={() => onToggle(p.slug)}
              aria-pressed={active}
              title={`Pridáva ${p.questionIds.length} otázok pre ${p.title}`}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span aria-hidden="true">{p.industryEmoji}</span>
              <span>{p.title}</span>
              <span className="text-xs font-normal text-muted-foreground">
                +{p.questionIds.length}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

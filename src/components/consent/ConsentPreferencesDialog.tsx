import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ALL_ACCEPTED,
  ALL_REJECTED,
  type ConsentCategories,
  type ConsentCategory,
  DEFAULT_CATEGORIES,
} from "@/lib/consent";
import { useConsent } from "@/hooks/useConsent";

interface CategoryDescriptor {
  id: ConsentCategory;
  title: string;
  description: string;
  /** locked = always on, cannot be turned off (necessary). */
  locked?: boolean;
}

const CATEGORIES: CategoryDescriptor[] = [
  {
    id: "necessary",
    title: "Nevyhnutné",
    description:
      "Bez týchto sa test nedá ukončiť ani uložiť výsledok. Patria sem anonymná relácia, anti-cheat ochrana a uloženie tvojho súhlasu. Právny základ: oprávnený záujem (čl. 6 ods. 1 písm. f GDPR).",
    locked: true,
  },
  {
    id: "preferences",
    title: "Predvoľby",
    description:
      "Zapamätanie nastavenia jazyka, témy alebo obľúbených odpovedí pre lepší zážitok pri ďalšej návšteve.",
  },
  {
    id: "analytics",
    title: "Analytika",
    description:
      "Anonymizovaná analytika (návštevnosť, miery dokončenia, A/B testy) — pomáha nám test vylepšovať. Nezdieľame nič identifikujúce.",
  },
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Personalizované odporúčania, retargeting v reklamných sieťach a meranie efektivity kampaní. Aktuálne nepoužívame, ponecháme tu pre prípad budúceho rozšírenia.",
  },
];

/**
 * Granular preferences dialog. Opened from the banner ("Nastavenia") or
 * from any "Nastavenia cookies" link in the page footer.
 *
 * State machine: while the dialog is open we hold a *draft* of the
 * categories so the user can flip switches without persisting until
 * they click "Uložiť". This avoids accidental partial-consent records.
 */
export function ConsentPreferencesDialog() {
  const { record, preferencesOpen, closePreferences, saveCategories } = useConsent();

  const [draft, setDraft] = useState<ConsentCategories>(record?.categories ?? DEFAULT_CATEGORIES);

  // Reset draft to the persisted state every time the dialog opens.
  useEffect(() => {
    if (preferencesOpen) {
      setDraft(record?.categories ?? DEFAULT_CATEGORIES);
    }
  }, [preferencesOpen, record]);

  const toggle = (id: ConsentCategory, value: boolean) => {
    if (id === "necessary") return; // hard-locked
    setDraft((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Dialog
      open={preferencesOpen}
      onOpenChange={(open) => {
        if (!open) closePreferences();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nastavenia cookies</DialogTitle>
          <DialogDescription>
            Vyber, ktoré kategórie úložiska a spracúvania povoľuješ. Tvoj výber môžeš kedykoľvek
            zmeniť cez odkaz „Nastavenia cookies" v päte stránky. Detaily sú v{" "}
            <DialogClose asChild>
              <Link to="/cookies" className="underline underline-offset-2 hover:text-foreground">
                zásadách cookies
              </Link>
            </DialogClose>
            {" a "}
            <DialogClose asChild>
              <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
                zásadách ochrany súkromia
              </Link>
            </DialogClose>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-4">
          {CATEGORIES.map((cat, idx) => (
            <div key={cat.id}>
              {idx > 0 ? <Separator className="mb-4" /> : null}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label
                    htmlFor={`consent-${cat.id}`}
                    className="text-sm font-semibold text-foreground"
                  >
                    {cat.title}
                    {cat.locked ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (vždy aktívne)
                      </span>
                    ) : null}
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
                <Switch
                  id={`consent-${cat.id}`}
                  checked={draft[cat.id]}
                  disabled={cat.locked}
                  onCheckedChange={(checked) => toggle(cat.id, checked)}
                  aria-label={cat.title}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => saveCategories(ALL_REJECTED)}>
            Odmietnuť všetko
          </Button>
          <Button variant="outline" onClick={() => saveCategories(ALL_ACCEPTED)}>
            Prijať všetko
          </Button>
          <Button onClick={() => saveCategories(draft)}>Uložiť výber</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

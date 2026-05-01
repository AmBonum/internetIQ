import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Footer } from "@/components/layout/Footer";
import { CONTACT_EMAIL, SITE_ORIGIN } from "@/config/site";
import { ROUTES } from "@/config/routes";

const ONEOFF_AMOUNTS = [5, 10, 25, 50, 100] as const;
const MONTHLY_TIERS = [5, 10, 25] as const;
const MIN_ONEOFF = 5;
const MAX_ONEOFF = 500;
const FOOTER_THRESHOLD_ONEOFF = 50;
const FOOTER_THRESHOLD_MONTHLY = 25;
const DISPLAY_MESSAGE_MAX = 80;

interface PodporaSearch {
  cancelled?: 1;
}

export const Route = createFileRoute("/podpora")({
  validateSearch: (search: Record<string, unknown>): PodporaSearch => ({
    cancelled: search.cancelled === "1" || search.cancelled === 1 ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Podpora projektu — subenai" },
      {
        name: "description",
        content:
          "Podpor bezplatný vzdelávací projekt o digitálnej bezpečnosti — jednorazovo alebo mesačne. Faktúra na vyžiadanie.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Podpora projektu — subenai" },
      {
        property: "og:description",
        content:
          "Podpor bezplatný vzdelávací projekt o digitálnej bezpečnosti — jednorazovo alebo mesačne.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_ORIGIN}/podpora` },
      { property: "og:locale", content: "sk_SK" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}/podpora` }],
  }),
  component: PodporaPage,
});

type Mode = "oneoff" | "monthly";
type CustomState = "preset" | "custom";

export function PodporaPage() {
  const search = useSearch({ from: "/podpora" });
  return <DonateForm cancelled={search.cancelled === 1} />;
}

interface DonateFormProps {
  cancelled?: boolean;
}

export function DonateForm({ cancelled = false }: DonateFormProps) {
  const [mode, setMode] = useState<Mode>("oneoff");
  const [presetAmount, setPresetAmount] = useState<number | null>(null);
  const [customState, setCustomState] = useState<CustomState>("preset");
  const [customAmountText, setCustomAmountText] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [showInList, setShowInList] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayLink, setDisplayLink] = useState("");
  const [displayMessage, setDisplayMessage] = useState("");
  const [showInFooter, setShowInFooter] = useState(false);
  const [consentImmediate, setConsentImmediate] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountEur = useMemo<number | null>(() => {
    if (mode === "monthly") return presetAmount;
    if (customState === "custom") {
      const parsed = Number(customAmountText.replace(",", "."));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    return presetAmount;
  }, [mode, presetAmount, customState, customAmountText]);

  const qualifiesForFooter = useMemo(() => {
    if (amountEur == null) return false;
    return mode === "oneoff"
      ? amountEur >= FOOTER_THRESHOLD_ONEOFF
      : amountEur >= FOOTER_THRESHOLD_MONTHLY;
  }, [amountEur, mode]);

  const amountValid = useMemo(() => {
    if (amountEur == null) return false;
    if (mode === "oneoff") return amountEur >= MIN_ONEOFF && amountEur <= MAX_ONEOFF;
    return MONTHLY_TIERS.includes(amountEur as (typeof MONTHLY_TIERS)[number]);
  }, [amountEur, mode]);

  const displayValid = !showInList || displayName.trim().length > 0;
  const linkValid = !showInList || !displayLink.trim() || displayLink.trim().startsWith("https://");
  const messageValid = displayMessage.length <= DISPLAY_MESSAGE_MAX;
  const consentsValid = consentImmediate && consentData;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = name.trim().length > 0;

  const canSubmit =
    amountValid &&
    emailValid &&
    nameValid &&
    displayValid &&
    linkValid &&
    messageValid &&
    consentsValid &&
    !submitting;

  function handleModeChange(next: Mode) {
    setMode(next);
    setPresetAmount(null);
    setCustomState("preset");
    setCustomAmountText("");
  }

  function handlePresetClick(value: number) {
    setPresetAmount(value);
    setCustomState("preset");
  }

  function handleCustomClick() {
    setCustomState("custom");
    setPresetAmount(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || amountEur == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          amount_eur: amountEur,
          email: email.trim(),
          name: name.trim(),
          tax_id: taxId.trim() || undefined,
          show_in_list: showInList,
          display_name: showInList ? displayName.trim() : undefined,
          display_link: showInList ? displayLink.trim() : undefined,
          display_message: showInList ? displayMessage.trim() : undefined,
          show_in_footer: showInFooter && qualifiesForFooter,
          consent_immediate_start: consentImmediate,
          consent_data_processing: consentData,
        }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "checkout_failed");
        setSubmitting(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("network_error");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-8">
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Podpora projektu
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Akúkoľvek čiastku použijeme na hosting, tvorbu obsahu a údržbu. Žiadne reklamy, žiadne
            platené výhody. Detail v{" "}
            <Link
              to={ROUTES.oProjecte}
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              O projekte
            </Link>
            .
          </p>
        </header>

        {cancelled ? (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground"
          >
            Platbu si zrušil. Žiadne údaje neboli uložené. Ak si to len rozmyslel, môžeš formulár
            vyplniť znova.
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
          aria-labelledby="podpora-h1"
        >
          <h2 id="podpora-h1" className="sr-only">
            Formulár podpory
          </h2>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Frekvencia</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Frekvencia">
              {(["oneoff", "monthly"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => handleModeChange(m)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    mode === m
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "oneoff" ? "Jednorazovo" : "Mesačne"}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              Suma {mode === "monthly" ? "(€/mesiac)" : "(€)"}
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Suma">
              {(mode === "oneoff" ? ONEOFF_AMOUNTS : MONTHLY_TIERS).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={presetAmount === value && customState === "preset"}
                  onClick={() => handlePresetClick(value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    presetAmount === value && customState === "preset"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {value} €
                </button>
              ))}
              {mode === "oneoff" ? (
                <button
                  type="button"
                  role="radio"
                  aria-checked={customState === "custom"}
                  onClick={handleCustomClick}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    customState === "custom"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Iná suma
                </button>
              ) : null}
            </div>
            {mode === "oneoff" && customState === "custom" ? (
              <div className="pt-2">
                <label htmlFor="custom-amount" className="text-xs text-muted-foreground">
                  Vlastná suma (5–500 €)
                </label>
                <input
                  id="custom-amount"
                  type="number"
                  inputMode="decimal"
                  min={MIN_ONEOFF}
                  max={MAX_ONEOFF}
                  step="0.01"
                  value={customAmountText}
                  onChange={(e) => setCustomAmountText(e.target.value)}
                  placeholder="napr. 35"
                  className="mt-1 w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  aria-invalid={!amountValid && customAmountText.length > 0}
                />
              </div>
            ) : null}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Údaje pre faktúru</legend>
            <div className="space-y-3">
              <Field
                id="email"
                label="E-mail"
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
                required
                hint="Pošleme sem faktúru a potvrdenie."
              />
              <Field
                id="name"
                label="Meno alebo firma"
                value={name}
                onChange={setName}
                autoComplete="name"
                required
                hint="Povinné pre faktúru per § 74 zákona č. 222/2004 Z. z."
              />
              <Field
                id="tax-id"
                label="DIČ (voliteľné)"
                value={taxId}
                onChange={setTaxId}
                hint="Vyplň iba ak si platca DPH a chceš odpočet."
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Verejné poďakovanie</legend>
            <CheckboxRow
              id="show-in-list"
              checked={showInList}
              onChange={setShowInList}
              label="Chcem byť na zozname sponzorov (/sponzori)"
            />
            {showInList ? (
              <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-4">
                <Field
                  id="display-name"
                  label="Zobrazované meno"
                  value={displayName}
                  onChange={setDisplayName}
                  required
                />
                <Field
                  id="display-link"
                  label="Odkaz (https://, voliteľné)"
                  value={displayLink}
                  onChange={setDisplayLink}
                  type="url"
                  hint={
                    !linkValid && displayLink.trim().length > 0
                      ? "Odkaz musí začínať https://"
                      : undefined
                  }
                />
                <div>
                  <label htmlFor="display-message" className="text-sm font-medium text-foreground">
                    Krátka správa (voliteľné)
                  </label>
                  <textarea
                    id="display-message"
                    value={displayMessage}
                    onChange={(e) =>
                      setDisplayMessage(e.target.value.slice(0, DISPLAY_MESSAGE_MAX))
                    }
                    maxLength={DISPLAY_MESSAGE_MAX}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {DISPLAY_MESSAGE_MAX - displayMessage.length} znakov zostáva
                  </p>
                </div>
                <CheckboxRow
                  id="show-in-footer"
                  checked={showInFooter}
                  onChange={setShowInFooter}
                  disabled={!qualifiesForFooter}
                  label={
                    qualifiesForFooter
                      ? "Zobraziť ma aj v päte stránky"
                      : `Zobraziť ma v päte (potrebné: jednorazovo ≥ ${FOOTER_THRESHOLD_ONEOFF} € alebo mesačne ≥ ${FOOTER_THRESHOLD_MONTHLY} €)`
                  }
                />
              </div>
            ) : null}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Súhlasy</legend>
            <CheckboxRow
              id="consent-immediate"
              checked={consentImmediate}
              onChange={setConsentImmediate}
              required
              label={
                <span>
                  Súhlasím so začatím poskytovania okamžite a beriem na vedomie stratu práva na
                  odstúpenie (§ 7 ods. 6 zákona č. 102/2014 Z. z.).
                </span>
              }
            />
            <CheckboxRow
              id="consent-data"
              checked={consentData}
              onChange={setConsentData}
              required
              label={
                <span>
                  Beriem na vedomie spracovanie mojich osobných údajov per{" "}
                  <Link to={ROUTES.privacy} className="underline underline-offset-2">
                    Zásady ochrany súkromia
                  </Link>
                  .
                </span>
              }
            />
          </fieldset>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-foreground"
            >
              Niečo sa pokazilo: <code>{error}</code>. Skús to prosím znova alebo nás kontaktuj na{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                {CONTACT_EMAIL}
              </a>
              .
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-gradient px-6 py-4 text-base font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting
                ? "Presmerúvam na Stripe…"
                : amountEur != null
                  ? `Pokračovať na platbu — ${amountEur} €${mode === "monthly" ? "/mes" : ""}`
                  : "Pokračovať na platbu"}
              <span aria-hidden="true">→</span>
            </button>
            <p className="text-xs text-muted-foreground">
              Platbu spracúva <strong>Stripe Payments Europe, Ltd.</strong> (Írsko). Kartové údaje
              nikdy neukladáme. Faktúru ti pošleme e-mailom (PDF). Mesačný odber môžeš{" "}
              <strong>kedykoľvek zrušiť jediným klikom</strong> cez Stripe Customer Portal.
            </p>
          </div>
        </form>

        <Footer />
      </main>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "email" | "url";
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
  hint,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface CheckboxRowProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
}

function CheckboxRow({ id, checked, onChange, label, disabled, required }: CheckboxRowProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 text-sm leading-relaxed ${
        disabled ? "text-muted-foreground/60" : "text-foreground"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required={required}
        className="mt-1 h-4 w-4 shrink-0 rounded border-border bg-background"
      />
      <span>{label}</span>
    </label>
  );
}

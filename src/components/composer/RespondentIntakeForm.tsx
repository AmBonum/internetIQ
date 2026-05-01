import { useId, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

const NAME_MIN_LEN = 2;
const NAME_MAX_LEN = 80;
const EMAIL_MAX_LEN = 254;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface RespondentIntakeOk {
  token: string;
  name: string;
  email: string;
}

interface Props {
  setId: string;
  authorLabel: string | null;
  onReady: (result: RespondentIntakeOk) => void;
}

type SubmitState = "idle" | "submitting" | "error";

export function RespondentIntakeForm({ setId, authorLabel, onReady }: Props) {
  const formId = useId();
  const nameId = useId();
  const emailId = useId();
  const consentId = useId();
  const errorId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot — invisible to humans, often filled by naive form bots.
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const nameValid = trimmedName.length >= NAME_MIN_LEN && trimmedName.length <= NAME_MAX_LEN;
  const emailValid =
    trimmedEmail.length > 0 &&
    trimmedEmail.length <= EMAIL_MAX_LEN &&
    EMAIL_REGEX.test(trimmedEmail);
  const canSubmit = nameValid && emailValid && consent && state !== "submitting";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setState("submitting");
    setErrorCode(null);
    try {
      const response = await fetch("/api/begin-edu-attempt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          set_id: setId,
          name: trimmedName,
          email: trimmedEmail.toLowerCase(),
          consent: true,
          hp_url: honeypot,
        }),
      });
      const payload = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !payload.token) {
        setErrorCode(payload.error ?? "submit_failed");
        setState("error");
        return;
      }
      onReady({ token: payload.token, name: trimmedName, email: trimmedEmail.toLowerCase() });
    } catch {
      setErrorCode("network_error");
      setState("error");
    }
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      aria-labelledby={`${formId}-h`}
      className="space-y-5 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6"
    >
      <div>
        <h2 id={`${formId}-h`} className="text-lg font-semibold text-foreground">
          Pred testom: kto si?
        </h2>
        <div className="mt-2 space-y-1 text-sm leading-relaxed text-muted-foreground">
          <p>
            Test pripravil:{" "}
            <strong className="text-foreground">{authorLabel || "autor testu"}</strong>.
          </p>
          <p>
            Tvoje meno, e-mail, skóre a odpovede uvidí{" "}
            <strong className="text-foreground">tvoj autor</strong> cez heslom chránený dashboard.
            Údaje uchovávame <strong className="text-foreground">12 mesiacov</strong>, potom ich
            anonymizujeme. Detail v{" "}
            <Link to={ROUTES.privacy} className="underline underline-offset-2">
              zásadách spracovania
            </Link>
            .
          </p>
        </div>
      </div>

      <div>
        <label htmlFor={nameId} className="block text-sm font-semibold text-foreground">
          Meno a priezvisko
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX_LEN))}
          autoComplete="name"
          aria-required="true"
          minLength={NAME_MIN_LEN}
          maxLength={NAME_MAX_LEN}
          required
          placeholder="napr. Jana Nováková"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div>
        <label htmlFor={emailId} className="block text-sm font-semibold text-foreground">
          E-mail
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, EMAIL_MAX_LEN))}
          autoComplete="email"
          aria-required="true"
          maxLength={EMAIL_MAX_LEN}
          required
          placeholder="napr. jana@skola.sk"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <label htmlFor={consentId} className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-required="true"
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
        />
        <span className="leading-relaxed text-foreground">
          Súhlasím so spracovaním môjho mena a e-mailu autorom testu na účely vyhodnotenia. Beriem
          na vedomie 12-mesačnú dobu uchovávania a možnosť kedykoľvek autora požiadať o vymazanie
          mojich údajov (čl. 6 ods. 1 písm. a GDPR).
        </span>
      </label>

      {/* Honeypot — visually hidden + aria-hidden so screen readers skip it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor={`${formId}-hp`}>Webová adresa</label>
        <input
          id={`${formId}-hp`}
          type="text"
          name="hp_url"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {state === "error" && errorCode ? (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-foreground"
        >
          {errorMessage(errorCode)}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!canSubmit}
        size="lg"
        aria-describedby={state === "error" ? errorId : undefined}
      >
        {state === "submitting" ? "Overujem…" : "Pokračovať na test →"}
      </Button>
    </form>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "rate_limited":
      return "Príliš veľa pokusov v krátkom čase. Skús znova o pár minút.";
    case "already_attempted":
      return "Tento test si už pod týmto e-mailom absolvoval/a. Pre opakovanie kontaktuj autora.";
    case "invalid_email":
      return "E-mailová adresa nemá platný formát.";
    case "name_length":
      return "Meno musí mať aspoň 2 a najviac 80 znakov.";
    case "set_not_found":
      return "Tento test už neexistuje. Pýtaj sa autora na nový odkaz.";
    case "not_edu_set":
      return "Tento test nezbiera odpovede s menom — preto sem prístup nepotrebuješ.";
    case "spam_detected":
    case "invalid_shape":
      return "Formulár sa nepodarilo odoslať. Skús prosím znova.";
    case "network_error":
      return "Pripojenie sa nepodarilo. Skontroluj sieť a skús znova.";
    default:
      return "Nastala chyba. Skús prosím znova alebo kontaktuj autora.";
  }
}

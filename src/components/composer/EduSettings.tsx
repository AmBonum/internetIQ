import { useId, useState, type ChangeEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

export const EDU_PASSWORD_MIN_LEN = 8;
export const EDU_PASSWORD_MAX_LEN = 128;

interface Props {
  collectsResponses: boolean;
  onToggle: (next: boolean) => void;
  authorPassword: string;
  onPasswordChange: (next: string) => void;
}

export function EduSettings({
  collectsResponses,
  onToggle,
  authorPassword,
  onPasswordChange,
}: Props) {
  const toggleId = useId();
  const passwordId = useId();
  const helperId = useId();
  const [revealed, setRevealed] = useState(false);

  const tooShort = authorPassword.length > 0 && authorPassword.length < EDU_PASSWORD_MIN_LEN;

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={toggleId} className="flex-1 cursor-pointer">
          <span className="text-sm font-semibold text-foreground">
            Zbierať odpovede s menom a e-mailom
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            Pre učiteľov, lektorov, HR. Respondent zadá meno + e-mail pred testom (s GDPR súhlasom).
            Výsledky uvidíš cez heslom chránený dashboard. Predvolene vypnuté.
          </span>
        </label>
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={collectsResponses}
          onClick={() => onToggle(!collectsResponses)}
          className={`relative mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            collectsResponses ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition-transform ${
              collectsResponses ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {collectsResponses ? (
        <div className="space-y-2">
          <label htmlFor={passwordId} className="block text-sm font-semibold text-foreground">
            Heslo na pozeranie výsledkov
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={revealed ? "text" : "password"}
              value={authorPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onPasswordChange(e.target.value.slice(0, EDU_PASSWORD_MAX_LEN))
              }
              autoComplete="new-password"
              spellCheck={false}
              minLength={EDU_PASSWORD_MIN_LEN}
              maxLength={EDU_PASSWORD_MAX_LEN}
              required
              aria-describedby={helperId}
              aria-invalid={tooShort}
              placeholder={`Minimum ${EDU_PASSWORD_MIN_LEN} znakov`}
              className={`w-full rounded-xl border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground ${
                tooShort ? "border-destructive" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Skryť heslo" : "Zobraziť heslo"}
              aria-pressed={revealed}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p id={helperId} className="text-xs leading-relaxed text-muted-foreground">
            Toto heslo budeš potrebovať na otvorenie výsledkov. Ak ho stratíš, výsledky nezískaš
            späť — <strong className="text-foreground">žiadny reset cez e-mail.</strong> Ulož si ho
            do password managera <em>predtým</em>, ako klikneš „Zdieľať s tímom".
          </p>
        </div>
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SurveyQuestion } from "./SurveyQuestion";
import {
  HAS_BEEN_SCAMMED_LABELS,
  HAS_BEEN_SCAMMED_VALUES,
  INTEREST_LABELS,
  INTEREST_VALUES,
  REFERRAL_SOURCE_LABELS,
  REFERRAL_SOURCE_VALUES,
  TOP_FEAR_LABELS,
  TOP_FEAR_VALUES,
  type HasBeenScammed,
  type Interest,
  type ReferralSource,
  type SurveyOption,
  type TopFear,
} from "@/lib/quiz/survey-options";

interface Props {
  shareId: string;
  onDone?: () => void;
}

const AGE_OPTIONS: SurveyOption[] = (
  ["<18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+"] as const
).map((v) => ({ id: v, label: v }));

const GENDER_OPTIONS: SurveyOption[] = (["Muž", "Žena", "Iné", "Neuvádzam"] as const).map((v) => ({
  id: v,
  label: v,
}));

// E2.3 — growth survey enums hydrated to SurveyOption[] from the single
// source of truth in survey-options.ts (DB CHECK constrainty mirror tieto
// hodnoty, viď tests/db/attempts-schema.test.ts).
const TOP_FEAR_OPTIONS: SurveyOption[] = TOP_FEAR_VALUES.map((id) => ({
  id,
  label: TOP_FEAR_LABELS[id],
}));

const HAS_BEEN_SCAMMED_OPTIONS: SurveyOption[] = HAS_BEEN_SCAMMED_VALUES.map((id) => ({
  id,
  label: HAS_BEEN_SCAMMED_LABELS[id],
}));

const REFERRAL_SOURCE_OPTIONS: SurveyOption[] = REFERRAL_SOURCE_VALUES.map((id) => ({
  id,
  label: REFERRAL_SOURCE_LABELS[id],
}));

const INTEREST_OPTIONS: SurveyOption[] = INTEREST_VALUES.map((id) => ({
  id,
  label: INTEREST_LABELS[id],
}));

export function SurveyCard({ shareId, onDone }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [nickname, setNickname] = useState("");
  const [ageRange, setAgeRange] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Slovensko");
  const [caution, setCaution] = useState<number>(3);
  // E2.3 — growth survey state
  const [topFear, setTopFear] = useState<string>("");
  const [scammed, setScammed] = useState<string>("");
  const [referral, setReferral] = useState<string>("");
  const [wantsCourses, setWantsCourses] = useState<boolean | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload: {
        survey_completed: boolean;
        survey_extras_completed: boolean;
        nickname?: string;
        age_range?: string;
        gender?: string;
        city?: string;
        country?: string;
        self_caution: number;
        top_fear?: TopFear;
        has_been_scammed?: HasBeenScammed;
        referral_source?: ReferralSource;
        wants_courses?: boolean;
        interests?: Interest[];
      } = {
        survey_completed: true,
        survey_extras_completed: true,
        self_caution: caution,
      };
      if (nickname.trim()) payload.nickname = nickname.trim().slice(0, 40);
      if (ageRange) payload.age_range = ageRange;
      if (gender) payload.gender = gender;
      if (city.trim()) payload.city = city.trim().slice(0, 80);
      if (country.trim()) payload.country = country.trim().slice(0, 80);
      if (topFear) payload.top_fear = topFear as TopFear;
      if (scammed) payload.has_been_scammed = scammed as HasBeenScammed;
      if (referral) payload.referral_source = referral as ReferralSource;
      if (wantsCourses !== null) payload.wants_courses = wantsCourses;
      if (wantsCourses === true && interests.length > 0) {
        payload.interests = interests as Interest[];
      }

      const { error: e } = await supabase.from("attempts").update(payload).eq("share_id", shareId);
      if (e) {
        setError("Nepodarilo sa uložiť. Skús ešte raz.");
        return;
      }
      setSubmitted(true);
      onDone?.();
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-6 animate-fade-in-up rounded-2xl border border-success/40 bg-card p-6 shadow-card">
        <div className="text-2xl">🙏</div>
        <h3 className="mt-2 text-base font-bold">Vďaka!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pomáhaš nám robiť test presnejším pre Slovákov.
        </p>
        {wantsCourses === true && (
          <a
            href="/skolenia"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Pozri si naše bezplatné školenia →
          </a>
        )}
      </div>
    );
  }

  const surveyBodyId = "survey-body";

  return (
    <div className="mt-6 animate-fade-in-up rounded-2xl border border-border bg-card p-6 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-controls={surveyBodyId}
        className="-m-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-xl p-2 text-left transition-colors hover:bg-foreground/5"
      >
        <div className="flex-1">
          <h3 className="text-base font-bold">Pomôž nám zlepšiť test 🙏</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Anonymné, dobrovoľné. 30 sekúnd. Žiadne polia nie sú povinné.
          </p>
        </div>
        <span aria-hidden className="mt-1 text-xl text-muted-foreground">
          {open ? "▴" : "▾"}
        </span>
      </button>

      <div id={surveyBodyId} hidden={!open}>
        <div className="mt-5 space-y-4 text-sm">
          {/* Nickname */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">
              Prezývka (voliteľné)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder="napr. Janko"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Age */}
          <SurveyQuestion
            type="single"
            label="Vek"
            options={AGE_OPTIONS}
            value={ageRange}
            onChange={setAgeRange}
          />

          {/* Gender */}
          <SurveyQuestion
            type="single"
            label="Pohlavie"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={setGender}
          />

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Mesto</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
                placeholder="napr. Košice"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/70">Krajina</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                maxLength={80}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Self-rated caution */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/70">
              Ako opatrný si na internete?{" "}
              <span className="text-foreground/50">(1 = vôbec, 5 = paranoidne)</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCaution(n)}
                  className={`h-10 flex-1 rounded-lg border text-sm font-bold transition-colors ${
                    caution === n
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/*
            E2.3 — growth survey otázky (4 nové sekcie). Všetko optional, žiadne
            polia required. Hodnoty mapujú na DB CHECK constraints v
            attempts_top_fear_known / _has_been_scammed_known / _referral_source_known.
          */}
          <SurveyQuestion
            type="single"
            label="Čoho sa najviac obávaš na internete?"
            options={TOP_FEAR_OPTIONS}
            value={topFear}
            onChange={setTopFear}
          />

          <SurveyQuestion
            type="single"
            label="Už ťa niekto raz oklamal?"
            options={HAS_BEEN_SCAMMED_OPTIONS}
            value={scammed}
            onChange={setScammed}
          />

          <SurveyQuestion
            type="single"
            label="Odkiaľ vieš o tomto teste?"
            options={REFERRAL_SOURCE_OPTIONS}
            value={referral}
            onChange={setReferral}
          />

          <SurveyQuestion
            type="yesno"
            label="Mali by sme robiť školenia zadarmo?"
            value={wantsCourses}
            onChange={setWantsCourses}
          />

          {wantsCourses === true && (
            <SurveyQuestion
              type="multi"
              label="Aké témy by ťa najviac zaujali?"
              hint="Vyber všetky ktoré ti dávajú zmysel."
              options={INTEREST_OPTIONS}
              value={interests}
              onChange={setInterests}
            />
          )}
        </div>

        {error && <div className="mt-3 text-xs text-destructive">{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-5 w-full rounded-xl bg-accent-gradient px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {saving ? "Ukladám…" : "Odoslať odpoveď"}
        </button>
      </div>
    </div>
  );
}

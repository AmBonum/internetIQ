# DATA — Kde sú dáta a ako s nimi pracovať

MVP je **frontend-only**. Žiadna databáza, žiaden backend (zatiaľ). Všetky dáta sú **deterministicky seedované** v TypeScript moduloch a držané v in-memory reactive store.

---

## 1. Mock dáta — zdrojové súbory

### User app dáta (`/app/*`)
- **`src/lib/user-mock-data.ts`** — sessions, respondents, notifications, audiences, teams
- **`src/lib/platform/seed.ts`** — seed funkcia plniaca store pri boot-e
- **`src/lib/platform/store.ts`** — runtime store + React hooks (`useTests`, `useSessions`, atď.)
- **`src/lib/platform/types.ts`** — TypeScript typy entít (1:1 budúce DB tabuľky, snake_case)
- **`src/lib/platform/exports.ts`** — JSON/CSV export helpers

### Admin dáta (`/admin/*`)
- **`src/lib/admin-mock-data.ts`** — questions, answer-sets, answers, tests, trainings, categories, topics, reports, users, shareCard, quickTest, branches (`BRANCHES`), training topics (`TRAINING_TOPICS`)
- **`src/lib/admin/store.ts`** — reactive store cez `useSyncExternalStore` + `adminRepo` mutátory
- **`src/lib/admin/answer-sets-store.ts`** — wrapper nad `adminRepo` pre answer sets
- **`src/lib/admin/cms-store.ts`** + **`cms-hooks.ts`** — CMS pages, header, footer, navigation
- **`src/lib/admin/support-config.ts`** — support nastavenia
- **`src/lib/admin/export.ts`** — admin export utilities

---

## 2. Ako sa store používa v komponentách

### User app (`platform/store.ts`)
```ts
import { useTests, useSessions, useNotifications } from "@/lib/platform/store";

function MyComponent() {
  const tests = useTests();                     // všetky testy
  const sessions = useSessions({ testId });     // filter
  // mutácie:
  platformRepo.tests.create({...});
  platformRepo.tests.update(id, {...});
  platformRepo.tests.delete(id);
}
```

### Admin (`admin/store.ts`)
```ts
import { useAdminState, adminRepo } from "@/lib/admin/store";

function MyAdminPage() {
  const questions = useAdminState((s) => s.questions);
  const onCreate = () => adminRepo.questions.create({ ... });
  const onDelete = (id: string) => adminRepo.questions.delete(id);
}
```

`adminRepo` má pre každú entitu rovnaký tvar: `list / get / create / update / delete` (+ `duplicate` kde dáva zmysel).

---

## 3. Export dát na seedovanie DB

Mock dáta sa dajú vyexportovať ako JSON pre seed Supabase tabuliek:

```ts
// Node script (mimo browsera)
import { mockQuestions, mockAnswerSets, mockAnswers, mockTests } from "./src/lib/admin-mock-data";
import { writeFileSync } from "fs";

writeFileSync("seed/questions.json", JSON.stringify(mockQuestions, null, 2));
writeFileSync("seed/answer_sets.json", JSON.stringify(mockAnswerSets, null, 2));
writeFileSync("seed/answers.json", JSON.stringify(mockAnswers, null, 2));
writeFileSync("seed/tests.json", JSON.stringify(mockTests, null, 2));
```

Field names v mock dátach sú **už snake_case** (`created_at`, `owner_id`, `share_id`, …) — pripravené na priamy `INSERT INTO ... SELECT` z JSON-u alebo cez `supabase.from('questions').insert(data)`.

---

## 4. Konvencie

- **ID-čká**: stringové, prefixované (`q_`, `as_`, `t_`, `u_`, `r_`, `s_`). Pri migrácii zameniť za `uuid`.
- **Dátumy**: ISO 8601 stringy (`new Date().toISOString()`). DB stĺpec = `timestamptz`.
- **Enum hodnoty** (test status, role, gdpr_purpose, …) — viď `src/lib/platform/types.ts`. V DB ich spraviť ako Postgres `enum` alebo `text + check`.
- **PII**: `intake_fields[].pii: boolean`. Pri prístupe musí admin akcia zapísať audit s `pii_access: true`.
- **Anonymizácia**: `test.anonymize_after_days` — v reále pg_cron job vymaže/anonymizuje sessions po N dňoch.

---

## 5. Kde NIE sú dáta

- Žiadny `.env`, žiadne API keys (okrem `LOVABLE_API_KEY` injektovaného Lovable Cloud-om)
- Žiadne real-time (mock notifications sa pridávajú lokálne)
- Žiadny upload — `file_upload` question type je UI placeholder
- Žiadne emaily — pozvánky a notifikácie sú len in-app

Všetko vyššie sa rieši pri integrácii — viď **INTEGRATION.md**.

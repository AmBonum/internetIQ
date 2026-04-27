# US-120 – Autor konfiguruje emailové notifikácie

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-120                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Notifikácie                       |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **nakonfigurovať, ktoré udalosti mi odosielajú emailové notifikácie**
> aby som **bol informovaný o dôležitých aktivitách bez toho, aby som musel neustále kontrolovať dashboard**.

---

## Kontext

Notifikácie sú opt-in. Autor môže dostávať upozornenia napríklad pri každom novom
respondentovi, pri dosiahnutí míľnika (napr. 10 / 50 / 100 respondentov), pri
zistení podozrenia na podvod, alebo keď test exspiruje. Konfigurácia je viazaná
na konkrétny test, nie na globálny účet.

---

## Akceptačné kritériá

- [ ] **AC-1:** V admin dashboarde je sekcia „Notifikácie" per test s týmito přepínačmi:
  - Nový respondent dokončil test (default: vypnuté)
  - Míľnik respondentov (10 / 50 / 100 / vlastné číslo, default: vypnuté)
  - Podozrenie na podvod / anomália (default: zapnuté)
  - Test čoskoro expiruje (7 dní pred, default: zapnuté)
  - Test expiroval (default: zapnuté)
  - Denný súhrn aktivity (default: vypnuté)
- [ ] **AC-2:** Autor môže konfigurovať notifikačný email odlišný od prihlasovacieho emailu testu (pre teamové schránky).
- [ ] **AC-3:** Konfigurácia sa uloží do `test_notification_config(test_id, event_type, enabled, custom_email, milestone_n)`.
- [ ] **AC-4:** Zmeny konfigurácie sa uložia okamžite (auto-save s vizuálnou spätnou väzbou „Uložené").
- [ ] **AC-5:** Autor môže dočasne stlmiť všetky notifikácie pre test jedným przepínačom „Stlmiť všetky" (bez straty individuálnych nastavení).
- [ ] **AC-6:** Každý notifikačný email obsahuje unsubscribe link (jednorázový token), ktorý deaktivuje príslušný typ notifikácie bez nutnosti prihlasovania.
- [ ] **AC-7:** Konfigurácia je prístupná iba autorovi (za admin session US-100), nie respondentom ani externým osobám.
- [ ] **AC-8:** Pri vytvorení nového testu sa aplikujú defaultné nastavenia notifikácií automaticky (insert row do `test_notification_config` s defaultmi).

---

## Technické poznámky

```sql
CREATE TABLE test_notification_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  custom_email TEXT,
  milestone_n  INTEGER,
  muted_until  TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, event_type)
);
```

- Unsubscribe token: `notification_unsubscribe_tokens(token TEXT PRIMARY KEY, test_id UUID, event_type TEXT, used_at TIMESTAMPTZ)` – single use.

---

## Edge Cases

- Autor zmení notifikačný email: overenie nového emailu nie je vyžadované (interná adresa), ale zmena sa zaloguje.
- Stlmenie „Stlmiť všetky" + individuálne reaktivovanie jedného typu: muted_until = NULL len pre ten typ, ostatné ostávajú stlmené.
- Unsubscribe link sa použije dvakrát: druhé použitie vráti „Odkaz bol už použitý. Nastavenia si môžete zmeniť v dashboarde."

---

## Závislosti

- Závisí na: US-100 (admin auth)
- Blokuje: US-121 (odosielanie notifikácií – číta túto konfiguráciu)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: default values pri vytvorení testu, unsubscribe token single-use
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

# US-163 – Systém uchováva audit log zmien testu

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-163                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Systém + Autor (čitateľ)             |

---

## User Story

> Ako **autor testu**
> chcem **mať prístup k audit logu všetkých zmien testu a akcií v admin dashboarde**
> aby som **mohol rekonštruovať históriu úprav, debugovať problémy a splniť požiadavky na auditovateľnosť**.

---

## Kontext

Audit log zaznamenáva kto čo zmenil a kedy. Pre tímové inštalácie (US-003 –
inštitucionálny klient) je audit log kľúčový pri viacerých adminoch. Pre regulované
odvetvia (zdravotníctvo, finančníctvo) je auditovateľnosť compliance požiadavka.

---

## Akceptačné kritériá

- [ ] **AC-1:** Všetky nasledujúce akcie sú automaticky logované do `audit_log`:
  - Admin login / logout
  - Vytvorenie, publikovanie, archivovanie testu
  - Zmena hesla (admin alebo respondentské)
  - Zmena nastavení notifikácií
  - Export dát (typ + timestamp)
  - Manuálne priradenie respondenta do skupiny
  - Reset attempt / označenie flagu respondenta
  - DSR žiadosť (US-143) a jej spracovanie
- [ ] **AC-2:** Každý záznam audit logu obsahuje: `actor_type` (admin/system), `actor_id` (session hash, nie plain session ID), `action`, `resource_type`, `resource_id`, `before_snapshot JSONB`, `after_snapshot JSONB`, `ip_hash`, `created_at`.
- [ ] **AC-3:** Audit log je read-only: žiadna časť systému ho nemaže (okrem automatickej retentcie – AC-5). RLS policy: `INSERT` povolený len cez service role, `SELECT` len pre admin session daného testu, `UPDATE/DELETE` zakázané.
- [ ] **AC-4:** Autor môže zobraziť audit log pre svoj test v admin dashboarde (záložka „História zmien"): listovateľný zoznam, filter podľa akcie, dátumu; paginating 50/strana.
- [ ] **AC-5:** Automatická retencia: záznamy staršie ako 2 roky sú archivované (presunuté do cold storage / Supabase archívu), nie zmazané.
- [ ] **AC-6:** `before_snapshot` a `after_snapshot`: ukladajú sa len pre akcie, kde má zmena state (napr. zmena hesla neukldáva hash – uloží sa len `{changed: true}`).
- [ ] **AC-7:** Audit log entries sú imutable po vytvorení: trigger `BEFORE UPDATE OR DELETE ON audit_log EXECUTE PROCEDURE forbid_audit_mutation()`.
- [ ] **AC-8:** Audit log je dostupný aj po archivovaní testu (test `status = 'archived'`).

---

## Technické poznámky

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID REFERENCES tests(id),
  actor_type      TEXT NOT NULL,
  actor_id        TEXT NOT NULL,     -- session hash
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     TEXT,
  before_snapshot JSONB,
  after_snapshot  JSONB,
  ip_hash         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER forbid_audit_mutation
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE PROCEDURE raise_exception('audit_log is immutable');
```

---

## Edge Cases

- Systémová akcia (napr. cron job anonymizácia): `actor_type = 'system'`, `actor_id = 'cron:{job_name}'`.
- Admin maže omylom respondenta a potom chce zrušiť akciu: audit log ukáže čo sa stalo, ale reverzia je manuálny proces (nie undo button).

---

## Závislosti

- Závisí na: US-100 (admin session – zdroj actor_id), US-053 (heslo storage)
- Blokuje: US-003 (tímové adminy – zdieľajú audit log pre ten istý test)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: immutability trigger, RLS blokácia UPDATE/DELETE
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

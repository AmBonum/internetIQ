# US-131 – Autor exportuje surové dáta ako CSV

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-131                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Export                            |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **exportovať surové dáta respondentov ako CSV súbor**
> aby som **mohol vykonávať vlastnú analýzu v externých nástrojoch (Excel, R, Python)**.

---

## Kontext

CSV export je najžiadanejší formát pre analytikov a HR špecialistov. Exportujú sa
odpovede respondentov spolu s intake dátami (s ohľadom na GDPR – autor môže zvoliť
úroveň pseudonymizácie). CSV je flat formát – každý riadok = jeden attempt.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže spustiť CSV export z admin dashboardu (zoznam respondentov aj analytika).
- [ ] **AC-2:** Konfiguračný dialog pred exportom umožňuje:
  - Výber stĺpcov: attempt_id (vždy), intake polia (per-field checkbox), odpovede otázok (per-question checkbox), metadáta (skóre, čas, status, completed_at)
  - Filtrovanie: len dokončené / všetky
  - Datumový rozsah
- [ ] **AC-3:** CSV header riadok obsahuje human-readable stĺpcové názvy (nie databázové field_key hodnoty).
- [ ] **AC-4:** Hodnoty sú správne escaped (RFC 4180): polia s čiarkami sú v úvodzovkách, úvodzovky vnútri polia sú zdvojené.
- [ ] **AC-5:** Export veľkých dát (> 1000 respondentov) je streamovaný: server streamuje CSV po chunk-och, nie celý súbor naraz do pamäte.
- [ ] **AC-6:** Maximálna veľkosť exportu: 50 000 respondentov v jednom exporte. Pre väčšie sady autor dostane upozornenie a možnosť exportovať po datumových rozsahoch.
- [ ] **AC-7:** CSV obsahuje BOM (UTF-8 BOM `EF BB BF`) pre kompatibilitu s Excel (Windows).
- [ ] **AC-8:** Export je chránený rovnakým admin session tokenom (US-100). Priamy GET request bez session vráti 401.

---

## Technické poznámky

- Streaming: Response so `Content-Type: text/csv; charset=utf-8`, `Transfer-Encoding: chunked`. Na Cloudflare Workers: `ReadableStream` z DB cursor.
- BOM: prvé 3 bajty response sú `\xEF\xBB\xBF`.
- Konfigurácia exportu sa neperzistruje (ephemeral dialog state).
- Rate limit: zdieľaný s US-130 (`export_rate_limits`), 10 CSV exportov per test per 24h.

---

## Edge Cases

- Respondent má null hodnotu v povinnom poli (dirty data): CSV bunka bude prázdna (nie výnimka).
- Odpoveď obsahuje newline (textarea): obalená v úvodzovkách, `\n` zachovaný (RFC 4180 compliant).
- Export < 1 respondenta: prázdny CSV (len header) bez chyby.

---

## Závislosti

- Závisí na: US-040 (definícia polí), US-080 (attempt data), US-100 (admin auth)
- Blokuje: US-133 (JSON export – podobná logika výberu stĺpcov)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: RFC 4180 escaping, BOM prítomnosť, empty export
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

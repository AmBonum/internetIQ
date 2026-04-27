# US-130 – Autor exportuje výsledky ako PDF report

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-130                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Export                            |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **exportovať súhrnný PDF report testu s metrikami a respondentskými dátami**
> aby som **mohol zdieľať výsledky so zainteresovanými stranami bez prístupu do dashboardu**.

---

## Kontext

PDF report je „executive summary" pre stakeholderov – manažérov, HR oddelenia,
investorov. PDF neobsahuje plné PII (len pseudonymizované ID alebo meno/email
ak autor explicitne povolí inclusion). Report sa generuje server-side a sťahuje
sa ako binárny súbor.

---

## Akceptačné kritériá

- [ ] **AC-1:** PDF report obsahuje povinné sekcie:
  - Titulka: názov testu, dátum generovania, autor (pseudonym)
  - Súhrn: počet respondentov, completion rate, priemerný čas, priemerné skóre
  - Distribúcia odpovedí per otázka (grafy ako rastrizované PNG embedy)
  - Analytické metriky (z US-103, ak dostupné)
  - Príloha: zoznam respondentov (len attempt_id alebo voliteľne meno/email ak autor zaškrtol)
- [ ] **AC-2:** PDF sa generuje server-side (Edge Function) pomocou knižnice (napr. Puppeteer headless / pdf-lib / @react-pdf/renderer). Klient dostane redirect na signed URL (Supabase Storage, expiry 1h).
- [ ] **AC-3:** Generovanie PDF je asynchrónne: autor dostane oznámenie (toast + email) keď je PDF ready, nie spinner blokovanie UI.
- [ ] **AC-4:** Autor môže zvoliť, či príloha respondentov obsahuje PII (meno/email) alebo len attempt_id. Výber je uložený len na čas generovania – nie perzistentný.
- [ ] **AC-5:** PDF s PII je označený vodoznakom „DÔVERNÉ – {datum}" na každej strane.
- [ ] **AC-6:** Vygenerované PDF sa uloží v Supabase Storage max 48h, potom sa automaticky zmaže (lifecycle policy alebo cron job).
- [ ] **AC-7:** Generovanie PDF je rate-limited: max 5 generovaní per test za 24h (ochrana pred zneužitím compute).
- [ ] **AC-8:** PDF musí byť accessible: tagy, nadpisy, alt texty grafov (PDF/UA alebo PDF/A-1b štandard, best-effort).

---

## Technické poznámky

- Edge Function `generate-pdf` prijme `{test_id, include_pii, locale}`, overí admin session, vygeneruje PDF, uploadne do `exports/{test_id}/{timestamp}.pdf`.
- Signed URL: `supabase.storage.from('exports').createSignedUrl(path, 3600)`.
- Rate limit: `export_rate_limits(test_id, export_type, generated_at[])` – rolling 24h window.

---

## Edge Cases

- Test nemá žiadnych respondentov: PDF sa vygeneruje ale so sekciou „Žiadni respondenti" namiesto prázdnych grafov.
- Generovanie trvá > 30s (veľa respondentov): timeout Edge Function → fallback na job queue, notifikácia emailom.
- Signed URL expiruje pred stiahnutím: UI zobrazí „Odkaz vypršal, vygenerujte znova."

---

## Závislosti

- Závisí na: US-103 (analytika), US-101 (respondent dáta), US-100 (admin auth)
- Blokuje: US-131 (CSV export využíva rovnaký rate-limit mechanizmus)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: rate limit, PII inclusion / exclusion logika
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: vodoznak na PII reporte, 48h expiry, signed URL

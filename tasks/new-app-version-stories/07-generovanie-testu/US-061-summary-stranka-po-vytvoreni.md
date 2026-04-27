# US-061 – Autor vidí summary stránku po vytvorení testu

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-061                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Generovanie testu               |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **po úspešnom vytvorení testu vidieť prehľadnú summary stránku so všetkými kľúčovými informáciami**
> aby som **mal okamžitý prehľad o stave testu, mohol si skopírovať link a vedel, čo robiť ďalej**.

---

## Kontext

Summary stránka je finálna obrazovka wizard flow a zároveň trvalo dostupná admin
stránka testu. Obsahuje všetky dôležité informácie na jednom mieste. Je to aj
nástupná stránka po každom prihlásení do admin sekcie (US-001).

---

## Akceptačné kritériá

- [ ] **AC-1:** Summary stránka zobrazuje tieto informácie o teste:
  - **Identifikácia**: Názov testu / sady, ID (UUID), `share_id`, dátum vytvorenia
  - **Konfigurácia**: Typ testu (preddefinovaný / vlastný), počet testov v sade, celkový počet otázok, odhadovaná dĺžka
  - **Účel**: Zvolený účel testovania (US-012)
  - **Zber dát**: Počet zberových polí, zoznam polí s typmi (bez hodnôt)
  - **Bezpečnosť**: Stav respondentského hesla (nastavené / nenastavené), dátum poslednej zmeny
  - **Stav publikovania**: Badge so stavom (draft / published / archived)
  - **Štatistiky**: Počet respondentov, počet dokončených testov, dátum poslednej odpovede
- [ ] **AC-2:** Custom link je zobrazený prominentne s tlačidlom „Kopírovať odkaz" (clipboard API).
- [ ] **AC-3:** Summary obsahuje tlačidlá akcií: `Zdieľať link`, `Zobraziť respondentov`, `Exportovať výsledky`, `Upraviť test` (→ draft), `Archivovať test`.
- [ ] **AC-4:** Sekcia „Posledné odpovede" zobrazuje max 5 najnovších respondentov s timestamp a stavom dokončenia – bez PII (iba ID a stav).
- [ ] **AC-5:** Stránka sa automaticky obnovuje každých 60 sekúnd alebo pri manuálnom refreshi (real-time live update nie je P0 požiadavka).
- [ ] **AC-6:** Stránka je prístupná iba pre aktuálne prihláseného admina; bez platnej admin session je zobrazený login formulár.
- [ ] **AC-7:** Stránka má trvalú URL (`/admin/{test_id}/summary`) záložkovateľnú autorom.
- [ ] **AC-8:** Bezprostredne po vytvorení testu je zobrazená indikácia „Test bol úspešne vytvorený" (success toast alebo banner) – iba pri prvom vstupe.

---

## Technické poznámky

- URL: `/admin/{test_id}/summary` kde `test_id` je UUID.
- Štatistiky: agregátne query (count respondentov, count completed) – cachovať s TTL 60s.
- Posledné odpovede: limit 5, ORDER BY `created_at DESC`, SELECT len `(attempt_id, status, created_at)`.
- „Kopírovať odkaz": `navigator.clipboard.writeText(link)` s fallback pre staré prehliadače.
- Ochrana: middleware overí admin session cookie pred renderovaním na server-side.

---

## Edge Cases

- Test ešte nemá žiadnych respondentov: zobraziť prázdne stavy so popisom „Zatiaľ žiadni respondenti. Zdieľajte odkaz."
- Autor zobrazí summary hneď po vytvorení (0ms latency): štatistiky sú nulové ale nezobrazia sa chyby.
- `share_id` sa zmenil (autor regeneroval link): summary stránka zobrazí nový link s upozornením, že starý nefunguje.

---

## Závislosti

- Závisí na: US-060 (custom link), US-001 (admin auth)
- Blokuje: US-101 (zoznam respondentov), US-130–134 (export tlačidlá)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: access control (no session → redirect), clipboard copy
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

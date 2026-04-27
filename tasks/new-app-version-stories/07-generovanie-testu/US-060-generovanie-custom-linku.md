# US-060 – Systém generuje unikátny custom link pre test

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-060                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Generovanie testu               |
| **Rola** | Systém / platforma                 |

---

## User Story

> Ako **platforma**
> chcem **pri vytvorení testu automaticky vygenerovať unikátny, ťažko uhádnuteľný link**
> aby som **zaistila, že každý test má vlastnú izolovanú URL a neoprávnené odhadovacie útoky sú nepraktické**.

---

## Kontext

Custom link je primárny vstupný bod pre respondentov (US-002, US-070). Musí byť
kryptograficky náhodný, ľudsky čitateľný a dostatočne dlhý na odolanie brute-force
guessing. Link sa generuje raz pri vytvorení testu a je trvalý (pokiaľ autor nevygeneruje
nový v admin dashboarde).

---

## Akceptačné kritériá

- [ ] **AC-1:** Systém generuje pre každý test `share_id` – kryptograficky náhodný reťazec **12 znakov** z base62 abecedy (`a–z`, `A–Z`, `0–9`); výsledný priestor: 62^12 ≈ 3.2 × 10^21.
- [ ] **AC-2:** `share_id` je globálne unikátny v databáze; pri náhodnej kolízii (extrémne nepravdepodobné) systém regeneruje.
- [ ] **AC-3:** Custom link má formát `https://[domain]/t/{share_id}` – krátky, zdieľateľný a predvídateľne štruktúrovaný.
- [ ] **AC-4:** `share_id` je hashovaný v DB (`share_id_hash TEXT`) okrem plain hodnoty pre rýchle lookup; plain hodnota je uložená pre zobrazenie autorovi.
- [ ] **AC-5:** Autor môže v admin dashboarde vygenerovať nový `share_id`; starý link prestane fungovať (redirect na chybovú stránku) – systém zobrazí varovanie pred regeneráciou.
- [ ] **AC-6:** Systém nezverejňuje žiadne vzory v `share_id` (nie sekvenčné ID, nie odvodenie z timestamps).
- [ ] **AC-7:** Link je dostupný hneď po potvrdení vytvorenia testu; generovanie musí prebehnúť v rámci transakcie (buď test + link, alebo nič).
- [ ] **AC-8:** `share_id` je indexovaný pre efektívny lookup; endpoint `/t/{share_id}` musí odpovedať do 200ms p95.

---

## Technické poznámky

- Generovanie: `crypto.randomBytes(9).toString('base64url').slice(0, 12)` alebo ekvivalent v runtime.
- DB: `tests(share_id VARCHAR(12) NOT NULL UNIQUE, share_id_created_at TIMESTAMPTZ)`.
- Transakcia: INSERT test + share_id atomicky.
- Regenerácia: UPDATE share_id + audit log (US-163) + invalidácia respondentských sessions.

---

## Edge Cases

- Kolízia share_id: retry loop max 3 pokusy; po 3 pokusoch logovať a alertovať (štatisticky nemožné, ale defensive coding).
- Autor zdieľa link pred publikovaním testu: link existuje, ale server vráti stránku „Test nie je ešte dostupný".
- Test slúži pre vnútorné účely (neverejný): share_id je stále kryptograficky náhodný – autor zabezpečí distribúciu linku vlastným kanálom.

---

## Závislosti

- Závisí na: US-010–US-053 (kompletná konfigurácia testu pred generovaním)
- Blokuje: US-061 (summary page), US-070 (landing stránka respondenta)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: unikátnosť, base62 abeceda, transakčnosť
- [ ] Load test: /t/{id} endpoint < 200ms p95
- [ ] DB migrácia + DEPLOY_SETUP.sql aktualizovaný
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

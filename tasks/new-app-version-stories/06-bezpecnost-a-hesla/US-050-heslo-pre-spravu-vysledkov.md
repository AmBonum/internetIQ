# US-050 – Autor nastavuje heslo pre správu výsledkov

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-050                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Bezpečnosť a heslá              |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **nastaviť silné heslo pre prístup do admin rozhrania môjho testu**
> aby som **zabránil neoprávnenému prístupu k výsledkom, konfiguráciám a exportom**.

---

## Kontext

Admin heslo je primárny autentifikačný mechanizmus pre prístup do správy konkrétneho testu
(US-001). Nastavuje sa pri tvorbe testu a možno ho zmeniť iba po prihlásení s pôvodným
heslom. Musí byť uložené bezpečne – nikdy v plain-texte.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor zadá admin heslo v kroku „Nastavenie bezpečnosti" wizard flow; pole je povinné.
- [ ] **AC-2:** Systém vyžaduje potvrdenie hesla (repeat field); pri nezhode zobrazí inline chylbu a bráni pokračovaniu.
- [ ] **AC-3:** Heslo musí splniť silnostnú politiku (US-052); systém zobrazuje real-time strength meter pri písaní.
- [ ] **AC-4:** Heslo nie je nikdy odoslané späť klientovi (ani v response body, ani v logu).
- [ ] **AC-5:** Autor si môže zobraziť heslo pomocou toggle „Zobraziť heslo" (eye icon) pred odoslaním; po odoslaní nie je heslo dostupné v žiadnej čitateľnej forme.
- [ ] **AC-6:** Admin heslo je oddelené od hesla pre respondentov (US-051) – obe polia sú v rovnakom kroku ale vizuálne oddelené s jasnými labelmi a vysvetlením.
- [ ] **AC-7:** Ak autor stratí admin heslo, môže iniciovať reset procesom cez overovací email; reset link je jednorazový, exspiruje po 1 hodine.
- [ ] **AC-8:** Zmena admin hesla po vytvorení testu vyžaduje zadanie pôvodného hesla (current password confirmation).

---

## Technické poznámky

- Uloženie: `bcrypt` s work factor `≥ 12`, alebo `argon2id` (preferovaný v nových implementáciách).
- Reset token: kryptograficky náhodný 32-byte hex token uložený ako SHA-256 hash; originálny token sa pošle emailom.
- Password reset flow: invaliduje všetky aktívne admin sessions po úspešnej zmene.
- Nikdy nelogovať heslo ani jeho hash do application logov.

---

## Edge Cases

- Autor nastaví admin heslo rovnaké ako heslo pre respondentov: systém zobrazí varovanie (nie blokujúce) o bezpečnostnom riziku.
- Autor zabudne heslo ešte pred odoslaním formulára: obsah oboch heslo polí sa vymaže pri každom reloade stránky (bezpečnosť).
- Reset email nedorazil: systém umožní opakovať odoslanie po 5 minútach (cooldown) s rate limitom 3 pokusy/hodina.

---

## Závislosti

- Závisí na: US-052 (silné heslo), US-053 (bezpečné ukladanie)
- Blokuje: US-001 (prihlásenie admina), US-100 (admin dashboard)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: password policy enforcement, bcrypt/argon2id hash verifikácia
- [ ] Integračné testy: reset flow (token generovanie → email → reset → invalidácia sessions)
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Security review: žiadne heslo v logoch, správna hash konfigurácia

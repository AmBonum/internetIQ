# US-230 – Používateľ vidí zozbierané dáta o sebe

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-230                               |
| **Priorita** | P0 (GDPR čl. 15)                 |
| **Stav** | Draft                                |
| **Feature** | Transparentnosť dát               |
| **Rola** | Akýkoľvek návštevník (aj anonymný)   |

---

## User Story

> Ako **používateľ platformy (registrovaný alebo anonymný)**
> chcem **vidieť všetky dáta, ktoré platforma o mne zozbierala, vrátane lokálneho úložiska a session**
> aby som **plne rozumel, čo sa sleduje a mohol informovane rozhodovať o svojich dátach (GDPR čl. 15)**.

---

## Kontext

GDPR právo na prístup (čl. 15) sa vzťahuje na všetky osoby, nielen registrovaných.
Anonymný návštevník nemá DB identitu, ale platforma môže ukladať dáta do
`localStorage` a `sessionStorage`. Transparentnosť buduje dôveru.

---

## Akceptačné kritériá

### Pre anonymných návštevníkov

- [ ] **AC-1:** Stránka `/moje-data` je verejne dostupná bez prihlásenia.
- [ ] **AC-2:** Sekcia „Lokálne úložisko" zobrazuje čitateľnú tabuľku každého `localStorage` kľúča nastaveného platformou:
  - Kľúč, Hodnota (skrátená ak > 100 znakov), Účel, Právny základ, Doba uchovávania.
  - Kľúče tretích strán (napr. Cloudflare Insights) sú  označené ako „Externá služba" s odkazom na ich privacy policy.
- [ ] **AC-3:** Sekcia „Session" zobrazuje metadáta aktívnej session: session ID (skrátené), vytvorený, expiry, či je autentifikovaný.
- [ ] **AC-4:** Sekcia „Cookies" zobrazuje všetky cookies platformy s rovnakými atribútmi ako localStorage tabuľka (AC-2).
- [ ] **AC-5:** Každý riadok v tabuľkách obsahuje: „Prečo to zbierame" (jednoduchý text, nie legalese), „Do kedy to uchovávame", „Kto má prístup".

### Pre prihlásených používateľov (navyše)

- [ ] **AC-6:** Sekcia „Váš profil" zobrazuje aktuálne uložené profilové dáta z `public.profiles` (email, meno, avatar URL, created_at).
- [ ] **AC-7:** Sekcia „Vaše testy" (respondentská história): zoznam všetkých `attempts` – test ID, dátum, skóre, stav. Žiadne odpovede po 24h detailnom okne (US-194).
- [ ] **AC-8:** Sekcia „Súhlasy a preferencie": aktuálny stav consent settings (analytics yes/no, timestamp súhlasu, verzia banner-u z US-110).
- [ ] **AC-9:** Sekcia „Audit log vlastných akcií": posledných 50 akcií z `audit_log` kde `actor_id = current_user`. Stĺpce: Akcia, Entita, Timestamp, IP (skrátená: `x.x.x.*`).
- [ ] **AC-10:** Sekcia „DSR Requesty": prehľad odoslaných Data Subject Requests s ich aktuálnym stavom (z US-143).
- [ ] **AC-11:** `Last updated` timestamp stránky zobrazuje kedy boli DB dáta načítané. Tlačidlo „Obnoviť".

### Všeobecné

- [ ] **AC-12:** Stránka obsahuje stručné vysvetlenie každej sekcie v slovenčine bez právnického jazyka. Odkaz na plné Privacy Policy (US-140) a GDPR kontakt.
- [ ] **AC-13:** Stránka je printable (print CSS media query) – umožňuje export do PDF pre GDPR subjekty.

---

## Technické poznámky

- `localStorage` údaje čítané klientsky (SSR nema prístup k localStorage). Komponenty označené `'use client'`, čítanie v `useEffect` po mount.
- Definícia všetkých platforma-owned kľúčov v `src/lib/storage-manifest.ts`: `{ key, purpose, legalBasis, retentionDays, thirdParty }[]`. Toto je single source of truth pre tabuľku.
- Cookies: `document.cookie` parse + porovnanie s manifesm `src/lib/cookie-manifest.ts`.
- DB sekcie: jednotlivé Supabase queries – každá nezávislá (parallelné Promise.all). Využíva RLS: `auth.uid() = user_id`.

---

## Edge Cases

- Používateľ vymaže localStorage pred otvorením stránky: tabuľka zobrazí „(prázdne)" pre každý manifested kľúč s vysvetlením, čo by tam bolo.
- Stránka načítaná v incognito mode: žiadne localStorage dáta, žiadna session – stránka to jasne komunikuje, nie je to chyba.
- Supabase query zlyhaná (napr. network timeout): sekcia zobrazí „Dáta momentálne nedostupné" s retry tlačidlom, ostatné sekcie sa zobrazujú normálne.

---

## Závislosti

- Závisí na: US-110 (consent), US-140 (Privacy Policy), US-143 (DSR), US-194 (respondent história)
- Blokuje: US-231 (správa vlastných dát)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] `storage-manifest.ts` a `cookie-manifest.ts` vytvorené a kompletné
- [ ] Unit testy: anonymný view, prihlásený view, failed DB query fallback
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

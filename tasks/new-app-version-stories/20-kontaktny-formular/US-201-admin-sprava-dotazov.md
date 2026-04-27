# US-201 – Admin spravuje prichádzajúce dotazy

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-201                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Kontaktný formulár                |
| **Rola** | Platform admin                       |

---

## User Story

> Ako **platform admin**
> chcem **vidieť prehľad všetkých prichádzajúcich dotazov s možnosťou filtrovania, aktualizácie statusu a pridávania poznámok**
> aby som **mohol efektívne spracovávať support požiadavky a sledovať ich stav**.

---

## Kontext

Admin inbox je základná CRM funkcionalita. V V1 ide o jednoduché tabuľkové UI
bez ticketovacieho systému tretej strany. Cieľ: nulové nezodpovedané dotazy
staršie ako 2 pracovné dni.

---

## Akceptačné kritériá

- [ ] **AC-1:** Admin konzola (`/admin/inquiries`) zobrazuje tabuľku dotazov so stĺpcami: Ticket #, Dátum, Email, Meno, Typ, Predmet, Status, Posledná aktualizácia.
- [ ] **AC-2:** Filtrovanie tabuľky: podľa statusu (open / in_progress / resolved / closed / spam), typu dotazu, dátumového rozsahu, fulltextové hľadanie (predmet + email). Všetky filtre sú kombinovateľné.
- [ ] **AC-3:** Klik na riadok otvorí detail dotazu: celé znenie správy, história zmien statusu, admin poznámky (interné, neviditeľné pre odosielateľa).
- [ ] **AC-4:** Admin môže zmeniť status dotazu: `open → in_progress → resolved → closed`. Prechod na `spam` je dostupný z ľubovoľného stavu. Zmena statusu sa loguje s timestampom a admin ID.
- [ ] **AC-5:** Admin môže pridať internú poznámku (`admin_note`) k dotazu. Poznámka je viditeľná len administrátorom, nikdy sa neposiela odosielateľovi.
- [ ] **AC-6:** Admin môže označiť dotaz ako „vyžaduje odpoveď emailom" → otvorí sa mailto link s predvyplneným emailom, predmetom (Re: {subject}) a ticket číslom v signatúre. (V1: mailto, nie integrovaný email klient.)
- [ ] **AC-7:** Dashboard KPI banner nad tabuľkou: počet open, počet in_progress, počet unresolved > 2 pracovné dni (červené zvýraznenie ak > 0).
- [ ] **AC-8:** Export tabuľky ako CSV (s filtrami platnými v momente exportu). Export neobsahuje plné znenia správ – len metadata (ticket, email, typ, status, timestamps) pre GDPR minimalizáciu.

---

## Technické poznámky

- RLS: `contact_inquiries` SELECT len pre `platform_admin` rolu.
- Fulltextové hľadanie: `tsvector` index na (`subject || ' ' || email`) alebo jednoduché ILIKE query (pre malé objemy V1).
- Status história: `inquiry_status_log(inquiry_id, old_status, new_status, changed_by, changed_at)`.
- KPI „> 2 pracovné dni": query `WHERE status IN ('open','in_progress') AND created_at < now() - INTERVAL '2 days' AND EXTRACT(DOW FROM created_at) NOT IN (0,6)` (zjednodušenie – neignoruje sviatky).

---

## Edge Cases

- Admin omylom označí legitímny dotaz ako spam: `closed` stav (nie hard-delete). Spam záznamy sú stále v DB, len filtrované z default view.
- Dotaz príde späť od používateľa premenovaním emailu (follow-up): nový záznam v DB s novým ticket číslom – admin spáruje manuálne cez poznámky.

---

## Závislosti

- Závisí na: US-200 (contact_inquiries tabuľka), US-197 (platform admin auth)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: RLS blokácia pre non-admin, KPI výpočet
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

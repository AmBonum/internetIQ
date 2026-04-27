# US-040 – Autor konfiguruje vlastné zberové polia pre respondentov

| Atribút  | Hodnota                           |
|----------|-----------------------------------|
| **ID**   | US-040                            |
| **Priorita** | P0                            |
| **Stav** | Draft                             |
| **Feature** | Zber dát od respondentov       |
| **Rola** | Autor / administrátor testu       |

---

## User Story

> Ako **autor testu**
> chcem **definovať vlastné polia, ktoré respondent vyplní pred alebo počas testu**
> aby som **získal kontextové informácie o respondentoch relevantné pre môj konkrétny účel testovania**.

---

## Kontext

Zberové polia sa zobrazujú respondentovi ako krok pred spustením testu (intake formulár).
Autor ich plne konfiguruje: volí typ, povinnosť, poradie a validačné pravidlá. Táto
konfigurácia musí zodpovedať definovanému účelu spracovania (US-012) a minimalizácii dát.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže pridať, upraviť, odstrániť a zmeniť poradie zberových polí v konfigurátore drag-and-drop alebo šípkami.
- [ ] **AC-2:** Pre každé pole autor nastaví: `Názov poľa` (label pre respondenta), `Typ poľa` (viď US-032 typy), `Povinné / Voliteľné` prepínač.
- [ ] **AC-3:** Maximálny počet zberových polí je **20**; systém to validuje na klientskej aj serverovej strane.
- [ ] **AC-4:** Systém poskytuje knižnicu predpripravených polí (tzv. „quick add"), z ktorej autor môže jedným kliknutím pridať bežné polia: `E-mail respondenta`, `Pracovná pozícia`, `Oddelenie`, `Firma`, `Segment`, `Krajina`, `Pohlavie (voliteľné)`, `Vek (rozsah)`.
- [ ] **AC-5:** Každé zberové pole má pri previsualizácii viditeľnú reprezentáciu toho, ako ho uvidí respondent.
- [ ] **AC-6:** Systém prevenuje pridanie dvoch polí s rovnakým `field_name` (interný identifikátor, auto-generovaný zo `label` s slug normalizáciou).
- [ ] **AC-7:** Polia zberu dát sú uložené ako súčasť snapshotu konfigurácie testu – zmena po publikovaní si vyžaduje prechod do stavu `draft` (US-161).
- [ ] **AC-8:** Autor musí pre každé pole, ktoré zbiera osobné údaje, označiť právny základ zberu (dropdown: súhlas / zmluvná povinnosť / oprávnený záujem).

---

## Technické poznámky

- Schéma: `intake_field_configs(id UUID, test_id FK, field_name SLUG, label TEXT, field_type ENUM, required BOOL, legal_basis ENUM, sort_order INT, config JSONB, visible_in_report BOOL, include_in_export BOOL, is_anonymized BOOL)`.
- `config JSONB`: per-type konfigurácia (min, max, options, placeholder…) zdieľaná s US-032.
- Slug generovanie: `label` → lowercase, diakriti ka stripnutá, medzery → `_`, špeciálne znaky odstraňovane.
- Snapshot: pri publikovaní test uloží `intake_config_snapshot JSONB` – zmeny po publikovaní neovplyvnia existujúce odpovede.

---

## Edge Cases

- Autor pridá 20 polí, z ktorých 18 je povinných: systém to dovolí, ale zobrazí upozornenie o dlhom intake formulári.
- Autor zmaže pole, ktoré už má odpovede (test bol použitý): systém zamietne zmazanie, ak existujú odpovede – navrhne deaktiváciu / skrytie v reporte.
- Dois polia majú rovnaký label ale rôzny obsah: systém dovolí rovnaký label (pre respondenta), ale `field_name` slug musí byť unikátny (auto-suffixing: `_2`, `_3`).

---

## Závislosti

- Závisí na: US-012 (účel spracovania), US-032 (typy polí), US-041 (validačné pravidlá)
- Blokuje: US-070 (landing stránka respondenta), US-101 (admin dashboard)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: limit 20 polí, slug unikatnosť, legal_basis validácia
- [ ] E2E test: konfigurácia polí → preview → uloženie
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] GDPR review: legal_basis pre každé PII pole

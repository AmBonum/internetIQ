# Nová verzia aplikácie – User Stories: „Generovať test"

## Prehľad

Tento priečinok obsahuje user stories pre nový modul **„Generovať test"** –
plnohodnotný systém pre tvorbu testov a sád testov, zber respondentských dát,
správu výsledkov, export, notifikácie a administráciu v súlade so slovenskou
a európskou legislatívou.

Existujúca sekcia „Pre firmy" sa touto implementáciou nahrádza.

---

## Stavy story

| Stav         | Popis                                            |
|--------------|--------------------------------------------------|
| `Draft`      | Pripravená, čaká na refinement so stakeholdermi  |
| `Ready`      | Prefinovaná, pripravená na implementáciu          |
| `In Progress`| Aktuálne sa implementuje                         |
| `Done`       | Implementovaná, otestovaná, nasadená             |

---

## Priority

| Úroveň | Popis                                         |
|--------|-----------------------------------------------|
| **P0** | MVP blocker – bez toho sa produkt nespustí   |
| **P1** | Musí byť v prvom release                     |
| **P2** | Dôležitá, môže byť v druhom release          |
| **P3** | Nice-to-have, plánovaná iterácia             |

---

## Štruktúra priečinkov

| Priečinok                    | Oblasť                                      | Stories         |
|------------------------------|---------------------------------------------|-----------------|
| `01-auth-a-roly/`            | Autentifikácia, roly, oprávnenia            | US-001 – US-003 |
| `02-tvorba-testu/`           | Vstupný formulár, účel spracovania          | US-010 – US-013 |
| `03-vyber-testov/`           | Preddefinované sady, vlastné otázky         | US-020 – US-024 |
| `04-sprava-otazok/`          | Knižnica otázok, metadata, typy odpovedí   | US-030 – US-032 |
| `05-zber-dat-respondenta/`   | Zberové polia, validácia, anonymizácia      | US-040 – US-042 |
| `06-bezpecnost-a-hesla/`     | Heslá, hash, bezpečnostná politika          | US-050 – US-053 |
| `07-generovanie-testu/`      | Generovanie linku, summary page, email      | US-060 – US-062 |
| `08-custom-link/`            | Landing stránka, vstup respondenta          | US-070 – US-071 |
| `09-priebeh-testovania/`     | Test flow, sada testov, ukladanie postupu   | US-080 – US-083 |
| `10-historia-respondenta/`   | Výsledky, porovnanie, email download        | US-090 – US-092 |
| `11-admin-dashboard/`        | Správa respondentov, analytika, prístup     | US-100 – US-103 |
| `12-sledovanie-a-suhlas/`    | Analytics consent, behavior tracking        | US-110 – US-111 |
| `13-notifikacie/`            | Email notifikácie pre autora                | US-120 – US-121 |
| `14-export/`                 | PDF, CSV, JSON, emailový export             | US-130 – US-134 |
| `15-legal-a-privacy/`        | Privacy Policy, Cookie Policy, ToS          | US-140 – US-143 |
| `16-help-centrum/`           | Q&A, dokumentácia funkcií, onboarding      | US-150 – US-152 |
| `17-pokrocile-funkcie/`      | Verzovanie, drafts, skupiny, audit log      | US-160 – US-167 |

---

## Kompletný zoznam stories

| ID       | Názov                                                    | Priorita | Stav   |
|----------|----------------------------------------------------------|----------|--------|
| US-001   | Autor sa registruje a pristupuje k správe testov         | P0       | Draft  |
| US-002   | Respondent pristupuje k testu cez custom link            | P0       | Draft  |
| US-003   | Inštitucionálny klient spravuje tím adminov              | P2       | Draft  |
| US-010   | Autor vypĺňa povinné vstupné údaje                       | P0       | Draft  |
| US-011   | Autor vypĺňa voliteľné segmentačné údaje                 | P1       | Draft  |
| US-012   | Autor definuje účel spracovania dát                      | P0       | Draft  |
| US-013   | Systém zabezpečuje GDPR súlad vstupného formulára        | P0       | Draft  |
| US-020   | Autor si vyberá z preddefinovaných sád testov            | P0       | Draft  |
| US-021   | Autor filtruje preddefinované testy podľa kritérií       | P1       | Draft  |
| US-022   | Autor zostavuje vlastný test z knižnice otázok           | P1       | Draft  |
| US-023   | Autor filtruje otázky v knižnici                         | P1       | Draft  |
| US-024   | Systém vynucuje kapacitné limity testov                  | P0       | Draft  |
| US-030   | Správca systému spravuje knižnicu otázok                 | P0       | Draft  |
| US-031   | Každá otázka má štruktúrované metadata                   | P0       | Draft  |
| US-032   | Otázka podporuje všetky typy odpovedí                    | P1       | Draft  |
| US-040   | Autor konfiguruje vlastné zberové polia                  | P0       | Draft  |
| US-041   | Autor nastavuje validačné pravidlá pre polia             | P1       | Draft  |
| US-042   | Autor konfiguruje pokročilé nastavenia poľa              | P2       | Draft  |
| US-050   | Autor nastavuje heslo pre správu výsledkov               | P0       | Draft  |
| US-051   | Autor nastavuje heslo pre prístup respondentov           | P0       | Draft  |
| US-052   | Systém vynucuje silnú heslovú politiku                   | P0       | Draft  |
| US-053   | Systém bezpečne ukladá a overuje heslá                   | P0       | Draft  |
| US-060   | Systém generuje unikátny custom link pre test            | P0       | Draft  |
| US-061   | Autor vidí summary stránku po vytvorení testu            | P0       | Draft  |
| US-062   | Systém odošle autorovi email po vytvorení testu          | P1       | Draft  |
| US-070   | Respondent vidí landing stránku pred spustením           | P0       | Draft  |
| US-071   | Respondent zadá heslo a vstúpi do testu                  | P0       | Draft  |
| US-080   | Respondent spúšťa a dokončí jednoduchý test              | P0       | Draft  |
| US-081   | Respondent prechádza sadou testov sekvenčne              | P1       | Draft  |
| US-082   | Respondent vidí výsledkový sumár po dokončení            | P0       | Draft  |
| US-083   | Respondent uloží postup a pokračuje neskôr               | P2       | Draft  |
| US-090   | Respondent prehliada históriu testov v sade              | P2       | Draft  |
| US-091   | Respondent porovnáva výsledky z viacerých sedení         | P3       | Draft  |
| US-092   | Respondent obdrží výsledky emailom                       | P2       | Draft  |
| US-100   | Autor sa autentifikuje do admin dashboardu               | P0       | Draft  |
| US-101   | Autor prehliada zoznam respondentov                      | P0       | Draft  |
| US-102   | Autor vidí detail a odpovede konkrétneho respondenta     | P1       | Draft  |
| US-103   | Autor sleduje časové a analytické metriky                | P2       | Draft  |
| US-110   | Respondent spravuje analytický súhlas                    | P0       | Draft  |
| US-111   | Systém zbiera behaviorálne dáta pri aktívnom súhlase     | P2       | Draft  |
| US-120   | Autor konfiguruje email notifikácie pri tvorbe testu     | P1       | Draft  |
| US-121   | Systém odosiela notifikácie na základe udalostí          | P1       | Draft  |
| US-130   | Autor exportuje výsledky do PDF                          | P1       | Draft  |
| US-131   | Autor exportuje výsledky do CSV                          | P1       | Draft  |
| US-132   | Autor exportuje výsledky do JSON                         | P2       | Draft  |
| US-133   | Autor dostane emailový export prehľadu                   | P2       | Draft  |
| US-134   | Autor exportuje agregovaný prehľad sady testov           | P2       | Draft  |
| US-140   | Systém poskytuje Privacy Policy stránku                  | P0       | Draft  |
| US-141   | Systém poskytuje Cookie Policy stránku                   | P0       | Draft  |
| US-142   | Systém poskytuje Terms of Use stránku                    | P0       | Draft  |
| US-143   | Respondenti majú prístup k dokumentácii zberu dát        | P1       | Draft  |
| US-150   | Používateľ pristupuje k Help centru s Q&A                | P2       | Draft  |
| US-151   | Help centrum obsahuje dokumentáciu per feature           | P2       | Draft  |
| US-152   | Nový používateľ prechádza onboarding sprievodcom         | P3       | Draft  |
| US-160   | Systém verzuje testy a zachováva históriu zmien          | P2       | Draft  |
| US-161   | Test prechádza stavmi draft → publikovaný → archivovaný  | P1       | Draft  |
| US-162   | Firemný klient spravuje skupinové prístupy               | P2       | Draft  |
| US-163   | Systém vedie audit log všetkých zmien                    | P2       | Draft  |
| US-164   | Autor anonymizuje alebo trvalo maže dáta respondentov    | P1       | Draft  |
| US-165   | Test podporuje podmienené vetvenie otázok                | P3       | Draft  |
| US-166   | Autor vidí pokročilé analytické metriky dokončenosti     | P2       | Draft  |
| US-167   | Autor vytvorí test zo šablóny                            | P3       | Draft  |

---

## Konvencie story súborov

Každý súbor user story dodržiava túto hlavičku:

```
| Atribút   | Hodnota                      |
|-----------|------------------------------|
| ID        | US-XXX                       |
| Priorita  | P0 / P1 / P2 / P3            |
| Stav      | Draft / Ready / In Progress  |
| Feature   | Názov feature oblasti        |
| Rola      | Autor / Respondent / Správca |
```

A sekcie: **User Story → Kontext → Akceptačné kritériá → Technické poznámky → Edge Cases → Závislosti → Definition of Done**.

# Feature Ideas — subenai.sk

Nespracované nápady na nové funkcionality. Bez user stories — to príde neskôr pri plánovaní epiku.

---

## AI & Automatizácia — pipeline aktuálnosti obsahu

### Idea: AI agent — prieskum nových hrozieb

Agent periodicky (napr. týždenne) prehľadáva dôveryhodné zdroje a zapisuje aktuálne trendy podvodov a kybernetických hrozieb.

**Zdroje na sledovanie (návrh):**
- ENISA Threat Landscape (enisa.europa.eu)
- Europol IOCTA (europol.europa.eu)
- Polícia SR — kybernetická kriminalita (minv.sk)
- NBS — varovania pred podvodmi (nbs.sk)
- CSIRT.SK
- FBI Internet Crime Complaint Center (ic3.gov)
- Action Fraud UK (actionfraud.police.uk)
- Have I Been Pwned / Troy Hunt blog

**Output:** súbor `ai-pipeline/trends-YYYY-MM-DD.md` s kategorizovaným pregledom:
- Nové typy podvodov / techník
- Cieľové skupiny (seniori, firmy, žiaci...)
- Modus operandi (ako útok prebieha)
- Odporúčané obranné opatrenia

---

### Idea: AI agent — gap analýza oproti existujúcemu obsahu

Agent porovná výstup prieskumného agenta (trendy) so súčasným obsahom platformy (kurzy + otázky testov) a označí medzery.

**Vstupy:**
- `ai-pipeline/trends-YYYY-MM-DD.md` (výstup predchádzajúceho agenta)
- Zoznam existujúcich kurzov: `src/content/courses/`
- Zoznam existujúcich testovacích balíčkov: `src/content/test-packs/`

**Output:** zoznam akcií v `ai-pipeline/gap-YYYY-MM-DD.md`:
- Nové témy, ktoré treba pokryť (chýbajúci kurz alebo otázka)
- Existujúce otázky/kurzy, ktoré treba aktualizovať (zastaraný modus operandi)
- Priority (High / Medium / Low) podľa frekvencie výskytu trendu

---

### Idea: Skript — generovanie implementačného TODO + push do branch

Po každom cykle oboch agentov skript:
1. Zlúči výstupy (`trends-*` + `gap-*`) do `ai-pipeline/todo-YYYY-MM-DD.md`
2. Súbor obsahuje stručné zhrnutie + akčné položky pre implementáciu
3. Automaticky vytvorí `git commit` a pushne do dedikovanej vetvy `content/ai-todos`

**Workflow:**
```
[cron / manuálne spustenie]
  → agent: prieskum hrozieb       → trends-YYYY-MM-DD.md
  → agent: gap analýza obsahu     → gap-YYYY-MM-DD.md
  → skript: merge + summary       → todo-YYYY-MM-DD.md
  → git push origin content/ai-todos
```

Výsledok: `content/ai-todos` branch obsahuje históriu všetkých TODO súborov. Môžem ich priamo otvoriť v Claude Code a rozplánovat implementáciu do user stories a epikov.

---

## Monetizácia

### Idea: Spoplatnenie pri prekročení limitu vygenerovaných testov

Firmy a jednotlivci, ktorí vygenerujú viac ako **10 testov / testovacích sád**, prejdú na platený tier.

**Návrh modelu:**
- Free tier: do 10 vygenerovaných testov/sád (navždy, bez kreditnej karty)
- Paid tier: > 10 testov → predplatné alebo pay-per-use

**Možné cenové modely (na zváženie):**
- Mesačné predplatné (napr. 9 €/mes — neobmedzene) — jednoduchosť
- Pay-per-use (napr. 0,50 €/test nad limit) — nízka bariéra pre občasných používateľov
- Balíčky kreditov (napr. 20 testov za 5 €) — vhodné pre SME bez predplatného

**Poznámky:**
- Limit sa počíta per firma/účet, nie per používateľ
- Free tier musí ostať plne funkčný pre fyzické osoby (misia platformy)
- B2B Edu Mode (plánovaný) bude mať vlastný pricing — toto je skôr self-serve vrstva pod ním

---

*Posledná aktualizácia: apríl 2026*

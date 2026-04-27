# US-195 – Respondent zdieľa a exportuje svoje výsledky

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-195                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Respondent (prihlásený)              |

---

## User Story

> Ako **prihlásený respondent**
> chcem **môcť zdieľať výsledky svojich testov s inými a exportovať ich v rôznych formátoch**
> aby som **mohol prezentovať výsledky zamestnávateľovi, na LinkedIn profil alebo si ich archivovať**.

---

## Kontext

Zdieľanie výsledkov je kľúčová hodnotová propozícia pre respondentov. Na rozdiel
od autora (US-130–134), respondent zdieľa len **vlastné** výsledky, nie dáta iných
ľudí. Respondent nemôže zdieľať summárne dáta testu (to je výhradne autorova
kompetencia).

---

## Akceptačné kritériá

- [ ] **AC-1:** Pre každý dokončený attempt má respondent k dispozícii tri spôsoby zdieľania:
  1. **Verejný link** (shareable URL): kryptograficky náhodný token, verejne dostupný bez prihlásenia. Zobrazia sa len výsledky povolené autorom (`show_score`, `show_percentile`).
  2. **Súkromný link** (auth-gated): len pre prihlásených používateľov s explicitne udeleným prístupom.
  3. **Priame stiahnutie** (export).
- [ ] **AC-2:** Verejný zdieľací link (`/share/r/{shareToken}`) zobrazuje minimálny profil výsledku: meno respondenta (ak povolil), názov testu, skóre/percentil, dátum dokončenia, logo/meno organizácie autora (ak `show_author = TRUE`). **Neobsahuje** konkrétne otázky a odpovede (len agregované skóre).
- [ ] **AC-3:** Respondent môže kedykoľvek zneplatniť (revoke) verejný zdieľací link. Po revokácii stránka vráti 404.
- [ ] **AC-4:** Export formáty dostupné respondentovi (single attempt):
  - **PDF certifikát/report**: vizuálne atraktívny dokument so skóre, dátumom, QR kódom pre verifikáciu (link na verejný share URL).
  - **JSON**: štruktúrované dáta (vlastné odpovede + metadata). Bez otázok testu (duševné vlastníctvo autora) – len `question_id` a odpoveď.
  - **CSV**: flat verzia rovnakých dát ako JSON.
- [ ] **AC-5:** PDF certifikát obsahuje: meno respondenta, názov testu, dátum, skóre, percentil, QR kód a text „Verify at {platform URL}". QR kód smeruje na verejný share link (AC-2).
- [ ] **AC-6:** Hromadný export: respondent môže exportovať **všetky** svoje dokončené testy naraz ako ZIP archív (collection JSON alebo CSV). Max 100 attempts v jednom hromadnom exporte.
- [ ] **AC-7:** Zdieľanie na LinkedIn: tlačidlo „Zdieľať na LinkedIn" generuje LinkedIn Share URL s OG metadátami (title, description, image). Toto je deep-link na verejný share URL – nie OAuth integrácia.
- [ ] **AC-8:** Každý export a zdieľanie je logovaný v `respondent_share_log(user_id, attempt_id, share_type, created_at)` – pre prípadné GDPR audit.

---

## Technické poznámky

- Share token: `gen_random_bytes(24)` → base64url → dlhý nepredvídateľný token (nie UUID).
- `attempt_shares(id, attempt_id, user_id, token_hash, is_public, revoked_at, created_at)`.
- PDF certifikát: server-side generovanie (Edge Function), rovnaká infra ako US-130.
- QR kód: `qrcode` npm balíček na serveri, embeddovaný ako SVG/PNG do PDF.
- OG metadata pre share stránku: `<meta property="og:title">`, `<meta property="og:image">` – generované SSR podľa attempt dát.

---

## Edge Cases

- Autor zakázal zobrazenie skóre (`show_score = FALSE`): verejný share link zobrazí len „Dokončený" bez numerického výsledku. PDF report je stále možný, ale bez skóre.
- Respondent zdieľa výsledky a potom požiada o GDPR výmaz (US-143): výmaz zruší všetky share tokeny a anonymizuje attempt. Verejný link prestane fungovať.
- Hromadný export > 100 attempts: systém exportuje posledných 100. Staršie sú dostupné individuálne.

---

## Závislosti

- Závisí na: US-194 (história – zoznam attemptov na zdieľanie), US-082 (attempt data)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: token revocation, show_score=FALSE blokácia v share view
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: JSON export neobsahuje plné texty otázok (DP autora)

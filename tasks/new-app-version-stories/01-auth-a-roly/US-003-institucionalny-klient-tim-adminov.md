# US-003 – Inštitucionálny klient spravuje tím adminov

| Atribút  | Hodnota                                    |
|----------|--------------------------------------------|
| **ID**   | US-003                                     |
| **Priorita** | P2                                     |
| **Stav** | Draft                                      |
| **Feature** | Autentifikácia a roly                   |
| **Rola** | Inštitucionálny klient / hlavný administrátor |

---

## User Story

> Ako **inštitucionálny administrátor**
> chcem **spravovať viacero adminov s rôznymi úrovňami prístupu**
> aby som **mohol delegovať správu testov na kolegov bez toho, aby stratili kontrolu nad citlivými dátami alebo nastaveniami**.

---

## Kontext

Firemní a inštitucionálni klienti potrebujú viac ako jedného správcu.
HlavNý admin (owner) vytvorí test a môže pozvať ďalších používateľov
s rolami: **Editor** (môže meniť otázky a nastavenia), **Viewer** (len
čítanie výsledkov) a **Owner** (plný prístup vrátane mazania a zmeny hesiel).
V prvej verzii postačí jednoduché heslo-based zdieľanie; plný IAM model
je pripravený na iteráciu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Vlastník testu (Owner) môže v admin dashboarde vygenerovať pozývací kód alebo odkaz pre nového admina, ktorý exspiruje po 48 hodinách.
- [ ] **AC-2:** Pri pozvaní nového admina Owner definuje jeho rolu: `owner`, `editor`, alebo `viewer`.
- [ ] **AC-3:** Editor má prístup k úprave otázok, nastavení zberových polí a notifikácií; nemá prístup k zmazaniu testu ani zmene hesiel.
- [ ] **AC-4:** Viewer má prístup iba na čítanie výsledkov, odpovedí respondentov a exportov; nemôže meniť žiadne nastavenia.
- [ ] **AC-5:** Owner môže kedykoľvek odobrať prístup inému adminovi; po odobratí sú všetky ich aktívne sessions okamžite invalidované.
- [ ] **AC-6:** Zoznam adminov a ich rolí je viditeľný iba pre Ownera; Editor a Viewer nevidia ostatných členov tímu.
- [ ] **AC-7:** Audit log (US-163) zaznamenáva pozvanie, zmenu roly a odobranie admina s menom akcie a timestampom.
- [ ] **AC-8:** Maximálny počet adminov na jeden test je 10; pri prekročení systém zobrazí informatívnu hlášku.

---

## Technické poznámky

- Schéma: `test_admins(test_id, user_identifier, role ENUM('owner','editor','viewer'), invited_by, invited_at, expires_at, revoked_at)`.
- Pozývací kód: kryptograficky náhodný token uložený ako hash; originálny token sa zobrazí iba raz.
- RLS: každý admin vidí iba záznamy pre testy, ku ktorým je priradený.
- Session invalidácia: pri revoke nastaviť `revoked_at = now()` a odhadovacia kontrola pri každom autorizovanom requeste.
- Táto story závisí na existencii perzistentných používateľských účtov (iterácia po US-001 základe).

---

## Edge Cases

- Owner sa pokúsi sám seba degradovať: systém to zamietne s vysvetlením (aspoň jeden Owner musí existovať).
- Pozývací odkaz bol poslaný na nesprávny email: Owner môže zrušiť nevyužitý invite token.
- Dvaja Owneri súčasne menia nastavenia testu: posledný zápis vyhráva; systém nezobrazuje conflict warning v P2, ale logguje oba zápisy do audit logu.
- Inštitúcia má viac testov: každý test má vlastný, nezávislý zoznam adminov.

---

## Závislosti

- Závisí na: US-001 (základ auth), US-163 (audit log)
- Blokuje: US-162 (skupinové prístupové práva)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: rola-based access control pre každú rolu
- [ ] Integračné testy: pozvanie → akceptácia → prístup podľa roly → revoke
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Security review: eskalácia privilégií nie je možná obídením API

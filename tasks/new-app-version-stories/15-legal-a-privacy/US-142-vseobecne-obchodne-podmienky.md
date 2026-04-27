# US-142 – Platforma zverejňuje Všeobecné obchodné podmienky

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-142                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Legal a privacy                   |
| **Rola** | Platforma / prevádzkovateľ           |

---

## User Story

> Ako **prevádzkovateľ platformy**
> chcem **mať zverejnené Všeobecné obchodné podmienky (VOP) dostupné a odsúhlasené pred použitím platformy**
> aby som **mal právny základ pre používanie platformy autormi testov a vymedzil zodpovednosť strán**.

---

## Kontext

VOP sa vzťahujú primárne na autorov testov (nie respondentov – respondenti
pristupujú k testu cez custom link a súhlasia s podmienkami konkrétneho testu,
nie platformy). Autori musia VOP odsúhlasiť pri prvom prihlásení / vytvorení
prvého testu.

---

## Akceptačné kritériá

- [ ] **AC-1:** VOP stránka je dostupná na URL `/terms-of-service`. Redirect z `/vop` a `/terms`.
- [ ] **AC-2:** Odkaz na VOP je v pätičke každej stránky (vrátane test landing stránky pre respondentov – pre prehladnosť a transparentnosť platformy).
- [ ] **AC-3:** Dokument pokrýva: definíciu služby, práva a povinnosti autora testu, zakázané použitia (napr. zber dát bez súhlasu), obmedzenie zodpovednosti platformy, podmienky zrušenia/pozastavenia, rozhodné právo (SR).
- [ ] **AC-4:** Autor testu musí odsúhlasiť VOP pri vytváraní testu (checkbox „Súhlasím s VOP"). Súhlas je zaznamenaný v `test_consents(test_id, consent_type='terms', version, consented_at, ip_hash)`.
- [ ] **AC-5:** Pri zmene VOP (nová verzia), existujúci autori sú notifikovaní emailom a musí odsúhlasiť pri ďalšom prihlásení (soft gate – môžu zobraziť existujúce testy, ale nie vytvoriť nový bez odsúhlasenia).
- [ ] **AC-6:** Dokument má „Dátum poslednej aktualizácie" a verziu (napr. „v1.2") prominentne zobrazené.
- [ ] **AC-7:** Stránka je SSR a indexovateľná.
- [ ] **AC-8:** VOP sú v slovenčine. Ak autorom testu je zahraničná firma, poskytnutie anglickej verzie je V2 (nie blocker pre V1).

---

## Technické poznámky

- `test_consents` tabuľka: `ip_hash = HMAC-SHA256(ip, secret)`, nie plain IP (privacy by design).
- Soft gate pri zmene VOP: `tests.tos_version_accepted < current_tos_version` → banner s výzvou odsúhlasiť.
- `legal_doc_versions` zdieľaná s US-140 pre verzioning VOP.

---

## Edge Cases

- Autor sa pokúsi vytvoriť test bez odsúhlasenia: form submit je server-side blockovaný (nie len klientské UI).
- VOP sa zmenia kým má autor otvorené formulár: pri submite server overí verziu; ak nesúhlasí, vráti 409 a zobrazí aktuálnu VOP.

---

## Závislosti

- Závisí na: US-001 (autor flow), US-010 (vytvorenie testu – checkpoint)
- Blokuje: US-143 (DSR – práva dotknutých osôb sú súčasťou VOP kontextu)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Legal review dokumentu právnikom
- [ ] Server-side blokácia bez odsúhlasenia overená testom
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

# US-141 – Platforma zverejňuje Cookie Policy

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-141                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Legal a privacy                   |
| **Rola** | Platforma / prevádzkovateľ           |

---

## User Story

> Ako **prevádzkovateľ platformy**
> chcem **mať zverejnenú Cookie Policy s detailom o všetkých súboroch cookie a tracking technológiách**
> aby som **splnil zákonné požiadavky smernice ePrivacy a GDPR pri používaní cookies**.

---

## Kontext

Cookie Policy popisuje každú cookie (alebo equivalent storage) ktorú platforma
ukladá. Musí rozlišovať funkčné (nevyhnutné) cookies od analytických/marketingových.
Dokument je linkovaný z Cookie Bannera (US-110 analog pre platformové cookies)
a z Privacy Policy (US-140).

---

## Akceptačné kritériá

- [ ] **AC-1:** Cookie Policy stránka je dostupná na URL `/cookie-policy`. Redirect z `/cookies` na `/cookie-policy`.
- [ ] **AC-2:** Dokument obsahuje tabuľku cookies s stĺpcami: Názov, Provider, Účel, Typ (funkčná/analytická/marketingová), Doba expirácie.
- [ ] **AC-3:** Rozlíšenie kategórií: (1) Nevyhnutné - session_id, CSRF token, (2) Funkčné - language preference, (3) Analytické - len ak consent daný (US-110), (4) Marketingové - ak nepoužívame, explicitne uviesť „Nepoužívame".
- [ ] **AC-4:** Dokument obsahuje odkaz na správu súhlasu (odkaz na Cookie Preferences dialog existujúceho consent systému).
- [ ] **AC-5:** Pri každej zmene tech stacku ktorá pridá novú cookie (napr. nový analytics provider), `legal_doc_versions` záznam + update Cookie Policy je povinný pred deployom.
- [ ] **AC-6:** Cookie Policy je linkovaná z: pätičky, consent bannera, Privacy Policy (US-140).
- [ ] **AC-7:** Stránka je SSR a indexovateľná.
- [ ] **AC-8:** Respondenti testov (externé subdomény / custom links) majú prístup ku Cookie Policy z landing stránky testu.

---

## Technické poznámky

- Tabuľka cookies je staticky udržiavaná v MDX / React komponente (nie dynamicky generovaná).
- Cookie audit: pred každým releasom skontrolovať Network tab → Application → Cookies a porovnať s dokumentom.
- `CONSENT_VERSION` bump: potrebný ak sa zmení kategória cookies (nie pri zmene len textu).

---

## Edge Cases

- Nová platforma feature pridá analytickú cookie bez aktualizácie dokumentu: CI step (script check-bundle-no-trackers.sh) by mal zachytiť nové trackers.
- Lokálne dev nastavenie ukladá debug cookies: zabezpečiť že `__Host-` prefix cookies nie sú prítomné v produkcii okrem deklarovaných.

---

## Závislosti

- Závisí na: US-140 (Privacy Policy – odkazujú sa navzájom)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Cookie tabuľka kompletná a aktuálna pre všetky produkčné cookies
- [ ] Odkaz z bannera, pätičky a PP prítomný a funkčný
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

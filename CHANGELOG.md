# Changelog

Verejný zoznam zmien projektu subenai. Píšeme ho pre používateľov a sponzorov,
takže nájdeš tu len to, čo má vplyv na to, čo vidíš a používaš — bez interných
detailov, ciest k súborom alebo technického žargónu.

Formát vychádza zo [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/).
Verzie idú od najnovšej. Drobné úpravy textov a interné práce neuvádzame.

## [Unreleased]

> Pripravujeme. Tieto zmeny sú nasadené, ale verziu označíme až keď bude
> celý balík funkcionality (sponsorship, zber custom-test odpovedí, atď.)
> kompletne otestovaný v reálnej prevádzke.

### Pridané
- Možnosť **podporiť projekt** jednorazovo alebo mesačne. Faktúru dostaneš e-mailom; mesačný odber zrušíš kedykoľvek jediným klikom v Stripe Customer Portal.
- Stránka **O projekte** — cieľ, prečo sponsorship namiesto členstva, kam idú peniaze.
- Verejný **zoznam sponzorov**, ktorí pri podpore zaškrtli súhlas so zverejnením mena. Anonymita je default.
- Stránka **Spravovať podporu** — pošleme ti na e-mail magic-link na Stripe Customer Portal pre prípad, že si stratil/a potvrdzujúci e-mail.
- Verejný changelog (toto stránka).

### Zmenené
- **Identifikácia prevádzkovateľa** v zásadách ochrany súkromia — projekt teraz transparentne vystupuje ako am.bonum s. r. o. (predtým fyzická osoba). Cookie banner sa znova zobrazil, aby si mohol/a aktualizovať svoj súhlas pod správnu entitu.
- Texty na stránkach **O projekte**, **Cookies** a **Súkromie** o trackingu: sformulované tak, aby boli zrozumiteľné a konzistentné s tým, čo cookie banner naozaj robí — analytika a marketing sa zapnú **iba so súhlasom**.
- V hlavičke stránky pribudol odkaz **Podporiť projekt**; v päte stránky **Sponzori** a **Zmeny**.

### Opravené
- Drobná chyba pri prepínaní medzi rôznymi testami: po dokončení jedného testu sa pri kliknutí na iný niekedy zobrazil starý výsledok. Teraz sa každý test začne čisto od prvej otázky.

## [1.4.0] — 2026-04-26
### Zmenené
- Premenovanie projektu z **internetiq** na **subenai**. Nové logo (gradient acid-lime → emerald), nový favicon, nová doména. Obsah testu, kurzov a celá funkcionalita zostala nezmenená.

## [1.3.0] — 2026-04-25
### Pridané
- **Testy pre konkrétne odvetvia** — e-shop, gastro, autoservis, IT vývoj, verejné služby. Každý balík má vlastný výber otázok a vlastnú hranicu „Vyhovuje pre…" pri vyhodnotení.
- **Stovka nových otázok** — phishing, smishing, vishing, marketplace podvody, BEC, investičné podvody, romance scams.
- **8 nových školení** pod sekciou *Školenia* (predtým *Kurzy*) s detailným rozpisom, ako jednotlivé typy podvodov vyzerajú a ako sa im brániť.

### Zmenené
- Úvodná stránka prepísaná pre prvý dojem: *„Zistíš, či by si prežil."*

## [1.2.0] — 2026-04-20
### Pridané
- **Detailný review tvojich odpovedí** po dokončení testu — pre každú otázku vidíš svoju odpoveď, správnu odpoveď a krátke vysvetlenie.
- **Voliteľný prieskum** po teste (vek, pohlavie, miesto, sebahodnotenie, najväčšia obava online, či si už raz nasadol/a). Nič nie je povinné, môžeš odoslať aj prázdny formulár.
- **Edukatívny popup** po výsledku, ktorý ťa vyzve „vyplniť" citlivé údaje — a okamžite vysvetlí, prečo to bola past. Nič z toho, čo do popupu napíšeš, neopustí tvoj prehliadač.
- **Zdieľanie výsledku** cez sociálne siete (Facebook, Messenger, WhatsApp, X, LinkedIn, Telegram). Bez tracking pixelov — len obyčajné odkazy.

## [1.1.0] — 2026-04-15
### Pridané
- **Skóre, percentil a archetyp osobnosti** po dokončení testu.
- **Zdieľateľný odkaz** na tvoj výsledok cez krátky kód — nikoho neidentifikuje.
- **Cookie consent** s 4 kategóriami (nutné, predvoľby, analytika, marketing). Default: nič mimo nutných.
- Stránky **Súkromie** a **Cookies** so zoznamom toho, čo presne spracúvame, ako dlho a na akom právnom základe.

## [1.0.0] — 2026-04-10
### Pridané
- Prvé verejné spustenie: 15-otázkový test rozpoznávania scam-ov a phishingu, anonymne, bez registrácie.

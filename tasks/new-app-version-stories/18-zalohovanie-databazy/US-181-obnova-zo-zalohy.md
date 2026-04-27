# US-181 – Prevádzkovateľ obnovuje databázu zo zálohy

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-181                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Zálohovanie databázy              |
| **Rola** | Platforma admin / ops engineer       |

---

## User Story

> Ako **ops engineer platformy**
> chcem **mať zdokumentovaný a otestovaný postup obnovy databázy zo zálohy**
> aby som **mohol v prípade havárie rýchlo a spoľahlivo obnoviť dáta s minimálnym výpadkom**.

---

## Kontext

Záloha bez otestovanej obnovy má nulovú hodnotu. Táto story definuje tri
scenáre obnovy: (1) Point-in-Time Recovery cez Supabase dashboard pre nedávne
incidenty, (2) obnova z pg_dump zálohy pre staršie incidenty, (3) obnova do
izolovaného staging prostredia na verifikáciu dát pred aplikovaním na produkciu.
RTO (Recovery Time Objective) target: < 4 hodiny. RPO (Recovery Point Objective)
target: < 24 hodín (alebo do posledného PITR bodu pre posledných 30 dní).

---

## Akceptačné kritériá

- [ ] **AC-1:** **Scenár A – Supabase PITR obnova** (odporúčaný pre incidenty posledných 30 dní):
  - Postup: Supabase Dashboard → Project Settings → Backups → Point in Time Recovery → vybrať timestamp → spustiť restore.
  - Zdokumentované v `DEPLOYMENT.md` s presným krok-za-krokom vrátane screenshotov krokov (alebo CLI príkazov).
  - Odhadovaný čas obnovy: 15–60 minút podľa veľkosti DB.
- [ ] **AC-2:** **Scenár B – Obnova z pg_dump zálohy** (pre staršie incidenty):
  ```bash
  # 1. Stiahnuť a dešifrovať zálohu
  aws s3 cp s3://backups/{filename}.dump.gz.gpg ./backup.dump.gz.gpg \
      --endpoint-url $R2_ENDPOINT
  gpg --batch --passphrase "$GPG_PASSPHRASE" \
      --decrypt backup.dump.gz.gpg | gunzip > backup.dump

  # 2. Verifikácia čitateľnosti (neaplikuje do DB)
  pg_restore --list backup.dump > /dev/null && echo "Dump OK"

  # 3. Obnova do cieľovej DB
  pg_restore --clean --if-exists --no-owner --no-privileges \
             -d "$TARGET_DATABASE_URL" backup.dump
  ```
- [ ] **AC-3:** **Scenár C – Obnova do staging/verifikačného prostredia**: Pred aplikovaním zálohy na produkciu existuje postup na restore do izolovao Supabase projektu (staging), kde sa overí integritu dát a funkčnosť aplikácie.
- [ ] **AC-4:** **Post-restore checklist** (súčasťou runbooku):
  - [ ] Overiť počet záznamov v kľúčových tabuľkách (`tests`, `attempts`, `users`)
  - [ ] Otestovať prihlásenie admin používateľa
  - [ ] Otestovať vytvorenie testového attempt
  - [ ] Skontrolovať RLS policies (spustiť `rls_smoke_test.sql`)
  - [ ] Obnoviť Supabase secrets / environment variables ak boli súčasťou restore
  - [ ] Notifikovať používateľov o výpadku (ak aplikovateľné)
- [ ] **AC-5:** **Pravidelné cvičenia obnovy**: Raz za kvartál sa spustí Scenár C (restore do staging) a výsledok je zdokumentovaný v `DEPLOYMENT.md` so statusom `PASSED/FAILED` a dátumom. Toto je trackované ako recurring task v projektovej dokumentácii.
- [ ] **AC-6:** **Kontaktný zoznam pre incident**: `DEPLOYMENT.md` obsahuje sekciu „Incident Response":
  - Primárny ops kontakt (email + telefón)
  - Supabase support link a SLA tier
  - Cloudflare R2 support link
  - Eskalačná matica (kto sa kontaktuje po 1h/4h/24h bez obnovy)
- [ ] **AC-7:** **Zoznam zálohy a validácia checksumu** pred obnovením:
  ```bash
  # Stiahnutie manifestu a overenie checksumu
  aws s3 cp s3://backups/backup_manifest.json ./manifest.json \
      --endpoint-url $R2_ENDPOINT
  EXPECTED=$(jq -r '.sha256' manifest.json)
  ACTUAL=$(sha256sum backup.dump.gz.gpg | cut -d' ' -f1)
  [ "$EXPECTED" = "$ACTUAL" ] || { echo "CHECKSUM MISMATCH"; exit 1; }
  ```
- [ ] **AC-8:** **Obnova Supabase Edge Functions a storage**: Runbook obsahuje postup na re-deploy Edge Functions (`supabase functions deploy`) a prípadnú obnovu Supabase Storage bucketov (ak sú zálohovane separátne).

---

## Technické poznámky

- `rls_smoke_test.sql`: SQL skript ktorý emuluje anon rolu a overí, že RLS blokuje prístup kde má. Súčasť repozitára v `supabase/tests/rls_smoke_test.sql`.
- `pg_restore --clean --if-exists`: bezpečnejšie ako `--create` pri restore do existujúcej DB.
- Supabase projekty majú iné `DATABASE_URL` pre každý projekt – staging URL je v GitHub Environments `staging`.
- GPG kľúč rotácia: pri rotácii kľúča je nutné re-zašifrovať existujúce zálohy (cron script `reencrypt_backups.sh` zdokumentovaný v repo).

---

## Edge Cases

- Backup file je poškodený (checksum mismatch): obnova sa zastaví, ops sa prepne na predošlú dennú zálohu.
- `pg_restore` zlyhá na cudzích kľúčoch (fk constraint): použiť `--disable-triggers` počas restore (pozor: vyžaduje superuser – použiť Supabase service role).
- Verzia `pg_dump` na zálohovacom serveri sa líši od verzie PostgreSQL v Supabase: vždy inštalovať pg_dump verziu kompatibilnú s cieľovým PG (pin verziu v GitHub Actions `apt-get install postgresql-client-15`).

---

## Závislosti

- Závisí na: US-180 (zálohovanie – zdroj zálohovacích súborov)
- Blokuje: nič (terminálna ops story)

---

## Definition of Done

- [ ] Runbook zdokumentovaný v `DEPLOYMENT.md` sekcia „Backup & Recovery"
- [ ] Scenár B otestovaný do staging prostredia a výsledok zdokumentovaný
- [ ] `rls_smoke_test.sql` vytvorený a funkčný
- [ ] Post-restore checklist overený manuálne
- [ ] GPG kľúč rotačný postup zdokumentovaný
- [ ] Code review schválený

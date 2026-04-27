# US-180 – Platforma automaticky zálohuje databázu

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-180                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Zálohovanie databázy              |
| **Rola** | Systém / platforma admin             |

---

## User Story

> Ako **prevádzkovateľ platformy**
> chcem **aby sa databáza automaticky zálohovala podľa definovaného plánu na bezpečné, šifrované úložisko**
> aby som **mohol obnoviť dáta v prípade havárie, ľudskej chyby alebo kompromitácie bez straty kritických informácií**.

---

## Kontext

Platforma uchováva osobné dáta respondentov (GDPR), výsledky testov a obchodné
dáta autorov. Strata dát by mala právne aj reputačné následky. Zálohovacia
stratégia musí pokrývať: periodické fulll-backupy, WAL-based point-in-time
recovery (PITR), šifrovaný prenos aj uloženie, a nezávislé overenie integrity
zálohy. Supabase Pro/Team plan poskytuje natívne PITR – táto story definuje
aj vrstvu vlastných zálohovacích procesov nad ňou.

---

## Akceptačné kritériá

- [ ] **AC-1:** **Supabase PITR aktivovaný**: Supabase Point-in-Time Recovery je zapnutý na projekte (vyžaduje Pro plan alebo vyšší). Retention 7 dní (predvolené) – rozšíriť na 30 dní pre compliance.
- [ ] **AC-2:** **Denná pg_dump záloha**: Každú noc o 02:00 UTC sa spustí `pg_dump` cez Supabase Edge Function (alebo GitHub Actions cron) a vygeneruje komprimovaný dump (`custom` formát – `-Fc`). Dump sa uploadne do dedikovaného S3-kompatibilného bucketu (Cloudflare R2 alebo AWS S3).
- [ ] **AC-3:** **Šifrovanie**: pred uploadom sa dump zašifruje pomocou `gpg --symmetric --cipher-algo AES256` s kľúčom uloženým v GitHub Actions Secrets / Cloudflare Workers Secrets. Plaintext dump sa nikdy neuloží na disk – pipeline: `pg_dump | gzip | gpg → upload`.
- [ ] **AC-4:** **Retenčná politika zálohy**:
  - Denné zálohy: uchovávať 30 dní
  - Týždenné zálohy (každú nedeľu): uchovávať 12 mesiacov
  - Mesačné zálohy (1. deň mesiaca): uchovávať 7 rokov (právna povinnosť pre niektoré typy dát)
  - Implementovaná cez lifecycle policy na R2/S3 buckete.
- [ ] **AC-5:** **Overenie integrity zálohy**: Po každom uploade sa vypočíta SHA-256 checksum dumpu a uloží sa do `backup_manifest.json` v buckete. Raz týždenne sa spustí overovací job, ktorý stiahne poslednú zálohu, dešifruje ju a spustí `pg_restore --list` (bez aplikovania do DB) – overí, že dump je čitateľný.
- [ ] **AC-6:** **Notifikácie**: Pri zlyhaní zálohovacieho jobu sa odošle email na ops email adresu do 15 minút. Úspešná záloha je logovaná do `backup_log(run_at, type, size_bytes, checksum, status, storage_path)`.
- [ ] **AC-7:** **Izolácia zálohovacích credentials**: DB connection string pre zálohovanie používa read-only Supabase service role (nie anon key, nie admin key). R2/S3 bucket má dedikovaný IAM user s oprávnením len `PutObject` + `GetObject` na zálohovací bucket (nie delete, nie list iných bucketov).
- [ ] **AC-8:** **Geografická redundancia**: Zálohy sú uložené v aspoň dvoch geograficky oddelených lokáciách (napr. R2 bucket s replication alebo primárny R2 + sekundárny S3 v inej AWS region).

---

## Technické poznámky

```yaml
# GitHub Actions cron príklad
name: Nightly DB Backup
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Dump + encrypt + upload
        env:
          DATABASE_URL: ${{ secrets.DB_BACKUP_READONLY_URL }}
          GPG_PASSPHRASE: ${{ secrets.BACKUP_GPG_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
        run: |
          FILENAME="backup-$(date +%Y%m%d-%H%M%S).dump.gz.gpg"
          pg_dump $DATABASE_URL -Fc \
            | gzip \
            | gpg --batch --yes --passphrase "$GPG_PASSPHRASE" \
                  --symmetric --cipher-algo AES256 \
            | aws s3 cp - "s3://backups/$FILENAME" \
                  --endpoint-url "$R2_ENDPOINT"
```

- `pg_dump` verzia musí zodpovedať Supabase PostgreSQL verzii (konzistentnosť pri restore).
- Backup manifest: `{ "filename": "...", "sha256": "...", "run_at": "...", "pg_version": "15.x", "size_bytes": 12345 }`.
- Read-only role: `CREATE ROLE backup_reader LOGIN PASSWORD '...' IN ROLE pg_read_all_data;`.

---

## Edge Cases

- Zálohovací job zlyhal 3× po sebe: eskalačný email na primárny ops kontakt + zálohovací sekundárny kontakt.
- Supabase plánovaná údržba koliduje s backup oknom: job deteguje connection error, odloží sa o 30 minút (retry s exponential backoff, max 3h okno).
- Cloudflare R2 je dočasne nedostupný: fallback upload na sekundárny S3 bucket (environment variable `BACKUP_FALLBACK_S3_URL`).

---

## Závislosti

- Závisí na: Supabase Pro plan (PITR), GitHub Actions alebo Cloudflare Workers cron
- Blokuje: US-181 (obnova zo zálohy – závisí na existencii zálohy podľa tejto story)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Zálohovací job spustený manuálne a overená integrita prvej zálohy
- [ ] GPG kľúč bezpečne uložený v GitHub Secrets (nie v repo)
- [ ] Retenčná lifecycle policy nakonfigurovaná na R2/S3 buckete
- [ ] Notifikácia pri zlyhaní otestovaná (simulate job failure)
- [ ] Runbook pre zálohovanie zdokumentovaný v `DEPLOYMENT.md`
- [ ] Code review schválený

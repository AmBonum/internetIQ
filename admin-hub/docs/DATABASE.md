# DATABASE — Supabase schéma a mapovanie z mock dát

Tento dokument popisuje **cieľovú Postgres/Supabase schému** pre SubenAI a ako mapovať mock dáta z MVP na reálne tabuľky.

> Všetky typy v MVP sú definované v `src/lib/platform/types.ts` (user app) a `src/lib/admin-mock-data.ts` (admin entities). Field naming je **už snake_case** a kompatibilné.

---

## 1. Tabuľky — kompletný zoznam

### Identita a tímy
| Tabuľka | Zdroj v MVP | Kľúčové stĺpce |
|---|---|---|
| `profiles` | `User` (platform) + `AdminUser` (admin) | `id (uuid, FK auth.users)`, `email`, `display_name`, `avatar_initials`, `created_at` |
| `user_roles` | `AdminUser.role` | `id`, `user_id`, `role app_role`, `unique(user_id, role)` |
| `teams` | `Team` | `id`, `name`, `owner_id`, `created_at` |
| `team_members` | `TeamMember` | `id`, `team_id`, `user_id`, `role` (owner/editor/viewer), `joined_at` |

> **CRITICAL**: Role NIKDY neukladať na `profiles`! Vždy separátna `user_roles` tabuľka + `has_role(uuid, app_role)` SECURITY DEFINER funkcia (viď [user-roles section v INTEGRATION.md](./INTEGRATION.md#user-roles)).

### Obsah (otázky, sady, testy)
| Tabuľka | Zdroj v MVP | Kľúčové stĺpce |
|---|---|---|
| `categories` | `AdminCategory` / `BRANCHES` | `id`, `name`, `slug (unique)`, `color`, `description` |
| `topics` | `AdminTopic` / `TRAINING_TOPICS` | `id`, `name`, `slug`, `color`, `description` |
| `answer_sets` | `AdminAnswerSet` | `id`, `name`, `description`, `branch_slugs text[]`, `created_at`, `updated_at`, `author_id` |
| `answers` | `AdminAnswer` | `id`, `set_id (FK)`, `text`, `is_correct bool`, `explanation`, `position int` |
| `questions` | `AdminQuestion` + `Question` | `id`, `type question_type`, `prompt`, `options jsonb`, `matrix_rows jsonb`, `matrix_cols jsonb`, `correct jsonb`, `category_id`, `branch_slug`, `difficulty`, `author_id`, `status question_status`, `answer_set_id` nullable, `created_at` |
| `tests` | `Test` + `AdminTest` | `id`, `slug (unique)`, `share_id (unique)`, `owner_id`, `team_id` null, `title`, `description`, `status test_status`, `version int`, `password_hash` null, `segmentation text[]`, `gdpr_purpose gdpr_purpose`, `intake_fields jsonb`, `branches jsonb`, `notif_config jsonb`, `anonymize_after_days int` null, `allow_behavioral_tracking bool`, `expires_at`, `published_at`, `created_at`, `updated_at` |
| `test_questions` | `Test.question_ids[]` | join: `test_id`, `question_id`, `position int`, PK(`test_id`,`question_id`) |
| `test_versions` | `TestVersion` | `id`, `test_id`, `version`, `snapshot jsonb`, `published_at`, `published_by`, `changelog` |
| `templates` | `Template` | `id`, `title`, `description`, `question_ids uuid[]`, `gdpr_purpose` |
| `trainings` | `AdminTraining` | `id`, `title`, `description`, `topic_slug`, `status training_status`, `content jsonb`, `created_at` |

### Respondenti a sessions
| Tabuľka | Zdroj v MVP | Kľúčové stĺpce |
|---|---|---|
| `respondents` | `Respondent` | `id`, `email` null, `display_name` null, `anonymized_at`, `created_at` |
| `sessions` | `Session` | `id`, `test_id`, `version`, `respondent_id`, `intake_data jsonb`, `consent_given bool`, `started_at`, `finished_at`, `score numeric(5,2)`, `status session_status`, `segment`, `ip_hash` |
| `session_answers` | `SessionAnswer` | `session_id`, `question_id`, `value text`, `is_correct bool`, `time_ms int` |
| `behavioral_events` | `BehavioralEvent` | `id`, `session_id`, `type`, `payload jsonb`, `at timestamptz` |
| `respondent_groups` | `RespondentGroup` | `id`, `name`, `description`, `owner_id`, `member_emails text[]`, `tags text[]`, `created_at`, `updated_at` |
| `group_assignments` | `GroupAssignment` | `id`, `test_id`, `group_id`, `assigned_by`, `assigned_at`, `invited_count int` |

### Notifikácie, audit, GDPR
| Tabuľka | Zdroj v MVP | Kľúčové stĺpce |
|---|---|---|
| `notifications` | `Notification` | `id`, `user_id`, `event_type`, `test_id`, `title`, `body`, `read_at`, `created_at` |
| `audit_log` | `AuditLogEntry` | `id`, `actor_id`, `actor_name`, `action text`, `target_type`, `target_id`, `pii_access bool`, `details`, `at` |
| `dsr_requests` | `DSRRequest` | `id`, `requester_email`, `type` (access/erase/portability), `status`, `note`, `created_at`, `sla_due_at`, `resolved_at` |
| `reports` | `AdminReport` | `id`, `target_type`, `target_id`, `reason report_reason`, `status report_status`, `note`, `reporter_id`, `created_at` |

### CMS (verejný web)
| Tabuľka | Zdroj v MVP | Kľúčové stĺpce |
|---|---|---|
| `cms_pages` | `cms-store.ts` | `id`, `slug (unique)`, `title`, `seo_title`, `seo_description`, `blocks jsonb`, `status`, `published_at` |
| `cms_header` | `cms-store.ts` | singleton row: `logo`, `nav jsonb` |
| `cms_footer` | `cms-store.ts` | singleton row: `columns jsonb`, `socials jsonb`, `legal jsonb` |
| `cms_navigation` | `cms-store.ts` | singleton: `items jsonb` (ordered) |
| `share_card_config` | `defaultShareCard` | singleton: `tiers jsonb`, `gradient`, `branding jsonb` |
| `quick_test_config` | `mockQuickTest` | singleton row: parametre rýchleho testu |
| `support_config` | `support-config.ts` | singleton: `email`, `hours`, `enabled` |

### Globálne settings
| Tabuľka | Zdroj v MVP | Kľúčové stĺpce |
|---|---|---|
| `app_settings` | `/admin/settings` (zatiaľ hardcoded) | key-value: `key text PK`, `value jsonb`, `updated_at`, `updated_by` |

---

## 2. Postgres enumy

```sql
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.test_status as enum ('draft', 'published', 'archived');
create type public.question_type as enum (
  'single','multi','scale_1_5','scale_1_10','nps','matrix','ranking',
  'slider','short_text','long_text','date','time','file_upload',
  'image_choice','yes_no'
);
create type public.question_status as enum ('draft','approved','deprecated','pending','flagged','published','archived');
create type public.gdpr_purpose as enum ('marketing','research','recruitment','education','internal_training');
create type public.session_status as enum ('in_progress','completed','abandoned');
create type public.training_status as enum ('published','draft','archived');
create type public.report_reason as enum ('spam','inappropriate','harassment','misinformation','other');
create type public.report_status as enum ('open','reviewing','resolved','dismissed');
create type public.team_role as enum ('owner','editor','viewer');
create type public.dsr_type as enum ('access','erase','portability');
create type public.dsr_status as enum ('open','in_progress','completed','rejected');
```

---

## 3. RLS — vzorové politiky

**Pravidlo**: každá user-data tabuľka má `enable row level security`. Politiky používajú `has_role()` SECURITY DEFINER funkciu (viď `INTEGRATION.md`).

```sql
-- profiles: každý vidí svoj, admin vidí všetkých
create policy "users read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

-- tests: owner alebo team member číta; admin všetko
create policy "owner reads tests"
  on public.tests for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (select 1 from public.team_members tm where tm.team_id = tests.team_id and tm.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

create policy "owner writes tests"
  on public.tests for all to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- sessions: respondent flow je verejný read pre validation cez share_id
-- → použiť server function s supabaseAdmin (BYPASS RLS) a vrátiť len bezpečné stĺpce
-- NEDÁVAŤ broad anon policy na sessions ani na respondents!

-- audit_log: read len admin
create policy "admin reads audit"
  on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- insert audit zo serverFn s service-role → cez supabaseAdmin (žiadna RLS)
```

---

## 4. Indexy (odporúčané)

```sql
create index on public.tests (owner_id);
create index on public.tests (share_id);
create index on public.tests (slug);
create index on public.sessions (test_id, status);
create index on public.sessions (respondent_id);
create index on public.session_answers (session_id);
create index on public.questions (category_id, branch_slug);
create index on public.notifications (user_id, read_at);
create index on public.audit_log (actor_id, at desc);
create index on public.audit_log (target_type, target_id);
```

---

## 5. Cron joby

```sql
-- Anonymizácia po N dňoch (test.anonymize_after_days)
select cron.schedule('anonymize-sessions', '0 3 * * *', $$
  update public.sessions s
     set respondent_id = null
    from public.tests t
   where s.test_id = t.id
     and t.anonymize_after_days is not null
     and s.finished_at < now() - (t.anonymize_after_days || ' days')::interval
     and s.respondent_id is not null;
$$);

-- DSR SLA notifikácia (72h)
-- → cron + pg_notify alebo cron volajúci /api/public/dsr/sla-check endpoint
```

---

## 6. Seeding z MVP mock dát

Viď `DATA.md` §3. Kroky:
1. Export mock arrays do JSON (`bun run scripts/export-seed.ts`)
2. Migrácia vytvorí tabuľky a enumy
3. `supabase db seed` alebo `psql -f seed/*.sql` vloží dáta
4. ID-čká nechať ako TEXT alebo skonvertovať na UUID (mapping table na čas migrácie)

---

Viď ďalej **INTEGRATION.md** — krok-za-krokom ako toto namountovať do existujúceho subenai.sk projektu.

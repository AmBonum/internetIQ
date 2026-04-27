# E11 — Transactional email runbook (Resend)

Operational reference for [`functions/_lib/email.ts`](../functions/_lib/email.ts)
and the templates in [`functions/_lib/email-templates.ts`](../functions/_lib/email-templates.ts).

## What we send (and from where)

| Trigger | Template | Recipient | Endpoint |
|---|---|---|---|
| Sponsor requests Customer Portal access | `magicLinkPortalEmail` | sponsor | `functions/api/portal-magic-link.ts` |
| Stripe `charge.refunded` event arrives | `refundAlertEmail` | `OPS_EMAIL` | `functions/api/stripe-webhook.ts` |

Stripe handles its own emails (payment receipts, invoice PDFs, subscription
renewal notifications) — we do **not** duplicate those.

## Required env vars

| Name | Type | Source |
|---|---|---|
| `RESEND_API_KEY` | Secret | https://resend.com → API Keys → Create (start with `re_`) |
| `EMAIL_FROM` | Plaintext | `subenai <noreply@lvtesting.eu>` |
| `EMAIL_REPLY_TO` | Plaintext | `segnities@gmail.com` (or future shared inbox) |
| `OPS_EMAIL` | Plaintext | `segnities@gmail.com` (refund alerts) |

Local dev: `.dev.vars`. Production: CF Pages → Settings → Environment variables → Production.

If `RESEND_API_KEY` contains `replace_me`, both email senders are no-ops:
the magic-link endpoint returns 500 with `email_not_configured`, the refund
alert silently skips (donation row still lands in DB; you'll see the refund
in the Stripe dashboard regardless).

## DNS setup for `lvtesting.eu` (one-time)

Add these to Cloudflare DNS:

| Type | Name | Value |
|---|---|---|
| TXT | `resend._domainkey.lvtesting.eu` | (long DKIM record from Resend dashboard) |
| TXT | `lvtesting.eu` (root SPF) | `v=spf1 include:resend.com -all` (merge if SPF exists) |
| TXT | `_dmarc.lvtesting.eu` | `v=DMARC1; p=quarantine; rua=mailto:segnities@gmail.com` |

Verify via https://www.mail-tester.com/ — target score ≥ 9/10.

## Resend account setup

1. Sign up at https://resend.com (free tier: 3 000 emails/month, 100/day)
2. Add domain `lvtesting.eu` → copy the DKIM TXT records → paste into Cloudflare DNS
3. Wait ~5 min → click "Verify" in Resend dashboard
4. Create API key (Full access) → store as `RESEND_API_KEY`

## Local sanity check

```bash
# Term 1: rebuild + run wrangler pages dev
rm -rf dist .wrangler && npm run build && npx wrangler pages dev dist/client \
  --compatibility-date=2025-09-24 --compatibility-flag=nodejs_compat

# Term 2: hit the magic link endpoint
curl -X POST http://localhost:8788/api/portal-magic-link \
  -H "content-type: application/json" \
  -d '{"email":"test@subenai.test"}'
# → {"ok":true,"message":"Ak existuje podpora pre tento e-mail, …"}
```

Watch Term 1 logs:
- `portal-magic-link customer lookup` — Stripe API error (rare)
- `portal-magic-link portal create` — Stripe billing portal create error
- `portal-magic-link send failed` — Resend API rejected (check key + domain verification)

## Bounced emails

Resend dashboard → Logs tab. Filter by recipient. Common reasons:
- Recipient inbox full → retry next day
- Hard bounce (invalid address) → mark in Stripe customer notes; don't keep retrying
- Spam-rejected (rare since DKIM+SPF+DMARC) → re-test mail-tester.com score

## Anti-enumeration guarantee

`/api/portal-magic-link` returns the **same** 200 response and message
whether or not the e-mail is in our system. The only differing artifact is
the actual email landing in the recipient's inbox (which the requester
can't observe from the response). Verified by `tests/routes/spravovat-podporu.test.tsx`.

## Where to add new templates

1. Add a new function in `functions/_lib/email-templates.ts` that returns
   `{ subject, html, text }` and reuses the `wrap()` HTML scaffold.
2. Call `sendEmail` from the relevant function/handler with an
   `idempotencyKey` derived from the trigger event ID (so Resend dedupes
   on retry).
3. Add a unit test mocking the Resend `fetch` call.

## When to bump CONSENT_VERSION

If you add a new processor (e.g., switch to AWS SES), update
[`src/routes/cookies.tsx`](../src/routes/cookies.tsx) and
[`src/routes/privacy.tsx`](../src/routes/privacy.tsx) data-processors list,
then bump [`src/lib/consent.ts`](../src/lib/consent.ts) `CONSENT_VERSION`
patch (e.g. 1.2.x → 1.2.x+1) so the banner re-prompts.

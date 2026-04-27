# E10 — Stripe webhook runbook

Operational reference for [`functions/api/stripe-webhook.ts`](../functions/api/stripe-webhook.ts).
Read this when debugging a failed webhook, manually replaying an event, or
rotating secrets.

## Endpoint

- **URL (prod)**: `https://subenai.lvtesting.eu/api/stripe-webhook`
- **URL (local dev)**: `http://localhost:8788/api/stripe-webhook` (via
  `wrangler pages dev` — Vite alone does NOT serve `functions/`)
- **Method**: `POST` only
- **Auth**: `Stripe-Signature` header verified against `STRIPE_WEBHOOK_SECRET`

## Required env vars

Set in Cloudflare Pages dashboard → Settings → Environment variables →
**Production** (and Preview if needed):

| Name | Type | Source |
|---|---|---|
| `STRIPE_SECRET_KEY` | Secret | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe Dashboard → Developers → Webhooks → endpoint → Signing secret |
| `SUPABASE_URL` | Plaintext | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase Dashboard → Project Settings → API → `service_role` key |

For local dev copy `.dev.vars.example` → `.dev.vars` (gitignored) and fill
in the test-mode values.

## Subscribed Stripe events

The endpoint must be configured to receive at least these event types
(Stripe Dashboard → Developers → Webhooks → Add endpoint):

- `checkout.session.completed` — one-off donations and the bootstrap of
  monthly subscriptions
- `invoice.paid` — every monthly subscription invoice
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`

Any other event type returns `200 { received: true, ignored: <type> }`
to keep Stripe's delivery log clean.

## Response codes

| Code | Meaning | Stripe behaviour |
|---|---|---|
| 200 | Processed (or idempotent duplicate) | Marks delivery successful |
| 400 | Signature missing/invalid OR AML limit exceeded OR malformed payload | Marks delivery failed; **no automatic retry** for signature errors |
| 500 | Unexpected internal error during DB write | Stripe retries with exponential backoff up to ~3 days |

Idempotency: if a `donations.stripe_payment_intent_id` UNIQUE constraint
fires (`23505`), the handler swallows the error and returns 200 — so
Stripe's retries after a transient timeout never produce a duplicate
donation.

## Local end-to-end flow

```bash
# Terminal 1 — run the SPA + functions locally
npm run build && npx wrangler pages dev dist/client \
  --compatibility-date=2025-09-24 \
  --compatibility-flag=nodejs_compat

# Terminal 2 — forward live Stripe events to the local endpoint
stripe listen --forward-to http://localhost:8788/api/stripe-webhook
# Copy the printed `whsec_...` into .dev.vars as STRIPE_WEBHOOK_SECRET

# Terminal 3 — trigger a test event
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger charge.refunded
```

The handler logs every event to CF Functions logs:

```json
{"level":"log","message":"stripe-webhook","id":"evt_...","type":"...","status":200,"livemode":false}
```

## Manual replay (production)

If a delivery failed and you've fixed the cause:

1. Stripe Dashboard → Developers → Webhooks → endpoint → "Events" tab
2. Find the failed event → "Resend"
3. Confirm in Cloudflare → Workers & Pages → project → Functions → Logs
   that the new attempt logged `status: 200`
4. Confirm in Supabase → Table Editor → `donations` (or `subscriptions`)
   that the row landed

## Rotating `STRIPE_WEBHOOK_SECRET`

1. Stripe Dashboard → Webhooks → endpoint → "Roll signing secret"
2. Stripe shows the **new** secret once. Update CF Pages env var
   immediately and redeploy (Pages → Deployments → Retry latest).
3. There is **no overlap window** — events delivered between Stripe
   issuing the new secret and CF picking up the new env will fail
   verification. Plan rotation for low-traffic windows or prepare to
   manually replay any failed events.

## AML hard limit

`MAX_AML_AMOUNT_EUR = 500` (per zákon č. 297/2008 Z. z. § 10). If a
checkout/invoice arrives over the limit, the handler returns 400 and
Stripe automatically refunds the customer within 5–7 business days.

To raise the limit (if obrat ever justifies KYC integration), update the
constant in both [`functions/api/stripe-webhook.ts`](../functions/api/stripe-webhook.ts)
and the `/podpora` UI cap in E11.1.

## Sister endpoint — `/api/create-checkout-session`

[`functions/api/create-checkout-session.ts`](../functions/api/create-checkout-session.ts) is
the public POST endpoint backing the `/podpora` form (E11.1). It validates the
form payload, creates (or reuses by e-mail) a Stripe Customer, and creates an
hosted Checkout Session with inline `price_data` (no Dashboard Products needed).
Sponsor display preferences (`display_name`, `display_link`, `display_message`,
`show_in_footer`) are stamped into `session.metadata` so the webhook can apply
them to the `sponsors` row when `checkout.session.completed` fires.

Env vars: only `STRIPE_SECRET_KEY` (no Supabase access — all DB writes happen
in the webhook on payment confirmation).

## Refund alerting (TODO when E11.8 ships)

`charge.refunded` currently logs a `console.warn` with the original PI
and refunded amount. Once E11.8 lands the email infra, wire this handler
to dispatch an OPS notification per AC-10 (subject: "Refund {amount} EUR
— Sponsor {id} — pôvodný PI {pi}").

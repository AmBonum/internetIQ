# E10 — Stripe webhook runbook

Operational reference for [`functions/api/stripe-webhook.ts`](../functions/api/stripe-webhook.ts).
Read this when debugging a failed webhook, manually replaying an event, or
rotating secrets.

## Endpoint

- **URL (prod)**: `https://subenai.sk/api/stripe-webhook`
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
| `EXPECTED_LIVEMODE` | Plaintext | `"true"` in Production (rejects test-mode events), `"false"` in Preview/local (rejects live-mode events). Unset = no enforcement (legacy permissive default). |

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

### One-shot launcher (recommended)

```bash
# Terminal 1 — boots wrangler + stripe listen and auto-writes the
# rotating whsec_ into .dev.vars before starting the listener.
npm run dev:stripe

# Terminal 2 — trigger sample events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger charge.refunded
```

### Manual two-terminal fallback

```bash
# Terminal 1 — run the SPA + functions locally
npm run build && npx wrangler pages dev dist/client \
  --compatibility-date=2025-09-24 \
  --compatibility-flag=nodejs_compat

# Terminal 2 — forward live Stripe events to the local endpoint
stripe listen --forward-to http://localhost:8788/api/stripe-webhook
# Copy the printed `whsec_...` into .dev.vars as STRIPE_WEBHOOK_SECRET
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

## Automated test coverage

Three layers, each covering a different failure mode:

| Layer | Where | What it proves | How to run |
|---|---|---|---|
| Unit | [`tests/functions/stripe-webhook.test.ts`](../tests/functions/stripe-webhook.test.ts) | Every event-type handler branch + signature verification + livemode guard against a mocked Supabase | `npm test` |
| Browser smoke | [`e2e/specs/sponsorship/podpora-redirect.spec.ts`](../e2e/specs/sponsorship/podpora-redirect.spec.ts) | `/podpora` form submit hits `/api/create-checkout-session` and the browser is redirected to a `cs_test_…` hosted Stripe page | Requires `npm run dev:stripe` running, then `STRIPE_E2E_BASE_URL=http://localhost:8788 npx playwright test e2e/specs/sponsorship/` |
| Webhook integration | [`e2e/integration/webhooks/webhook-events.spec.ts`](../e2e/integration/webhooks/webhook-events.spec.ts) | Signed event → wrangler → real Supabase write (proves the unit-test mock matches reality: HTTP framing, signature header, RLS-bypass, FK constraints) | Requires `npm run dev:stripe` running, then `STRIPE_E2E_BASE_URL=http://localhost:8788 npx playwright test --project=integration e2e/integration/webhooks/` |

The Stripe-hosted Checkout UI itself is **not** automated — Stripe A/B
tests that page and any DOM-level test would be flaky. It is covered by
the manual smoke checklist below, which is the gate before every prod
swap.

## Manual full-flow smoke (do this before flipping live keys)

Goal: prove the entire support path works against TEST Stripe + DEV
Supabase before swapping CF Pages production env to live keys.

1. **Set up dev env once**
   - `cp .dev.vars.example .dev.vars` and fill in: `STRIPE_SECRET_KEY=sk_test_…`, `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for a **DEV** Supabase project (NOT prod), `EXPECTED_LIVEMODE=false`.
   - `stripe login` — authorise the CLI once.
2. **Boot the stack**: `npm run dev:stripe` (single command, leaves both processes running).
3. **Run automated checks first** (catches breakage before manual UI):
   - `npm test` — all unit tests including livemode guard.
   - `STRIPE_E2E_BASE_URL=http://localhost:8788 npx playwright test --project=integration e2e/integration/webhooks/` — wiring + DB integration.
   - `STRIPE_E2E_BASE_URL=http://localhost:8788 npx playwright test e2e/specs/sponsorship/` — browser redirect smoke.
4. **Manual UI walkthrough** (the only step Stripe docs say must be human-tested):
   - Open `http://localhost:8788/podpora`.
   - Fill: amount 5 €, e-mail `smoke@subenai-dev.local`, name `Smoke Test`, both consents.
   - Submit → land on `checkout.stripe.com/c/pay/cs_test_…`.
   - Card: `4242 4242 4242 4242`, expiry `12 / 34`, CVC `123`, postal `90210`.
   - Pay → land on `/podakovanie/{cs_test_…}` (success page).
5. **Verify the resulting state**:
   - In `stripe listen` terminal: see `checkout.session.completed -> 200`.
   - In Supabase DEV → `donations`: new row with `amount_eur=5.00`, `kind=oneoff`.
   - In Supabase DEV → `sponsors`: row with the e-mail's customer id, `display_name=NULL` (we didn't opt into the list).
6. **Clean up dev data**: `delete from donations where sponsor_id in (select id from sponsors where stripe_customer_id like 'cus_test_%')` then the parallel `delete from sponsors`. (Or skip if dev DB is disposable.)

If every step passes, the codebase is ready for the production swap below.

## Production go-live checklist (test → live keys swap)

Order matters — do it in this exact sequence to avoid a window where the
endpoint exists but rejects events.

1. **Stripe dashboard — create LIVE webhook endpoint**
   - Toggle **Test mode OFF** (top-left).
   - Developers → Webhooks → **Add endpoint**.
   - URL: `https://subenai.sk/api/stripe-webhook`.
   - Events: subscribe to all six listed in "Subscribed Stripe events" above.
   - Copy the **Signing secret** (`whsec_…`) — this is the **LIVE** secret.
2. **Stripe dashboard — copy LIVE API key**
   - Still in Live mode: Developers → API keys → **Reveal live key**.
   - Copy `sk_live_…`.
3. **Cloudflare Pages — rotate production env vars** (Settings → Environment variables → Production):
   - `STRIPE_SECRET_KEY` → paste `sk_live_…` (mark as Secret).
   - `STRIPE_WEBHOOK_SECRET` → paste the LIVE `whsec_…` from step 1.
   - `EXPECTED_LIVEMODE` → `true` (plaintext). **This is the new guard** — it makes the webhook reject any stray test event that hits the endpoint.
   - Sanity-check the existing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` point at the prod project (not the dev project from the smoke run).
4. **Redeploy**: CF Pages → Deployments → latest → **Retry deployment**. Env-var changes apply only on rebuild.
5. **Smoke with €1 real card**:
   - Open `https://subenai.sk/podpora`.
   - Pay 5 € (minimum allowed by E11.1) with a real card you control.
   - Verify in:
     - Stripe Live dashboard: payment appears with `livemode: true`.
     - Cloudflare Pages → Functions → Logs: `stripe-webhook` log line with `livemode: true`, `status: 200`.
     - Supabase production → `donations`: row with `amount_eur=5.00`, `kind=oneoff`, the live `pi_*` id.
6. **Refund the smoke payment** (Stripe Live dashboard → that payment → Refund). The `charge.refunded` event should arrive, log a `console.warn`, and insert a negative-amount row in `donations` linked via `refund_of_donation_id`.
7. **Disable or delete the TEST webhook endpoint** (Stripe Test mode → Webhooks → old endpoint → Delete). The webhook server-side guard from step 3 already rejects test events, but removing the configured forward is cleaner.

If any step fails, **revert step 3 env vars to the previous test-mode values** and redeploy. No customer-facing impact — Stripe queues retries for failed webhooks for ~3 days, so they'll re-deliver once the env is correct again.

## Refund alerting (TODO when E11.8 ships)

`charge.refunded` currently logs a `console.warn` with the original PI
and refunded amount. Once E11.8 lands the email infra, wire this handler
to dispatch an OPS notification per AC-10 (subject: "Refund {amount} EUR
— Sponsor {id} — pôvodný PI {pi}").

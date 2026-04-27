# E11 — Sponsorship operations runbook

Single source of truth for handling refunds, cancellations, GDPR erasure
requests, AML alerts, chargebacks, and email-delivery failures in the
sponsorship flow.

> **Read first:** [`E10-webhook-runbook.md`](./E10-webhook-runbook.md) for
> Stripe webhook details, [`E11-email-runbook.md`](./E11-email-runbook.md)
> for transactional email infra.

Audience: konateľ + účtovník. Step-by-step, no improvisation.

---

## 1. Refund flow

### When a full refund is OK

- **Within 14 days, no actual service provided** — strictly speaking the
  consent checkbox at `/podpora` waives § 7 ods. 6 zákona č. 102/2014
  withdrawal right, but a full refund is fair if the donor genuinely
  hasn't received any benefit (e.g. duplicate payment, wrong amount typed).
- **Stripe-initiated dispute won** — refund the disputed amount
  proactively to avoid future chargebacks from the same card.
- **Compliance request from Stripe / bank** — always refund.

### When a partial refund is OK

- **Donor over-paid** (e.g. typed `100` instead of `10`) — refund the
  excess, keep the intended amount.

### When NOT to refund

- **Subscription past first month** — past invoices are kept, donor
  cancels going forward via Customer Portal (built-in path).
- **Donor "didn't like the project"** — politely decline (their consent
  at checkout per § 7 ods. 6 was explicit).

### Step-by-step (Stripe Dashboard)

1. **Stripe Dashboard → Payments** → search by amount, date, or e-mail
2. Click the row → top-right **"Refund"** button
3. Choose **Full** or **Partial** + amount
4. **Reason** dropdown — pick the closest match (defaults to "duplicate"
   for typo cases, "requested_by_customer" otherwise)
5. **Statement descriptor** — leave default ("REFUND SUBENAI")
6. Submit

**What happens automatically after refund:**
- Stripe fires `charge.refunded` webhook → our handler
  ([`functions/api/stripe-webhook.ts:handleChargeRefunded`](../functions/api/stripe-webhook.ts))
  inserts a negative-amount `donations` row + the `donations_update_sponsor_total`
  trigger decrements `sponsors.total_eur`
- If `RESEND_API_KEY` is configured, an alert e-mail lands in `OPS_EMAIL`
  with the original PI ID (per E10.3 AC-10)
- The `footer_sponsors` view re-evaluates the sponsor's tier — if the new
  `total_eur` falls below the 50 € threshold, their footer mention disappears
  on next page render. **No manual action needed.**

### Manual checks after refund

- [ ] Open **Supabase → Table Editor → `donations`** and verify the
      negative row landed (kind=`refund`, `refund_of_donation_id` set)
- [ ] Check `sponsors.total_eur` reflects the decrement
- [ ] If the sponsor was on `/sponzori` with `display_message` mentioning
      a specific donation amount, ask them whether they want it edited

---

## 2. Subscription cancellation manual follow-up

When a sponsor cancels via Stripe Customer Portal:
1. Stripe fires `customer.subscription.deleted` → webhook updates
   `subscriptions.cancelled_at` (E10.3)
2. **No further automated action.** The next monthly invoice never fires.

### Manual checks after cancellation

- [ ] If the sponsor relied on monthly tier for footer mention
      (`monthly_eur ≥ 25 €`), the `footer_sponsors` view drops them
      automatically on next render
- [ ] If sponsor still has cumulative one-off donations ≥ 50 €, footer
      mention is preserved (different tier criterion)
- [ ] Send the goodbye e-mail (template **§G1** below)

---

## 3. DB cleanup edge cases

**Most cases are handled by triggers.** The few manual operations:

### Stripe re-issued an invoice PDF (URL changed)

```sql
UPDATE public.donations
SET invoice_pdf_url = '<new_url>'
WHERE stripe_payment_intent_id = '<pi_xxx>';
```

### Manually adjust `sponsor.total_eur` after a non-Stripe refund

(rare — only when refunding via bank transfer outside Stripe)

```sql
UPDATE public.sponsors
SET total_eur = (
  SELECT COALESCE(SUM(amount_eur), 0)
  FROM public.donations
  WHERE sponsor_id = public.sponsors.id
)
WHERE stripe_customer_id = '<cus_xxx>';
```

### NEVER

- `DELETE FROM donations` — breaks 10-year retention per zákon č.
  431/2002 Z. z.
- `DROP CONSTRAINT donations_sponsor_id_fkey ON DELETE RESTRICT` — see
  decision in `tasks/E10-sponsorship-decisions.md`

---

## 4. AML alert

### Automatic enforcement

`functions/api/stripe-webhook.ts` has `MAX_AML_AMOUNT_EUR = 500`. The
handler returns **400** when a single `checkout.session.completed` or
`invoice.paid` exceeds the cap. Stripe automatically refunds the donor
within ~5–7 business days.

Same cap is enforced again client-side (in [`/podpora`](../src/routes/podpora.tsx))
and server-side (in [`functions/api/create-checkout-session.ts`](../functions/api/create-checkout-session.ts))
— belt and suspenders.

### When the cap fires

1. Donor sees Stripe Checkout error: "We're sorry, this payment exceeds
   our daily limit." (Stripe-translated for SK)
2. Their card is **never charged** (Stripe holds the auth, releases it
   when refund processes)
3. **No manual action needed** unless they e-mail asking why

### If a > 500 € transaction somehow lands in DB

(should be impossible given three layers, but defensive procedure):

1. **Stripe Dashboard → Payments** → find the PI → **Refund** (full)
2. **Manually delete the `donations` row** that holds the excess via
   Supabase SQL editor (this is the *one* time `DELETE` from `donations`
   is OK — per audit trail you'll re-create with a corrected amount if
   the donor wants to re-donate at the legal limit)
3. **File a STR (Suspicious Transaction Report)** to Finančná spravodajská
   jednotka NAKA per § 17 zákona č. 297/2008 Z. z. — only if there is
   any suspicion of money laundering, otherwise skip

---

## 5. GDPR Art. 17 erasure request

**The hard truth:** we cannot fully delete a sponsor record because of
**§ 35 zákona č. 431/2002 Z. z. o účtovníctve** — accounting records
must be retained for **10 years**. Donation rows stay, sponsor row stays
linked. What we CAN do is anonymize the public-facing fields.

### Step-by-step

1. Sponsor e-mails `subenai.podpora@gmail.com` requesting erasure
2. **Reply within 30 days** per čl. 12 ods. 3 GDPR (template **§G2**)
3. Anonymize their public fields:

```sql
UPDATE public.sponsors
SET display_name = NULL,
    display_link = NULL,
    display_message = NULL,
    show_in_footer = false
WHERE stripe_customer_id = '<cus_xxx>';
```

4. Confirm to sponsor via e-mail — explain the 10-year retention applies
   to the underlying accounting record but they are no longer publicly
   identifiable on `/sponzori` or in the footer

### What gets removed automatically after step 3

- Their card on `/sponzori` (because `public_sponsors` view filters
  `WHERE display_name IS NOT NULL`)
- Their footer mention (because `footer_sponsors` view filters
  `WHERE display_name IS NOT NULL`)

### What stays (compliant per Slovak law)

- `donations` rows — for accounting audit
- `subscriptions` rows (if any) — for accounting audit
- `sponsors.stripe_customer_id` — needed to reconcile with Stripe records
- Stripe's own customer + invoice records — Stripe is independent
  controller for invoicing per čl. 13 ods. 1 písm. e GDPR

---

## 6. Stripe dispute / chargeback

A chargeback means the cardholder's bank reversed a payment. Stripe
charges a 15 € dispute fee even if we win.

### Step-by-step

1. **Stripe e-mails you immediately** when a dispute opens
2. **Stripe Dashboard → Disputes** → click the dispute → review the reason code
3. Decide:
   - **Accept** — refund + skip evidence (cheapest if the donor genuinely
     wants their money back; you keep the 15 € fee but skip wasted time)
   - **Counter** — submit evidence:
     - Stripe Checkout Session record showing donor consented to immediate
       service per § 7 ods. 6 zákona č. 102/2014 (Stripe captures this
       via our `custom_text.submit.message`)
     - Confirmation e-mail Stripe sent at completion
     - IP address + timestamp from CF Pages logs
     - Privacy policy version active at time of donation
4. **Submit within Stripe's deadline** (usually 7–21 days)

### Counter-evidence ready-made wording

> Donor used `/podpora` form, ticked the explicit consent checkbox per
> § 7 ods. 6 zákona č. 102/2014 Z. z. o ochrane spotrebiteľa pri
> predaji tovaru alebo poskytovaní služieb na základe zmluvy uzavretej
> na diaľku, acknowledging immediate service delivery and waiver of
> the 14-day withdrawal right. Service was delivered (donation accepted,
> invoice issued via Stripe Invoicing on YYYY-MM-DD).

---

## 7. E-mail delivery failure

### Magic link e-mail not delivered (Customer Portal access)

1. Sponsor e-mails saying "I requested the link, didn't get it"
2. Open Resend Dashboard → Logs → filter by recipient e-mail
3. Common causes:
   - **Bounced** (invalid address) — ask sponsor to recheck the e-mail
   - **Marked as spam** — manually create a Stripe Customer Portal
     session via Dashboard, copy the URL, send via direct e-mail from
     `subenai.podpora@gmail.com`:
     ```
     Stripe Dashboard → Customers → search by e-mail → click → top-right
     "Open customer portal" → copy URL → paste into manual e-mail
     ```
   - **Greylist** (gmail being slow) — ask sponsor to wait 15 min, retry

### Refund alert e-mail not delivered

Lower-priority — the negative `donations` row is in the DB and the
Stripe Dashboard already shows the refund. Manual review:
1. Open Resend Dashboard → confirm send was attempted
2. If failed, just open Stripe Dashboard → Payments → filter "Refunded"
   to see the same data

---

## 8. E-mail templates (Slovak, copy-paste ready)

> Send from `subenai.podpora@gmail.com`. Keep it brief, dignified, no
> marketing flourish.

### §R1 — Refund granted (full)

```
Predmet: Refund tvojho príspevku — subenai

Ahoj,

vrátili sme ti plnú sumu {AMOUNT} € z tvojej platby z {DATE}. Refund
zvyčajne dorazí na kartu do 5–7 pracovných dní, podľa rýchlosti banky.

Stripe ti pošle potvrdzovací e-mail s dátumom pripísania.

Ak si len chcel/a zmeniť sumu alebo formu (jednorazová ↔ mesačná),
kedykoľvek sa vráť na https://subenai.lvtesting.eu/podpora.

Ďakujem za záujem o projekt.

— Ľubomír Volčko
   am.bonum s. r. o. (IČO 55 055 290)
```

### §R2 — Refund declined (after consent waiver)

```
Predmet: K tvojej žiadosti o refund — subenai

Ahoj,

dostali sme tvoju žiadosť. Pri checkout-e si zaškrtol/a súhlas so
začatím poskytovania okamžite, čím podľa § 7 ods. 6 zákona č. 102/2014
Z. z. zaniklo právo na odstúpenie do 14 dní.

Z tohto dôvodu jednorazový príspevok refundovať neviem.

Ak ide o mesačný odber, kedykoľvek ho zrušíš jediným klikom cez Stripe
Customer Portal — link si vyžiadaj na
https://subenai.lvtesting.eu/spravovat-podporu. Zrušenie sa vzťahuje na
budúce fakturačné obdobia.

Ak ide o iný dôvod (preklep v sume, omylom dvojitá platba), napíš mi a
nájdeme riešenie.

— Ľubomír Volčko
   am.bonum s. r. o.
```

### §G1 — Sponsor cancelled subscription, polite goodbye

```
Predmet: Vďaka za doterajšiu podporu — subenai

Ahoj,

videl som, že si zrušil/a mesačný odber. Žiadny problém — peniaze, ktoré
si poslal/a doteraz, urobili kus práce a vďaka nim projekt funguje aj
ďalej.

Ak by si sa niekedy chcel/a vrátiť, https://subenai.lvtesting.eu/podpora
je vždy k dispozícii. Ak chceš úplne zmazať svoje meno zo zoznamu
sponzorov, stačí napísať na túto adresu.

— Ľubomír Volčko
   am.bonum s. r. o.
```

### §G2 — GDPR erasure response

```
Predmet: Tvoja žiadosť o vymazanie údajov — subenai

Ahoj,

dostali sme tvoju žiadosť o vymazanie osobných údajov v zmysle čl. 17
GDPR.

Tvoje verejne zobraziteľné polia (meno, odkaz, správa, footer flag) som
práve anonymizoval — od najbližšieho deploy-u (~5 min) tvoje meno
nenájdeš na stránke /sponzori ani v päte.

Účtovný záznam o transakcii (suma, dátum, ID Stripe customer) podľa
§ 35 zákona č. 431/2002 Z. z. o účtovníctve musíme uchovať 10 rokov.
Záznam je interný, nezobrazuje sa na webe a nie je prístupný tretím
stranám.

Ak chceš vidieť presný rozsah tvojich uložených údajov (právo na prístup
podľa čl. 15 GDPR), pošlem ti export. Stačí potvrdiť.

— Ľubomír Volčko
   am.bonum s. r. o. (IČO 55 055 290), prevádzkovateľ
```

### §G3 — AML cap explanation

```
Predmet: Príspevok bol zamietnutý — subenai

Ahoj,

Stripe zachytil, že si chcel/a poslať príspevok vyšší ako 500 €. Túto
hranicu sme nastavili dobrovoľne, aby sme zostali pod limitom KYC
povinnosti per § 10 zákona č. 297/2008 Z. z. — vďaka nej nemusíme od
darcov vyžadovať doklad totožnosti, fotenie pasov a podobne.

Tvoja karta nebola zaťažená.

Ak chceš poslať väčšiu sumu, máme dve možnosti:
1. Bankovým prevodom mimo Stripe — pošli mi prosím IČO/DIČ pre faktúru
2. Rozdelíš to na viacero menších príspevkov (môžeš aj na rôznych
   kartách / dátumoch — nie je to obchádzanie limitu, jednotlivé
   transakcie sú legitímne)

— Ľubomír Volčko
   am.bonum s. r. o.
```

---

## Operational cadence

- **Mesačne**: skontrolovať Resend dashboard → bounce rate, delivery
  rate; cieľ < 2 % bounce
- **Štvrťročne**: skontrolovať `sponsors.total_eur` je v sync s
  `SUM(donations.amount_eur)` per sponsor (jednoduchý SQL audit query
  v sekcii 3)
- **Ročne**: refresh tohto runbook-u (najmä Stripe Dashboard
  screenshot odkazy môžu zastarať pri UI redesign-e)

---

## Quick links

- [E10 webhook runbook](./E10-webhook-runbook.md)
- [E11 email runbook](./E11-email-runbook.md)
- [E10 sponsorship decisions log](./E10-sponsorship-decisions.md)
- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com/emails
- Supabase Dashboard: https://supabase.com/dashboard/project/lwxichbuvcakscntjkzs

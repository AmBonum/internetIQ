#!/usr/bin/env bash
# Local Stripe-aware dev orchestrator.
#
# Boots two long-running processes side by side:
#   1. `wrangler pages dev` on :8788 (serves the SSR worker + /api functions)
#   2. `stripe listen --forward-to localhost:8788/api/stripe-webhook`
#      forwarding signed test-mode webhook events to the local function.
#
# Before launching, asks the Stripe CLI for the current webhook signing
# secret (`stripe listen --print-secret`) and writes it into .dev.vars as
# STRIPE_WEBHOOK_SECRET so the local function can verify forwarded events.
#
# Usage:
#   1. cp .dev.vars.example .dev.vars  (one time)
#   2. fill in STRIPE_SECRET_KEY + SUPABASE_* in .dev.vars
#   3. stripe login                     (one time)
#   4. npm run dev:stripe
#
# Ctrl-C cleanly stops both child processes.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_VARS="${REPO_ROOT}/.dev.vars"
WEBHOOK_PATH="/api/stripe-webhook"
WRANGLER_PORT=8788

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "✗ '$1' not found on PATH" >&2
    [ -n "${2:-}" ] && echo "  $2" >&2
    exit 1
  }
}

require stripe "Install: https://docs.stripe.com/stripe-cli#install"
require npx "Install Node.js — npx ships with npm"

[ -f "$DEV_VARS" ] || {
  echo "✗ .dev.vars not found. Copy .dev.vars.example and fill in values." >&2
  exit 1
}

# Refuse to run if STRIPE_SECRET_KEY looks like a live key — this script is
# explicitly for the local TEST loop.
if grep -qE '^STRIPE_SECRET_KEY=sk_live_' "$DEV_VARS"; then
  echo "✗ .dev.vars contains sk_live_ — refusing to use live keys for local dev." >&2
  exit 1
fi

echo "→ Fetching local webhook signing secret from Stripe CLI…"
WHSEC="$(stripe listen --print-secret 2>/dev/null | tr -d '[:space:]')"
[ -n "$WHSEC" ] || {
  echo "✗ Stripe CLI returned an empty webhook secret. Run 'stripe login' first." >&2
  exit 1
}

# Idempotent in-place replace: matches "STRIPE_WEBHOOK_SECRET=…" (possibly
# empty) and rewrites to the fresh whsec. macOS sed requires the empty -i ''.
if grep -qE '^STRIPE_WEBHOOK_SECRET=' "$DEV_VARS"; then
  sed -i.bak -E "s|^STRIPE_WEBHOOK_SECRET=.*$|STRIPE_WEBHOOK_SECRET=${WHSEC}|" "$DEV_VARS"
  rm -f "${DEV_VARS}.bak"
else
  printf '\nSTRIPE_WEBHOOK_SECRET=%s\n' "$WHSEC" >>"$DEV_VARS"
fi
echo "✓ Wrote STRIPE_WEBHOOK_SECRET to .dev.vars (whsec_${WHSEC:6:8}…)"

cleanup() {
  trap - INT TERM EXIT
  [ -n "${WRANGLER_PID:-}" ] && kill "$WRANGLER_PID" 2>/dev/null || true
  [ -n "${LISTEN_PID:-}" ] && kill "$LISTEN_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "→ Stopped."
}
trap cleanup INT TERM EXIT

echo "→ Building app for wrangler…"
(cd "$REPO_ROOT" && npm run build --silent)

echo "→ Starting wrangler pages dev on :${WRANGLER_PORT}…"
(cd "$REPO_ROOT" && npx wrangler pages dev dist/client \
  --compatibility-date=2024-09-01 --port "$WRANGLER_PORT") &
WRANGLER_PID=$!

# Give wrangler ~3s to bind the port before pointing stripe listen at it.
sleep 3

echo "→ Starting stripe listen → http://localhost:${WRANGLER_PORT}${WEBHOOK_PATH}"
stripe listen --forward-to "http://localhost:${WRANGLER_PORT}${WEBHOOK_PATH}" &
LISTEN_PID=$!

echo ""
echo "✓ Dev stack is up."
echo "  - App:     http://localhost:${WRANGLER_PORT}"
echo "  - Webhook: http://localhost:${WRANGLER_PORT}${WEBHOOK_PATH}"
echo "  - Trigger events from another terminal: 'stripe trigger <event-type>'"
echo "  - Ctrl-C to stop both processes."

wait

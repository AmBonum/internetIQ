#!/usr/bin/env bash
# E6.1 — Defense-in-depth audit. The social share grid is a deliberate "no
# 3rd-party SDK" implementation: every button calls window.open() against the
# platform's own share URL. Nothing should ever pull a tracking pixel into
# our bundle. This script enforces that invariant by grepping the built
# output for known tracker domains. Fail (exit 1) on any hit so CI catches
# accidental imports of e.g. `facebook-sdk`, `react-twitter-widgets`, etc.

set -euo pipefail

DIST_DIR="${1:-dist}"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "✗ dist directory not found at: $DIST_DIR" >&2
  echo "  Run \`npm run build\` first." >&2
  exit 2
fi

# Domains that, if present in the bundle, mean a tracker SDK has been pulled
# in. Pure share-intent URLs (e.g. `facebook.com/sharer/sharer.php`) are OK
# because they are *strings used by window.open*, not script sources — they
# match the domain `facebook.com` but NOT any of the suffixes below.
PATTERNS=(
  "connect\.facebook\.net"
  "facebook\.net/en_US"
  "googletagmanager\.com"
  "google-analytics\.com"
  "platform\.twitter\.com"
  "static\.ads-twitter\.com"
  "analytics\.tiktok\.com"
  "static\.hotjar\.com"
  "cdn\.mixpanel\.com"
  "cdn\.segment\.com"
)

found=0
for pattern in "${PATTERNS[@]}"; do
  if grep -rE "$pattern" "$DIST_DIR" >/dev/null 2>&1; then
    echo "✗ Tracker pattern found in $DIST_DIR: $pattern" >&2
    grep -rE "$pattern" "$DIST_DIR" | head -3 >&2
    found=1
  fi
done

if [[ $found -ne 0 ]]; then
  echo "" >&2
  echo "✗ Bundle contains tracker SDK code. Reject merge." >&2
  exit 1
fi

echo "✓ No tracker SDKs in $DIST_DIR — share grid is GDPR-clean."

/**
 * Luhn checksum validation for credit card numbers. Pure function — no
 * network, no side-effects. Strips whitespace and dashes before checking.
 *
 * The Luhn algorithm catches all single-digit typos and most transpositions,
 * which is why every issuer uses it. It is **not** a fraud check (test cards
 * like 4242424242424242 pass), only a typing-correctness gate. That's
 * exactly what we need for E4 — distinguish a real card number from random
 * digits.
 */
export function isValidLuhn(input: string): boolean {
  const digits = input.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) return false;
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48; // ASCII '0' = 48
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

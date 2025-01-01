import { describe, it, expect } from "vitest";
import { isValidLuhn } from "@/lib/data-trap/luhn";

describe("isValidLuhn", () => {
  it("accepts industry test numbers (Visa / MC / Amex / Discover)", () => {
    // These are the universally-published gateway sandbox numbers — they
    // pass Luhn but never charge anyone in production.
    expect(isValidLuhn("4242424242424242")).toBe(true); // Visa
    expect(isValidLuhn("5555555555554444")).toBe(true); // MasterCard
    expect(isValidLuhn("378282246310005")).toBe(true); // Amex 15-digit
    expect(isValidLuhn("6011111111111117")).toBe(true); // Discover
  });

  it("strips spaces and dashes before validating", () => {
    expect(isValidLuhn("4242 4242 4242 4242")).toBe(true);
    expect(isValidLuhn("4242-4242-4242-4242")).toBe(true);
  });

  it("rejects sequences with the wrong check digit", () => {
    expect(isValidLuhn("4242424242424241")).toBe(false);
    expect(isValidLuhn("1234567890123456")).toBe(false);
    expect(isValidLuhn("0000000000000001")).toBe(false);
  });

  it("rejects too short / too long inputs", () => {
    expect(isValidLuhn("42")).toBe(false);
    expect(isValidLuhn("12345678901")).toBe(false); // 11 digits
    expect(isValidLuhn("12345678901234567890")).toBe(false); // 20 digits
  });

  it("rejects non-numeric content", () => {
    expect(isValidLuhn("4242abcd42424242")).toBe(false);
    expect(isValidLuhn("")).toBe(false);
  });
});

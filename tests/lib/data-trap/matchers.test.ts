import { describe, it, expect } from "vitest";
import { matchers } from "@/lib/data-trap/matchers";

// 3 positive + 3 negative samples per field — false-positive prevention is
// the entire point of these matchers, so we lean harder on the negatives.

describe("matchers.birth_number", () => {
  it("accepts 6+3 and 6+4 digit shapes with optional slash", () => {
    expect(matchers.birth_number("950101/1234")).toBe(true);
    expect(matchers.birth_number("950101 1234")).toBe(true);
    expect(matchers.birth_number("050101/123")).toBe(true);
  });
  it("rejects ambiguous numeric strings (date, phone, short PIN)", () => {
    expect(matchers.birth_number("06.04.2026")).toBe(false);
    expect(matchers.birth_number("0901 234 567")).toBe(false);
    expect(matchers.birth_number("123456")).toBe(false);
  });
});

describe("matchers.card_number", () => {
  it("accepts valid Luhn 13-19 digit cards", () => {
    expect(matchers.card_number("4242424242424242")).toBe(true);
    expect(matchers.card_number("4242 4242 4242 4242")).toBe(true);
    expect(matchers.card_number("378282246310005")).toBe(true);
  });
  it("rejects Luhn-failing strings, IBANs, short numbers", () => {
    expect(matchers.card_number("1234567890123456")).toBe(false);
    expect(matchers.card_number("SK8911000000002617004334")).toBe(false);
    expect(matchers.card_number("0000")).toBe(false);
  });
});

describe("matchers.card_cvv", () => {
  it("accepts 3-4 digit codes", () => {
    expect(matchers.card_cvv("123")).toBe(true);
    expect(matchers.card_cvv("4321")).toBe(true);
    expect(matchers.card_cvv("000")).toBe(true);
  });
  it("rejects strings outside 3-4 digit range", () => {
    expect(matchers.card_cvv("12")).toBe(false);
    expect(matchers.card_cvv("12345")).toBe(false);
    expect(matchers.card_cvv("12a")).toBe(false);
  });
});

describe("matchers.iban", () => {
  it("accepts SK and other EU IBANs", () => {
    expect(matchers.iban("SK8911000000002617004334")).toBe(true);
    expect(matchers.iban("SK89 1100 0000 0026 1700 4334")).toBe(true);
    expect(matchers.iban("CZ6508000000192000145399")).toBe(true);
  });
  it("rejects partial IBANs and other digit strings", () => {
    expect(matchers.iban("SK1234")).toBe(false);
    expect(matchers.iban("0901 234 567")).toBe(false);
    expect(matchers.iban("4242424242424242")).toBe(false);
  });
});

describe("matchers.password", () => {
  it("accepts any non-empty string (the field is gated by input type)", () => {
    expect(matchers.password("a")).toBe(true);
    expect(matchers.password("hello")).toBe(true);
    expect(matchers.password("hunter2")).toBe(true);
  });
  it("rejects empty strings (no value typed)", () => {
    expect(matchers.password("")).toBe(false);
  });
});

describe("matchers.otp_code", () => {
  it("accepts 4-8 digit codes", () => {
    expect(matchers.otp_code("1234")).toBe(true);
    expect(matchers.otp_code("123456")).toBe(true);
    expect(matchers.otp_code("12345678")).toBe(true);
  });
  it("rejects out-of-range or non-digit content", () => {
    expect(matchers.otp_code("123")).toBe(false);
    expect(matchers.otp_code("123456789")).toBe(false);
    expect(matchers.otp_code("12 34")).toBe(false);
  });
});

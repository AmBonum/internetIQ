// Slovak warning copy + UI metadata for the data-trap fields. Mirrors the
// approved spec in tasks/E4-data-trap-copy.md (E4.1). The TrapDialog
// renders a card per entry; the order in this array is the rendering order.

import type { TrapFieldId } from "./matchers";

export type TrapSensitivity = "kritická" | "vysoká" | "stredná";

export interface TrapFieldCopy {
  id: TrapFieldId;
  /** UI label rendered above the input. */
  label: string;
  /** HTML input type (`text`, `password`). CVV/OTP stay `text` so the user
   *  visually remembers what they're typing — pretending CVV is a password
   *  would weaken the educational moment. */
  inputType: "text" | "password";
  placeholder?: string;
  /** maxlength for the underlying input — keeps DOM well-behaved. */
  maxLength: number;
  sensitivity: TrapSensitivity;
  warningTitle: string;
  warningBody: string;
}

export const TRAP_FIELDS: ReadonlyArray<TrapFieldCopy> = [
  {
    id: "birth_number",
    label: "Rodné číslo",
    inputType: "text",
    placeholder: "napr. 950101/1234",
    maxLength: 12,
    sensitivity: "kritická",
    warningTitle: "🚨 Rodné číslo si práve dal/a niekomu cudziemu",
    warningBody:
      'Toto je jeden z najcitlivejších údajov v SR. Patrí len banke, štátu a zamestnávateľovi — stačí zopár ďalších údajov a útočník si môže v tvojom mene zobrať pôžičku alebo otvoriť účet. Nikdy ho nezadávaj do náhodných formulárov, ani do „ankety o výhre".',
  },
  {
    id: "card_number",
    label: "Číslo karty",
    inputType: "text",
    placeholder: "1234 5678 9012 3456",
    maxLength: 23,
    sensitivity: "kritická",
    warningTitle: "💳 Číslo karty + tvoje meno = okamžitý risk",
    warningBody:
      'Aj bez CVV existujú obchody (najmä mimo EU) ktoré platbu schvália len s číslom karty a expirom. Banka ti to refundne, ale niekedy o dni neskôr — a medzitým máš zablokovanú kartu. Zadávaj ho len cez oficiálne platobné brány s „https://" a logom 3-D Secure.',
  },
  {
    id: "card_cvv",
    label: "CVV / kontrolné číslo",
    inputType: "text",
    placeholder: "123",
    maxLength: 4,
    sensitivity: "kritická",
    warningTitle: "🔐 CVV — len pri reálnej platbe",
    warningBody:
      "CVV (3-4 znaky na zadnej strane karty) je posledná vrstva ochrany. Žiadny obchod ho legálne neukladá, takže ak ho pýta inde než na finálnej platobnej obrazovke (často s logom Visa Secure / Mastercard ID Check), je to podvod. Vždy.",
  },
  {
    id: "iban",
    label: "IBAN / číslo účtu",
    inputType: "text",
    placeholder: "SK89 1100 0000 0026 1700 4334",
    maxLength: 34,
    sensitivity: "vysoká",
    warningTitle: "🏦 IBAN je verejnejší než si myslíš — ale pozor na kontext",
    warningBody:
      'IBAN sa pýta každá faktúra a v EU je to bežný údaj. Nebezpečie nastáva keď ho dáš spolu s menom + adresou + telefónom — to je súbor na phishing-on-banku („dobrý deň, volám z VÚB ohľadom transakcie na účte SKxx…"). Sám o sebe nie je likvidný, ale slúži ako kotva pre cielený útok.',
  },
  {
    id: "password",
    label: "Heslo (k inej službe)",
    inputType: "password",
    placeholder: "tvoje heslo z Gmailu / banky / inej appky",
    maxLength: 80,
    sensitivity: "kritická",
    warningTitle: "🔓 Heslo si práve dal/a do náhodného formulára",
    warningBody:
      "Heslo by sa nikdy nemalo opúšťať pole vlastnej domény (banka, e-shop, work email). Ak ho znova použiješ inde — a väčšina ľudí to robí — útočník vyskúša rovnaký pár emailu+hesla na 50 najpopulárnejších stránkach (credential stuffing) a niekde sa trafí. Použi password manager (Bitwarden, 1Password, Apple Keychain).",
  },
  {
    id: "otp_code",
    label: "OTP kód zo SMS / verifikačný kód",
    inputType: "text",
    placeholder: "123456",
    maxLength: 8,
    sensitivity: "kritická",
    warningTitle: "📱 OTP kód = živý kľúč k účtu",
    warningBody:
      'OTP (jednorazový kód zo SMS alebo authenticator appky) je živý kľúč k tvojej banke alebo emailu. Funguje 30-60 sekúnd a útočník presne tento čas má, kým ťa drží na linke („dobrý deň, volá vám VÚB, treba overiť transakciu"). Žiadna banka, ani Microsoft, ani Slovak Telekom **nikdy** nepýtajú OTP — ani telefonicky, ani v emaili, ani vo formulári mimo vlastnej appky.',
  },
];

export const SENSITIVITY_BORDER: Record<TrapSensitivity, string> = {
  kritická: "border-destructive",
  vysoká: "border-warning",
  stredná: "border-muted-foreground/40",
};

export const SENSITIVITY_BADGE: Record<TrapSensitivity, string> = {
  kritická: "bg-destructive/15 text-destructive",
  vysoká: "bg-warning/15 text-warning",
  stredná: "bg-muted text-muted-foreground",
};

export const SENSITIVITY_LABEL: Record<TrapSensitivity, string> = {
  kritická: "KRITICKÉ",
  vysoká: "VYSOKÉ",
  stredná: "STREDNÉ",
};

/** localStorage key permitted by the design invariant — only a boolean
 *  "user has seen the trap" flag is allowed, never a field value. */
export const TRAP_SEEN_STORAGE_KEY = "iiq_trap_seen";

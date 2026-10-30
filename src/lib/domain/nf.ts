import { cleanText, textKey } from "./text";

export type NfStatus = "emitida" | "nao_emitida";

export interface NfInfo {
  raw: string;
  status: NfStatus;
  /** First number when two are present: the W7 invoice. */
  w7Nf: string | null;
  /** Second number when two are present: the creator's invoice. */
  creatorNf: string | null;
  /** Single number: an invoice exists but its issuer is not identified. */
  unidentifiedNf: string | null;
  numbers: string[];
  /** Text outside the expected pattern; raises an alert for manual review. */
  nonStandard: boolean;
}

// Texts that mean "no invoice". Anything else without digits is non-standard.
const NO_INVOICE = new Set(["", "S/NF", "S/ NF", "SN", "SEM NF", "VOUCHER", "PERMUTA", "NAO FATURAR"]);

// Words that may appear around invoice numbers without making the cell non-standard.
const ALLOWED_WORDS = new Set(["NF", "NFS", "E"]);

/**
 * Column A rules:
 * - two numbers: 1st = W7 invoice, 2nd = creator invoice;
 * - one number: invoice issued, issuer not identified;
 * - no number / S/NF: not issued;
 * - anything outside the pattern raises an alert.
 */
export function parseNf(raw: string | null | undefined): NfInfo {
  const text = cleanText(raw);
  const key = textKey(text);
  const numbers = text.match(/\d+/g) ?? [];

  const base = { raw: text, numbers, w7Nf: null, creatorNf: null, unidentifiedNf: null };

  if (numbers.length === 0) {
    return { ...base, status: "nao_emitida", nonStandard: !NO_INVOICE.has(key) };
  }

  const words = key.replace(/\d+/g, " ").replace(/[+]/g, " ").split(/\s+/).filter(Boolean);
  const danglingConnector = /(\bE|\+)\s*\??$/.test(key);
  const nonStandard =
    numbers.length > 2 || danglingConnector || words.some((w) => !ALLOWED_WORDS.has(w));

  if (numbers.length === 1) {
    return { ...base, status: "emitida", unidentifiedNf: numbers[0] ?? null, nonStandard };
  }
  return { ...base, status: "emitida", w7Nf: numbers[0] ?? null, creatorNf: numbers[1] ?? null, nonStandard };
}

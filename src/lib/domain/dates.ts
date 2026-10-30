import { cleanText, textKey } from "./text";

/** ISO calendar date, "YYYY-MM-DD". */
export type IsoDate = string;

export interface MonthRef {
  year: number;
  month: number; // 1-12
}

const MONTHS: Record<string, number> = {
  JANEIRO: 1, FEVEREIRO: 2, MARCO: 3, ABRIL: 4, MAIO: 5, JUNHO: 6,
  JULHO: 7, AGOSTO: 8, SETEMBRO: 9, OUTUBRO: 10, NOVEMBRO: 11, DEZEMBRO: 12,
};

/** "MARÇO " -> 3. Ranges such as "JAN A SET" are not a single month and return null. */
export function parseMonthName(raw: string | null | undefined): number | null {
  return MONTHS[textKey(raw)] ?? null;
}

export function parseYear(raw: string | null | undefined): number | null {
  const text = cleanText(raw);
  if (!/^\d{4}$/.test(text)) return null;
  const year = Number(text);
  return year >= 2000 && year <= 2100 ? year : null;
}

/**
 * "30/10/2026" or "8/1/2025" -> "2026-10-30". Returns null for anything else,
 * including the sheet's "29/01/1900" placeholder on empty rows.
 */
export function parseBrDate(raw: string | null | undefined): IsoDate | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(cleanText(raw));
  if (!match) return null;
  const [, d, m, y] = match.map(Number);
  if (y < 2000 || y > 2100 || m < 1 || m > 12) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function monthOfDate(date: IsoDate): MonthRef {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
}

export function monthKey(ref: MonthRef): string {
  return `${ref.year}-${String(ref.month).padStart(2, "0")}`;
}

export function monthIndex(ref: MonthRef): number {
  return ref.year * 12 + (ref.month - 1);
}

/** Today's date in São Paulo, the reference for "vencido" and "vence hoje". */
export function todayInSaoPaulo(now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

import { MonthRef } from "@/lib/domain/dates";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function money(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "—" : brl.format(cents / 100);
}

export function month(ref: MonthRef | null | undefined): string {
  return ref ? `${MONTHS[ref.month - 1]}/${String(ref.year).slice(2)}` : "—";
}

export function date(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

import { MonthRef } from "@/lib/domain/dates";
import { DateBasis, Filter } from "@/lib/domain/metrics";

export type PeriodType = "mes" | "trimestre" | "ano" | "personalizado";

export interface FilterParams {
  periodo?: string;
  mes?: string; // YYYY-MM
  trimestre?: string; // YYYY-Qn
  ano?: string; // YYYY
  de?: string; // YYYY-MM
  ate?: string; // YYYY-MM
  base?: string;
  marca?: string;
  creator?: string;
}

const parseMonth = (s: string | undefined): MonthRef | null => {
  const m = /^(\d{4})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? { year: Number(m[1]), month } : null;
};

export interface ResolvedFilter extends Filter {
  type: PeriodType;
  label: string;
  params: Record<string, string>;
}

const MONTH_NAMES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Reads the filter bar parameters; defaults to the current year by delivery month. */
export function resolveFilter(p: FilterParams, today: string): ResolvedFilter {
  const year = Number(today.slice(0, 4));
  const type = (["mes", "trimestre", "ano", "personalizado"].includes(p.periodo ?? "") ? p.periodo : "ano") as PeriodType;
  const basis: DateBasis = p.base === "recebimento" ? "recebimento" : "vigencia";
  let from: MonthRef = { year, month: 1 };
  let to: MonthRef = { year, month: 12 };
  let label = String(year);

  if (type === "mes") {
    const m = parseMonth(p.mes) ?? { year, month: Number(today.slice(5, 7)) };
    from = to = m;
    label = `${MONTH_NAMES[m.month - 1]} de ${m.year}`;
  } else if (type === "trimestre") {
    const q = /^(\d{4})-Q([1-4])$/.exec(p.trimestre ?? "");
    const qy = q ? Number(q[1]) : year;
    const qn = q ? Number(q[2]) : Math.ceil(Number(today.slice(5, 7)) / 3);
    from = { year: qy, month: (qn - 1) * 3 + 1 };
    to = { year: qy, month: qn * 3 };
    label = `${qn}º trimestre de ${qy}`;
  } else if (type === "ano") {
    const y = /^\d{4}$/.test(p.ano ?? "") ? Number(p.ano) : year;
    from = { year: y, month: 1 };
    to = { year: y, month: 12 };
    label = String(y);
  } else {
    const a = parseMonth(p.de) ?? { year, month: 1 };
    const b = parseMonth(p.ate) ?? a;
    [from, to] = a.year * 12 + a.month <= b.year * 12 + b.month ? [a, b] : [b, a];
    label = `${MONTH_NAMES[from.month - 1]}/${from.year} a ${MONTH_NAMES[to.month - 1]}/${to.year}`;
  }

  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (typeof v === "string" && v) params[k] = v;
  return { type, from, to, basis, brand: p.marca || undefined, creator: p.creator || undefined, label, params };
}

export function withParams(path: string, base: Record<string, string>, extra: Record<string, string | undefined> = {}): string {
  const q = new URLSearchParams(base);
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === "") q.delete(k);
    else q.set(k, v);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

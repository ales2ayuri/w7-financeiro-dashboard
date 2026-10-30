import { IsoDate, MonthRef, monthIndex, monthKey, monthOfDate } from "./dates";
import { SheetEntry } from "./sheet";
import { FinancialStatus, financialStatus } from "./status";

/**
 * Financial and commercial indicators (§13), computed from the sheet (reference source).
 * K = volume, M = W7 revenue, L = informative. Only monetary rows enter money totals;
 * permutas/vouchers are counted apart, losses go to their own panel (§11).
 */

export type DateBasis = "vigencia" | "recebimento";

export interface Filter {
  from: MonthRef;
  to: MonthRef;
  basis: DateBasis;
  brand?: string; // brand key
  creator?: string; // creator key
}

/** Month an entry is attributed to under the chosen date basis (null = outside the basis). */
export function attributedMonth(e: SheetEntry, basis: DateBasis): MonthRef | null {
  if (basis === "vigencia") return e.month;
  return e.paymentDate ? monthOfDate(e.paymentDate) : null;
}

export function inFilter(e: SheetEntry, f: Filter): boolean {
  const m = attributedMonth(e, f.basis);
  if (!m) return false;
  const i = monthIndex(m);
  if (i < monthIndex(f.from) || i > monthIndex(f.to)) return false;
  if (f.brand && e.brand.key !== f.brand) return false;
  if (f.creator && e.creator.key !== f.creator) return false;
  return true;
}

const sum = (items: SheetEntry[], pick: (e: SheetEntry) => number | null) =>
  items.reduce((t, e) => t + (pick(e) ?? 0), 0);

export interface FinancialSummary {
  deliveries: number; // monetary deliveries
  grossCents: number; // Σ K
  w7Cents: number; // Σ M
  creatorCents: number; // Σ L
  avgGrossPerDelivery: number | null;
  avgW7PerDelivery: number | null;
  byStatus: Record<FinancialStatus, { count: number; w7Cents: number; grossCents: number }>;
  invoiced: { count: number; w7Cents: number };
  notInvoiced: { count: number; w7Cents: number };
  nonMonetary: number;
  losses: { count: number; grossCents: number; lossCents: number };
  receivedWithoutDate: number;
}

const STATUSES: FinancialStatus[] = [
  "recebido", "a_receber", "vence_hoje", "vencido", "parcial", "verificacao", "nao_monetario", "perda", "excluido",
];

export function summarize(entries: SheetEntry[], today: IsoDate): FinancialSummary {
  const monetary = entries.filter((e) => e.kind === "monetaria");
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, { count: 0, w7Cents: 0, grossCents: 0 }])) as FinancialSummary["byStatus"];
  for (const e of entries) {
    const s = byStatus[financialStatus(e, today)];
    s.count++;
    if (e.kind === "monetaria") {
      s.w7Cents += e.w7Cents ?? 0;
      s.grossCents += e.grossCents ?? 0;
    }
  }
  const invoicedRows = monetary.filter((e) => e.nf.status === "emitida");
  const notInvoicedRows = monetary.filter((e) => e.nf.status !== "emitida");
  const lossRows = entries.filter((e) => e.kind === "prejuizo");
  const gross = sum(monetary, (e) => e.grossCents);
  const w7 = sum(monetary, (e) => e.w7Cents);
  return {
    deliveries: monetary.length,
    grossCents: gross,
    w7Cents: w7,
    creatorCents: sum(monetary, (e) => e.creatorCents),
    avgGrossPerDelivery: monetary.length ? Math.round(gross / monetary.length) : null,
    avgW7PerDelivery: monetary.length ? Math.round(w7 / monetary.length) : null,
    byStatus,
    invoiced: { count: invoicedRows.length, w7Cents: sum(invoicedRows, (e) => e.w7Cents) },
    notInvoiced: { count: notInvoicedRows.length, w7Cents: sum(notInvoicedRows, (e) => e.w7Cents) },
    nonMonetary: entries.filter((e) => e.kind === "permuta" || e.kind === "voucher").length,
    losses: { count: lossRows.length, grossCents: sum(lossRows, (e) => e.grossCents), lossCents: sum(lossRows, (e) => e.lossCents) },
    receivedWithoutDate: monetary.filter((e) => financialStatus(e, today) === "recebido" && !e.paymentDate).length,
  };
}

export function monthsBetween(from: MonthRef, to: MonthRef): MonthRef[] {
  const out: MonthRef[] = [];
  for (let i = monthIndex(from); i <= monthIndex(to); i++) out.push({ year: Math.floor(i / 12), month: (i % 12) + 1 });
  return out;
}

export interface MonthPoint {
  key: string;
  month: MonthRef;
  deliveries: number;
  grossCents: number;
  w7Cents: number;
  w7ReceivedCents: number;
  w7OpenCents: number; // a receber, vence hoje, vencido, parcial, em verificação
}

export function monthlySeries(entries: SheetEntry[], f: Filter, today: IsoDate): MonthPoint[] {
  const points = new Map(
    monthsBetween(f.from, f.to).map((m) => [monthKey(m), { key: monthKey(m), month: m, deliveries: 0, grossCents: 0, w7Cents: 0, w7ReceivedCents: 0, w7OpenCents: 0 }]),
  );
  for (const e of entries) {
    if (e.kind !== "monetaria") continue;
    const m = attributedMonth(e, f.basis);
    const p = m && points.get(monthKey(m));
    if (!p) continue;
    p.deliveries++;
    p.grossCents += e.grossCents ?? 0;
    p.w7Cents += e.w7Cents ?? 0;
    if (financialStatus(e, today) === "recebido") p.w7ReceivedCents += e.w7Cents ?? 0;
    else p.w7OpenCents += e.w7Cents ?? 0;
  }
  return [...points.values()];
}

// ---------------------------------------------------------------- commercial

export interface BrandStats {
  key: string;
  name: string;
  deliveries: number; // all deliveries, including non-monetary
  monetaryDeliveries: number;
  grossCents: number;
  w7Cents: number;
  avgGrossCents: number | null;
  creators: string[];
}

/** Undocumented 2023 rows stay out of every per-brand metric (§11). */
const forBrands = (entries: SheetEntry[]) => entries.filter((e) => !e.undocumented && (e.kind === "monetaria" || e.kind === "permuta" || e.kind === "voucher"));

export function brandStats(entries: SheetEntry[]): BrandStats[] {
  const map = new Map<string, BrandStats & { creatorSet: Set<string> }>();
  for (const e of forBrands(entries)) {
    const b = map.get(e.brand.key) ?? { key: e.brand.key, name: e.brand.name, deliveries: 0, monetaryDeliveries: 0, grossCents: 0, w7Cents: 0, avgGrossCents: null, creators: [], creatorSet: new Set() };
    b.deliveries++;
    b.creatorSet.add(e.creator.name);
    if (e.kind === "monetaria") {
      b.monetaryDeliveries++;
      b.grossCents += e.grossCents ?? 0;
      b.w7Cents += e.w7Cents ?? 0;
    }
    map.set(e.brand.key, b);
  }
  return [...map.values()]
    .map(({ creatorSet, ...b }) => ({ ...b, creators: [...creatorSet].sort(), avgGrossCents: b.monetaryDeliveries ? Math.round(b.grossCents / b.monetaryDeliveries) : null }))
    .sort((a, b) => b.w7Cents - a.w7Cents || b.deliveries - a.deliveries);
}

export interface CreatorStats {
  key: string;
  name: string;
  deliveries: number;
  brands: number;
  grossCents: number;
  creatorCents: number;
  w7Cents: number;
}

export function creatorStats(entries: SheetEntry[]): CreatorStats[] {
  const map = new Map<string, CreatorStats & { brandSet: Set<string> }>();
  for (const e of entries.filter((x) => x.kind === "monetaria" || x.kind === "permuta" || x.kind === "voucher")) {
    const c = map.get(e.creator.key) ?? { key: e.creator.key, name: e.creator.name, deliveries: 0, brands: 0, grossCents: 0, creatorCents: 0, w7Cents: 0, brandSet: new Set() };
    c.deliveries++;
    if (!e.undocumented) c.brandSet.add(e.brand.key);
    if (e.kind === "monetaria") {
      c.grossCents += e.grossCents ?? 0;
      c.creatorCents += e.creatorCents ?? 0;
      c.w7Cents += e.w7Cents ?? 0;
    }
    map.set(e.creator.key, c);
  }
  return [...map.values()].map(({ brandSet, ...c }) => ({ ...c, brands: brandSet.size })).sort((a, b) => b.w7Cents - a.w7Cents);
}

export interface MatrixCell {
  deliveries: number;
  w7Cents: number;
}

export function brandCreatorMatrix(entries: SheetEntry[]): Map<string, Map<string, MatrixCell>> {
  const matrix = new Map<string, Map<string, MatrixCell>>();
  for (const e of forBrands(entries)) {
    const row = matrix.get(e.brand.key) ?? new Map<string, MatrixCell>();
    const cell = row.get(e.creator.key) ?? { deliveries: 0, w7Cents: 0 };
    cell.deliveries++;
    if (e.kind === "monetaria") cell.w7Cents += e.w7Cents ?? 0;
    row.set(e.creator.key, cell);
    matrix.set(e.brand.key, row);
  }
  return matrix;
}

export interface Concentration {
  totalW7Cents: number;
  top1: number | null;
  top3: number | null;
  top5: number | null;
}

/** Share of W7 revenue (M) held by the largest brands in the period. */
export function concentration(brands: BrandStats[]): Concentration {
  const total = brands.reduce((t, b) => t + b.w7Cents, 0);
  const sorted = [...brands].sort((a, b) => b.w7Cents - a.w7Cents);
  const share = (n: number) => (total > 0 ? sorted.slice(0, n).reduce((t, b) => t + b.w7Cents, 0) / total : null);
  return { totalW7Cents: total, top1: share(1), top3: share(3), top5: share(5) };
}

export type BrandLifecycle = "nova" | "recorrente" | "ativa" | "inativa" | "perdida";

export interface LifecycleCounts {
  active: number;
  new: number;
  recurring: number;
  inactive: number;
  lost: number;
  byBrand: Map<string, BrandLifecycle>;
}

/**
 * Brand lifecycle at the end of the period (or the current month, if earlier), based on
 * the full history up to that month:
 * active = delivery in the period; new = first delivery ever falls in the period;
 * recurring = active and with deliveries in at least two different months;
 * inactive = last delivery 4 to 6 months before the period end; lost = more than 6 months.
 */
export function brandLifecycle(allEntries: SheetEntry[], f: Filter, current?: MonthRef): LifecycleCounts {
  // A period that runs into the future is evaluated up to the current month.
  const end = current ? Math.min(monthIndex(f.to), monthIndex(current)) : monthIndex(f.to);
  const start = monthIndex(f.from);
  const months = new Map<string, Set<number>>();
  for (const e of forBrands(allEntries)) {
    if (!e.month || monthIndex(e.month) > end) continue;
    if (f.creator && e.creator.key !== f.creator) continue;
    const set = months.get(e.brand.key) ?? new Set<number>();
    set.add(monthIndex(e.month));
    months.set(e.brand.key, set);
  }
  const byBrand = new Map<string, BrandLifecycle>();
  const counts = { active: 0, new: 0, recurring: 0, inactive: 0, lost: 0 };
  for (const [brand, set] of months) {
    if (f.brand && brand !== f.brand) continue;
    const list = [...set].sort((a, b) => a - b);
    const first = list[0];
    const last = list[list.length - 1];
    const active = list.some((m) => m >= start && m <= end);
    if (active) {
      counts.active++;
      if (first >= start) {
        counts.new++;
        byBrand.set(brand, "nova");
      } else if (list.length >= 2) {
        counts.recurring++;
        byBrand.set(brand, "recorrente");
      } else byBrand.set(brand, "ativa");
    } else {
      const gap = end - last;
      if (gap > 6) {
        counts.lost++;
        byBrand.set(brand, "perdida");
      } else if (gap >= 4) {
        counts.inactive++;
        byBrand.set(brand, "inativa");
      }
    }
  }
  return { ...counts, byBrand };
}

export interface GrowthFactors {
  brands: number;
  deliveriesPerBrand: number | null;
  avgTicketCents: number | null;
  grossCents: number;
}

export function growthFactors(entries: SheetEntry[]): GrowthFactors {
  const monetary = forBrands(entries).filter((e) => e.kind === "monetaria");
  const brands = new Set(monetary.map((e) => e.brand.key)).size;
  const gross = sum(monetary, (e) => e.grossCents);
  return {
    brands,
    deliveriesPerBrand: brands ? monetary.length / brands : null,
    avgTicketCents: monetary.length ? gross / monetary.length : null,
    grossCents: gross,
  };
}

export interface GrowthDecomposition {
  current: GrowthFactors;
  previous: GrowthFactors;
  /** Share of the volume change explained by each factor (log decomposition); sums to 1. */
  shares: { brands: number; deliveriesPerBrand: number; avgTicket: number } | null;
}

/**
 * Volume (K) = brands × deliveries per brand × average ticket. The change between two
 * periods is split among the three factors. Describes what changed; it does not prove why.
 */
export function decomposeGrowth(current: GrowthFactors, previous: GrowthFactors): GrowthDecomposition {
  const ok =
    current.grossCents > 0 && previous.grossCents > 0 && current.grossCents !== previous.grossCents &&
    current.deliveriesPerBrand && previous.deliveriesPerBrand && current.avgTicketCents && previous.avgTicketCents;
  if (!ok) return { current, previous, shares: null };
  const total = Math.log(current.grossCents / previous.grossCents);
  return {
    current,
    previous,
    shares: {
      brands: Math.log(current.brands / previous.brands) / total,
      deliveriesPerBrand: Math.log(current.deliveriesPerBrand! / previous.deliveriesPerBrand!) / total,
      avgTicket: Math.log(current.avgTicketCents! / previous.avgTicketCents!) / total,
    },
  };
}

/** Period of the same length immediately before, and the same period one year earlier. */
export function previousPeriod(f: Filter): Filter {
  const len = monthIndex(f.to) - monthIndex(f.from) + 1;
  const toIdx = monthIndex(f.from) - 1;
  const fromIdx = toIdx - len + 1;
  const ref = (i: number) => ({ year: Math.floor(i / 12), month: (i % 12) + 1 });
  return { ...f, from: ref(fromIdx), to: ref(toIdx) };
}

export function samePeriodLastYear(f: Filter): Filter {
  return { ...f, from: { ...f.from, year: f.from.year - 1 }, to: { ...f.to, year: f.to.year - 1 } };
}

// ---------------------------------------------------------------- goals

export interface GoalProgress {
  targetCents: number;
  realizedCents: number;
  percent: number | null;
  remainingCents: number;
  /** Year-end projection at the current pace; only with at least 3 months of data. */
  projectionCents: number | null;
}

export function goalProgress(targetCents: number, realizedCents: number, monthsElapsed?: number): GoalProgress {
  return {
    targetCents,
    realizedCents,
    percent: targetCents > 0 ? realizedCents / targetCents : null,
    remainingCents: Math.max(0, targetCents - realizedCents),
    projectionCents: monthsElapsed && monthsElapsed >= 3 ? Math.round((realizedCents / monthsElapsed) * 12) : null,
  };
}

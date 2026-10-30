import { describe, expect, it } from "vitest";
import { parseSheet } from "@/lib/domain/sheet";
import {
  brandLifecycle, brandStats, concentration, decomposeGrowth, Filter, goalProgress, growthFactors, inFilter,
  monthlySeries, previousPeriod, summarize,
} from "@/lib/domain/metrics";

const HEADER = ["NF", "MARCA", "Influenciador", "Mês", "ANO", "", "", "", "Data do JOB", "Data Receber o JOB",
  "Valor Total", "Valor Influenciador", "Valor Assessoria", "", "", "pagamento"];
const MONTHS = ["", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function row(o: { nf?: string; brand: string; creator?: string; m: number; y?: number; j?: string; k: number; l?: number; mm: number; p?: string }) {
  return [o.nf ?? "", o.brand, o.creator ?? "NAT", MONTHS[o.m], String(o.y ?? 2026), "", "", "", "", o.j ?? "", brl(o.k), brl(o.l ?? o.k - o.mm), brl(o.mm), "", "", o.p ?? ""];
}

const TODAY = "2026-10-30";
const entries = parseSheet([HEADER,
  row({ brand: "A", m: 9, k: 10000, mm: 2000, p: "PAGO", j: "15/10/2026", nf: "1 e 2" }),
  row({ brand: "A", m: 10, k: 10000, mm: 2000, j: "29/10/2026", nf: "3 e 4" }), // vencido
  row({ brand: "B", m: 10, k: 5000, mm: 1500, creator: "JESSICA", j: "30/10/2026" }), // vence hoje, sem NF
  row({ brand: "C", m: 10, k: 4000, mm: 800, j: "14/11/2026" }), // a receber
  row({ brand: "C", m: 10, k: 3000, mm: 600, p: "PERMUTA" }),
  row({ brand: "D", m: 8, y: 2025, k: 9000, mm: 1800, p: "PAGO", j: "15/09/2025" }),
  row({ brand: "E", m: 8, y: 2025, k: 9000, mm: 0, p: "PREJUÍZO" }),
  row({ brand: "DIVERSAS", m: 9, k: 63400, mm: 12680, p: "PAGO", j: "30/09/2026" }),
], []).entries;

const filter: Filter = { from: { year: 2026, month: 9 }, to: { year: 2026, month: 10 }, basis: "vigencia" };

describe("summarize (§13)", () => {
  const s = summarize(entries.filter((e) => inFilter(e, filter)), TODAY);

  it("money totals use only monetary rows; K and M separate", () => {
    expect(s.deliveries).toBe(5);
    expect(s.grossCents).toBe(9240000);
    expect(s.w7Cents).toBe(1898000);
  });

  it("splits W7 revenue by situation", () => {
    expect(s.byStatus.recebido.w7Cents).toBe(1468000);
    expect(s.byStatus.vencido.w7Cents).toBe(200000);
    expect(s.byStatus.vence_hoje.w7Cents).toBe(150000);
    expect(s.byStatus.a_receber.w7Cents).toBe(80000);
  });

  it("permuta is counted apart; losses stay out of the period totals", () => {
    expect(s.nonMonetary).toBe(1);
    expect(s.losses.count).toBe(0);
  });

  it("invoiced vs not invoiced is independent from payment", () => {
    expect(s.invoiced.count).toBe(2);
    expect(s.notInvoiced.count).toBe(3);
  });
});

describe("date basis", () => {
  it("by receipt month uses column J", () => {
    const byReceipt = summarize(entries.filter((e) => inFilter(e, { ...filter, basis: "recebimento", from: { year: 2026, month: 11 }, to: { year: 2026, month: 11 } })), TODAY);
    expect(byReceipt.w7Cents).toBe(80000);
  });

  it("monthly series", () => {
    const series = monthlySeries(entries, filter, TODAY);
    expect(series.map((p) => [p.key, p.w7Cents, p.w7ReceivedCents])).toEqual([["2026-09", 1468000, 1468000], ["2026-10", 430000, 0]]);
  });
});

describe("commercial", () => {
  const period = entries.filter((e) => inFilter(e, filter));

  it("brand stats exclude undocumented 2023 rows and count permutas as deliveries", () => {
    const stats = brandStats(period);
    expect(stats.map((b) => b.key)).toEqual(["A", "B", "C"]);
    expect(stats.find((b) => b.key === "C")).toMatchObject({ deliveries: 2, monetaryDeliveries: 1, grossCents: 400000 });
  });

  it("concentration of W7 revenue", () => {
    const c = concentration(brandStats(period));
    expect(c.top1).toBeCloseTo(4000 / 6300);
    expect(c.top3).toBe(1);
  });

  it("lifecycle: new, recurring, lost", () => {
    const life = brandLifecycle(entries, { ...filter, from: { year: 2026, month: 10 } });
    expect(life.byBrand.get("A")).toBe("recorrente");
    expect(life.byBrand.get("B")).toBe("nova");
    expect(life.byBrand.get("D")).toBe("perdida");
  });

  it("growth decomposition explains the whole change", () => {
    const g = decomposeGrowth(growthFactors(entries.filter((e) => inFilter(e, { ...filter, from: { year: 2026, month: 10 } }))), growthFactors(entries.filter((e) => inFilter(e, { ...filter, to: { year: 2026, month: 9 } }))));
    const s = g.shares!;
    expect(s.brands + s.deliveriesPerBrand + s.avgTicket).toBeCloseTo(1);
  });

  it("previous period has the same length", () => {
    expect(previousPeriod(filter)).toMatchObject({ from: { year: 2026, month: 7 }, to: { year: 2026, month: 8 } });
  });
});

describe("goals (§14)", () => {
  it("percent, remaining and projection only with enough data", () => {
    expect(goalProgress(10000000, 2500000, 2)).toMatchObject({ percent: 0.25, remainingCents: 7500000, projectionCents: null });
    expect(goalProgress(10000000, 3000000, 3).projectionCents).toBe(12000000);
  });
});

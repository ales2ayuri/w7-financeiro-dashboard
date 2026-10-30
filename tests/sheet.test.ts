import { describe, expect, it } from "vitest";
import { parseSheet, Merge } from "@/lib/domain/sheet";
import { financialStatus, issuesAt } from "@/lib/domain/status";

// Synthetic rows that reproduce the patterns found in the real FINANCEIRO tab.
// Columns: A NF, B MARCA, C Influenciador, D Mês, E ANO, F Contato, G Descrição, H Status,
// I Data do JOB, J Data Receber, K Valor Total, L Valor Influenciador, M Valor Assessoria,
// N Valor Parceiro, O Parceiro, P pagamento.
const HEADER = [
  "NF", "MARCA", "Influenciador", "Mês", "ANO", "Contato", "Descrição", "Status", "Data do JOB",
  " Data Receber o JOB", "Valor Total", "Valor Influenciador", " Valor Assessoria", " Valor Parceiro", " Parceiro", "pagamento",
];

type RowInput = Partial<Record<"A" | "B" | "C" | "D" | "E" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "O" | "P", string>>;

function row(r: RowInput): string[] {
  return [r.A ?? "", r.B ?? "", r.C ?? "", r.D ?? "", r.E ?? "", "", r.G ?? "", r.H ?? "", r.I ?? "", r.J ?? "",
    r.K ?? "", r.L ?? "", r.M ?? "", "", r.O ?? "", r.P ?? ""];
}

const base: RowInput = { B: "MARCA A", C: "NAT", D: "OUTUBRO", E: "2026", I: "30/10/2026", K: " R$ 10.000,00 ", L: " R$ 8.000,00 ", M: " R$ 2.000,00 " };
const TODAY = "2026-10-30";

function parse(rows: RowInput[], merges: Merge[] = []) {
  return parseSheet([HEADER, ...rows.map(row)], merges);
}

describe("header validation", () => {
  it("stops the import when columns move", () => {
    const shifted = [...HEADER];
    shifted.splice(10, 0, "NOVA COLUNA");
    const result = parseSheet([shifted, row(base)], []);
    expect(result.headerProblems.length).toBeGreaterThan(0);
    expect(result.entries).toEqual([]);
  });
});

describe("values (§7)", () => {
  it("reads K, L and M separately and never derives M from K - L", () => {
    const [e] = parse([{ ...base, K: " R$ 6.000,00 ", L: " R$ 4.800,00 ", M: " R$ 1.800,00 ", P: "PAGO", J: "13/09/2026" }]).entries;
    expect(e.grossCents).toBe(600000);
    expect(e.creatorCents).toBe(480000);
    expect(e.w7Cents).toBe(180000);
  });

  it("each row is one delivery: recurring rows are kept as they are, never multiplied", () => {
    const rows = [1, 2, 3].map((n) => ({ ...base, H: ` ${n} DE 9`, D: ["ABRIL", "MAIO", "JUNHO"][n - 1], E: "2025", I: "", P: "PAGO", J: "30/06/2025", K: " R$ 24.000,00 ", M: " R$ 4.800,00 " }));
    const { entries } = parse(rows);
    expect(entries).toHaveLength(3);
    expect(entries.reduce((t, e) => t + (e.grossCents ?? 0), 0)).toBe(7200000);
  });
});

describe("payment status (§9)", () => {
  it("PAGO is received on the J date", () => {
    const [e] = parse([{ ...base, P: "PAGO", J: "29/09/2026" }]).entries;
    expect(financialStatus(e, TODAY)).toBe("recebido");
    expect(e.paymentDate).toBe("2026-09-29");
  });

  it("PAGO without J is received with a missing-date alert", () => {
    const [e] = parse([{ ...base, P: "PAGO" }]).entries;
    expect(financialStatus(e, TODAY)).toBe("recebido");
    expect(e.issues).toContain("pago_sem_data");
  });

  it("pending rows: future, today and past", () => {
    const { entries } = parse([
      { ...base, J: "14/11/2026" },
      { ...base, J: "30/10/2026" },
      { ...base, J: "29/09/2026" },
    ]);
    expect(entries.map((e) => financialStatus(e, TODAY))).toEqual(["a_receber", "vence_hoje", "vencido"]);
  });

  it("partial, verification and wrong account", () => {
    const { entries } = parse([
      { ...base, P: "PAGO PARCIAL FALTA NAT", J: "19/01/2026" },
      { ...base, P: "VERIFICAR", J: "14/04/2026" },
      { ...base, P: "PAGO EM CONTA ERRADA RESOLVER INTERNAMENTE", J: "30/12/2025" },
    ]);
    expect(entries.map((e) => financialStatus(e, TODAY))).toEqual(["parcial", "verificacao", "recebido"]);
    expect(entries[2].issues).toContain("pago_conta_errada");
  });

  it("PAGO with J in the future raises an alert", () => {
    const [e] = parse([{ ...base, P: "PAGO", J: "14/11/2026" }]).entries;
    expect(financialStatus(e, TODAY)).toBe("recebido");
    expect(issuesAt(e, TODAY)).toContain("pago_data_futura");
  });

  it("invoice and payment are independent controls (§10)", () => {
    const [e] = parse([{ ...base, A: "47 e 416", J: "29/09/2026" }]).entries;
    expect(e.nf.status).toBe("emitida");
    expect(financialStatus(e, TODAY)).toBe("vencido");
  });
});

describe("exceptions (§11)", () => {
  it("permuta and voucher are non-monetary", () => {
    const { entries } = parse([
      { ...base, P: "PERMUTA" },
      { ...base, L: "PERMUTA", M: "PERMUTA" },
      { ...base, A: "VOUCHER", P: "PAGO", J: "14/04/2025" },
    ]);
    expect(entries.map((e) => financialStatus(e, TODAY))).toEqual(["nao_monetario", "nao_monetario", "nao_monetario"]);
    expect(entries[2].issues).toContain("voucher_marcado_pago");
  });

  it("PREJUÍZO goes to losses with the loss informed in column O", () => {
    const [e] = parse([{ ...base, M: "", O: "-R$ 5.400,00 ", P: "PREJUÍZO", J: "15/09/2025" }]).entries;
    expect(financialStatus(e, TODAY)).toBe("perda");
    expect(e.lossCents).toBe(-540000);
  });

  it("DIVERSAS 2023 rows enter the totals, flagged as undocumented, month from J", () => {
    const [e] = parse([{ B: "DIVERSAS", C: "NAT", D: "JAN A SET", E: "2023", I: "2023", J: "30/09/2023", K: " R$ 63.400,00 ", M: " R$ 12.680,00 ", P: "PAGO" }]).entries;
    expect(e.undocumented).toBe(true);
    expect(e.month).toEqual({ year: 2023, month: 9 });
    expect(e.monthSource).toBe("data_pagamento");
  });

  it("VITORIA without surname is Vitória Beato (user decision); Dozzo stays separate", () => {
    const { entries } = parse([{ ...base, C: "VITORIA" }, { ...base, C: "VITORIA BEATO" }, { ...base, C: "VITORIA DOZZO" }]);
    expect(entries.map((e) => e.creator.name)).toEqual(["VITÓRIA BEATO", "VITÓRIA BEATO", "VITORIA DOZZO"]);
  });

  it("zero or empty commission is flagged, never corrected", () => {
    const [e] = parse([{ ...base, M: " R$ -   ", P: "PAGO", J: "20/03/2024" }]).entries;
    expect(e.w7Cents).toBe(0);
    expect(e.issues).toContain("comissao_zerada_ou_vazia");
  });
});

describe("sheet structure", () => {
  it("merged cells apply to every merged row (rows 119-121 pattern)", () => {
    const rows = [
      { ...base, A: "NF 2 e 219", P: "PAGO", J: "29/12/2024" },
      { ...base, B: "GOCASE ADENDO", J: "29/12/2024" },
      { ...base, B: "GOCASE EXTRA BLACK", J: "29/12/2024" },
    ];
    const merges: Merge[] = [
      { startRow: 1, endRow: 4, startCol: 0, endCol: 1 },
      { startRow: 1, endRow: 4, startCol: 15, endCol: 16 },
    ];
    const { entries } = parse(rows, merges);
    expect(entries.map((e) => e.paymentRaw)).toEqual(["PAGO", "PAGO", "PAGO"]);
    expect(entries.map((e) => e.nf.w7Nf)).toEqual(["2", "2", "2"]);
    expect(entries.map((e) => e.brand.name)).toEqual(["MARCA A", "GOCASE", "GOCASE"]);
  });

  it("merges over value columns are not propagated", () => {
    const merges: Merge[] = [{ startRow: 1, endRow: 3, startCol: 10, endCol: 11 }];
    const result = parse([base, { ...base, K: "" }], merges);
    expect(result.valueMerges).toHaveLength(1);
    expect(result.entries[1].grossCents).toBeNull();
  });

  it("skips rows without brand and creator, keeps row numbers", () => {
    const { entries } = parse([base, { K: " R$ 7.700,00 " }, base]);
    expect(entries.map((e) => e.row)).toEqual([2, 4]);
  });

  it("repeated brands are recurrence, not duplicates; identical rows are flagged for review", () => {
    const { entries } = parse([
      { ...base, D: "SETEMBRO", I: "30/09/2026" },
      { ...base },
      { ...base, G: "1 COMBO" },
      { ...base, G: "1 COMBO" },
    ]);
    expect(entries.map((e) => e.issues.includes("possivel_duplicidade"))).toEqual([false, false, true, true]);
  });

  it("job deadline in a different month from D/E is flagged", () => {
    const [e] = parse([{ ...base, D: "JULHO", E: "2025", I: "04/12/2024" }]).entries;
    expect(e.month).toEqual({ year: 2025, month: 7 });
    expect(e.issues).toContain("mes_job_diferente");
  });

  it("empty year falls back to the job deadline month", () => {
    const [e] = parse([{ ...base, E: "", I: "30/08/2026" }]).entries;
    expect(e.month).toEqual({ year: 2026, month: 8 });
    expect(e.issues).toContain("ano_vazio");
  });
});

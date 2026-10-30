import { describe, expect, it } from "vitest";
import { AsanaTaskPayload, ASANA_FIELD, parseAsanaTask } from "@/lib/domain/asana";
import { reconcile } from "@/lib/domain/reconcile";
import { parseSheet } from "@/lib/domain/sheet";

const PROJECT = "1211247788752322";
const TODAY = "2026-10-30";

function task(overrides: Partial<AsanaTaskPayload> & {
  valor?: number | null;
  status?: string | null;
  creator?: string | null;
  conteudo?: string | null;
  nf?: string | null;
  pct?: number | null;
  comissao?: number | null;
}): AsanaTaskPayload {
  const { valor = null, status = null, creator = null, conteudo = null, nf = null, pct = null, comissao = 0, ...rest } = overrides;
  return {
    gid: "1",
    name: "MARCA A | NAT: OUT 26",
    parent: null,
    completed: false,
    created_at: "2026-09-01T12:00:00.000Z",
    memberships: [{ project: { gid: PROJECT }, section: { name: "EM ANDAMENTO" } }],
    custom_fields: [
      { gid: ASANA_FIELD.valorContrato, number_value: valor },
      { gid: ASANA_FIELD.status, enum_value: status ? { name: status } : null },
      { gid: ASANA_FIELD.influenciadora, enum_value: creator ? { name: creator } : null },
      { gid: ASANA_FIELD.dataConteudo, date_value: conteudo ? { date: conteudo } : null },
      { gid: ASANA_FIELD.notaFiscal, text_value: nf },
      { gid: ASANA_FIELD.pctComissao, number_value: pct },
      { gid: ASANA_FIELD.valorComissao, number_value: comissao },
    ],
    ...rest,
  };
}

const HEADER = ["NF", "MARCA", "Influenciador", "Mês", "ANO", "", "", "", "Data do JOB", "Data Receber o JOB",
  "Valor Total", "Valor Influenciador", "Valor Assessoria", "", "", "pagamento"];

function sheet(rows: string[][]) {
  return parseSheet([HEADER, ...rows], []).entries;
}

describe("parseAsanaTask (§12)", () => {
  it("reads fields by GID", () => {
    const a = parseAsanaTask(task({ valor: 10500, status: "EM ATENDIMENTO", creator: "NAT", conteudo: "2026-10-01", nf: "50" }), PROJECT);
    expect(a).toMatchObject({ contractCents: 1050000, status: "EM ATENDIMENTO", month: { year: 2026, month: 10 }, nfNumbers: ["50"] });
    expect(a.creator?.key).toBe("NAT");
    expect(a.sections).toEqual(["EM ANDAMENTO"]);
  });

  it("excludes automatic subtasks and the template task", () => {
    expect(parseAsanaTask(task({ name: "GOCASE NAT | SETEMBRO : EMISSÃO NF" }), PROJECT).excluded).toBe("subtarefa_automatica");
    expect(parseAsanaTask(task({ name: "X | Y: PAGAMENTO", parent: { gid: "9" } }), PROJECT).excluded).toBe("subtarefa_automatica");
    expect(parseAsanaTask(task({ name: "[LER] Instruções para usar o modelo" }), PROJECT).excluded).toBe("modelo");
  });

  it("0,00 commission on tasks older than the field means not filled", () => {
    const old = parseAsanaTask(task({ created_at: "2025-08-20T18:15:54.262Z", comissao: 0 }), PROJECT);
    expect(old).toMatchObject({ commissionUnfilled: true, commissionCents: null });
    const recent = parseAsanaTask(task({ created_at: "2026-10-13T18:25:02.096Z", comissao: 0 }), PROJECT);
    expect(recent).toMatchObject({ commissionUnfilled: false, commissionCents: 0 });
  });

  it("missing values are null, never zero", () => {
    const a = parseAsanaTask(task({}), PROJECT);
    expect(a.contractCents).toBeNull();
    expect(a.status).toBeNull();
  });

  it("guesses the month from the name only as a hint", () => {
    expect(parseAsanaTask(task({ name: "EMMA | NAT: OUT 26" }), PROJECT).monthHint).toEqual({ year: 2026, month: 10 });
    expect(parseAsanaTask(task({ name: "GOCASE NAT | SETEMBRO", created_at: "2025-08-20T00:00:00Z" }), PROJECT).monthHint)
      .toEqual({ year: 2025, month: 9 });
  });
});

describe("reconcile (§5)", () => {
  const row = (brand: string, creator: string, month: string, k: string, p = "PAGO", nf = "") =>
    [nf, brand, creator, month, "2025", "", "", "", "", "30/12/2025", k, "", " R$ 1.000,00 ", "", "", p];

  it("links the same delivery once, high confidence when all keys agree", () => {
    const s = sheet([row("DENAVITA", "NAT", "SETEMBRO", " R$ 13.000,00 ")]);
    const a = [parseAsanaTask(task({ gid: "t1", name: "DENAVITA | NAT SETEMBRO", valor: 13000, status: "RECEBIDO", creator: "NAT", conteudo: "2025-09-01" }), PROJECT)];
    const r = reconcile(s, a, TODAY);
    expect(r.links).toEqual([expect.objectContaining({ sheetRows: [2], asanaGid: "t1", confidence: "alta", divergences: [] })]);
    expect(r.onlySheet).toEqual([]);
    expect(r.onlyAsana).toEqual([]);
  });

  it("reports value and status divergences without fixing them", () => {
    const s = sheet([row("TEMU", "BELLA", "JULHO", " R$ 8.250,00 ", "PAGO PARCIAL")]);
    const a = [parseAsanaTask(task({ gid: "t1", name: "TEMU | BELLA", valor: 7800, status: "RECEBIDO", creator: "BELLA", conteudo: "2025-07-01" }), PROJECT)];
    const [link] = reconcile(s, a, TODAY).links;
    expect(link.confidence).toBe("media");
    expect(link.divergences).toEqual(["valor_contrato", "status"]);
  });

  it("reports a month divergence when value and keys agree", () => {
    const s = sheet([row("EMMA", "NAT", "OUTUBRO", " R$ 10.500,00 ", "")]);
    const a = [parseAsanaTask(task({ gid: "t1", name: "EMMA | NAT", valor: 10500, status: "EM ATENDIMENTO", creator: "NAT", conteudo: "2025-11-01" }), PROJECT)];
    const [link] = reconcile(s, a, TODAY).links;
    expect(link.divergences).toEqual(["mes"]);
  });

  it("one task covering two rows (OUT + EXTRA) is suggested when values add up exactly", () => {
    const s = sheet([
      row("GOCASE", "NAT", "OUTUBRO", " R$ 7.000,00 "),
      row("GOCASE", "NAT", "OUTUBRO", " R$ 24.000,00 "),
    ]);
    const a = [parseAsanaTask(task({ gid: "t1", name: "GOCASE NAT | OUT + EXTRA", valor: 31000, status: "RECEBIDO", creator: "NAT", conteudo: "2025-10-01" }), PROJECT)];
    const [link] = reconcile(s, a, TODAY).links;
    expect(link.sheetRows.sort()).toEqual([2, 3]);
    expect(link.divergences).toContain("agrupado");
    expect(link.divergences).not.toContain("valor_contrato");
  });

  it("only compares from July 2025 and leaves unmatched records on each side", () => {
    const s = sheet([
      row("ARTEX", "NAT", "MARÇO", " R$ 4.000,00 "),
      row("HAVAN", "NAT", "AGOSTO", " R$ 6.000,00 "),
    ]);
    const a = [parseAsanaTask(task({ gid: "t9", name: "SHEIN | BELLA JUNHO", status: "PERMUTA", creator: "BELLA", conteudo: "2026-06-01" }), PROJECT)];
    const r = reconcile(s, a, TODAY);
    expect(r.onlySheet).toEqual([3]);
    expect(r.onlyAsana).toEqual(["t9"]);
  });

  it("similar records of a recurring brand are not merged", () => {
    const s = sheet([
      row("REDSILVER", "ALAÍNE", "AGOSTO", " R$ 2.000,00 "),
      row("REDSILVER", "ALAÍNE", "SETEMBRO", " R$ 3.000,00 "),
    ]);
    const a = [
      parseAsanaTask(task({ gid: "a", name: "REDSILVER | ALAINE AGOSTO", valor: 2000, status: "RECEBIDO", creator: "ALAÍNE", conteudo: "2025-08-01" }), PROJECT),
      parseAsanaTask(task({ gid: "b", name: "REDSILVER ALAINE | SETEMBRO", valor: 3000, status: "RECEBIDO", creator: "ALAÍNE", conteudo: "2025-09-01" }), PROJECT),
    ];
    const r = reconcile(s, a, TODAY);
    expect(r.links.map((l) => [l.sheetRows[0], l.asanaGid])).toEqual([[2, "a"], [3, "b"]]);
  });
});

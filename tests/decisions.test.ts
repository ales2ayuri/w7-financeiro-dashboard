import { describe, expect, it } from "vitest";
import { applyDecisions, Decision, isCurrent, linkKey } from "@/lib/domain/decisions";
import { ReconciliationResult } from "@/lib/domain/reconcile";

const score = { total: 90, nf: 0, brand: 30, creator: 20, month: 20, value: 20 };
const result: ReconciliationResult = {
  links: [
    { sheetRows: [2], asanaGid: "a", score, confidence: "alta", divergences: [] },
    { sheetRows: [3], asanaGid: "b", score: { ...score, total: 70, value: 0 }, confidence: "media", divergences: ["valor_contrato"] },
  ],
  onlySheet: [4],
  onlyAsana: ["c"],
  excludedAsana: ["x"],
};

function decision(subjectKey: string, action: Decision["action"], extra: Partial<Decision> = {}): Decision {
  return {
    subjectType: "conciliacao",
    subjectKey,
    action,
    justification: "conferido",
    dataOrigin: "planilha + asana",
    subjectHash: null,
    payload: {},
    decidedBy: "w7@example.com",
    decidedAt: "2026-10-30T12:00:00Z",
    ...extra,
  };
}

describe("applyDecisions", () => {
  it("without decisions everything stays as suggested", () => {
    const r = applyDecisions(result, []);
    expect(r.links.map((l) => l.state)).toEqual(["sugerido", "sugerido"]);
    expect(r.onlySheet).toEqual([4]);
    expect(r.onlyAsana).toEqual(["c"]);
  });

  it("undoing a link frees both records; a manual link replaces it", () => {
    const r = applyDecisions(result, [
      decision(linkKey([3], "b"), "desfazer"),
      decision(linkKey([4], "b"), "vincular", { payload: { sheetRows: [4], asanaGid: "b" }, decidedAt: "2026-10-30T13:00:00Z" }),
    ]);
    expect(r.links.map((l) => [l.sheetRows, l.asanaGid, l.state])).toEqual([[[4], "b", "manual"], [[2], "a", "sugerido"]]);
    expect(r.onlySheet).toEqual([3]);
    expect(r.onlyAsana).toEqual(["c"]);
  });

  it("the latest decision wins, earlier ones stay in history", () => {
    const r = applyDecisions(result, [
      decision(linkKey([2], "a"), "desfazer", { decidedAt: "2026-10-30T10:00:00Z" }),
      decision(linkKey([2], "a"), "confirmar", { decidedAt: "2026-10-30T11:00:00Z" }),
    ]);
    expect(r.links.find((l) => l.asanaGid === "a")?.state).toBe("confirmado");
  });

  it("ignored unmatched records leave the open list", () => {
    const r = applyDecisions(result, [decision("asana:c", "ignorar")]);
    expect(r.onlyAsana).toEqual([]);
    expect(r.ignoredAsana).toEqual(["c"]);
  });

  it("a decision reopens when the record changes", () => {
    const d = decision("row:2:comissao_zerada_ou_vazia", "revisado", { subjectType: "alerta", subjectHash: "h1" });
    expect(isCurrent(d, "h1")).toBe(true);
    expect(isCurrent(d, "h2")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { parseMoney } from "@/lib/domain/money";
import { parseBrDate, parseMonthName, todayInSaoPaulo } from "@/lib/domain/dates";
import { parseNf } from "@/lib/domain/nf";
import { normalizeBrand } from "@/lib/domain/normalize";

describe("parseMoney", () => {
  it.each([
    [" R$ 4.000,00 ", 400000],
    ["R$0,00", 0],
    [" R$ -   ", 0],
    ["-R$ 5.400,00 ", -540000],
    ["R$ 17.003,41", 1700341],
    ["R$ 450,00", 45000],
  ])("%s -> %i centavos", (raw, cents) => {
    expect(parseMoney(raw)).toEqual({ kind: "value", cents });
  });

  it("keeps text and empty cells apart from zero", () => {
    expect(parseMoney(" PERMUTA")).toEqual({ kind: "text", text: "PERMUTA" });
    expect(parseMoney("")).toEqual({ kind: "empty" });
  });
});

describe("dates", () => {
  it("parses dd/mm/yyyy and d/m/yyyy", () => {
    expect(parseBrDate("30/10/2026")).toBe("2026-10-30");
    expect(parseBrDate("8/1/2025")).toBe("2025-01-08");
  });

  it("rejects placeholders and non-dates", () => {
    expect(parseBrDate("29/01/1900")).toBeNull();
    expect(parseBrDate("2023")).toBeNull();
    expect(parseBrDate("-")).toBeNull();
    expect(parseBrDate("31/02/2026")).toBeNull();
  });

  it("reads month names with accents and spaces", () => {
    expect(parseMonthName("MARÇO ")).toBe(3);
    expect(parseMonthName("NOVEMBRO ")).toBe(11);
    expect(parseMonthName("JAN A SET")).toBeNull();
  });

  it("computes today in São Paulo", () => {
    expect(todayInSaoPaulo(new Date("2026-10-31T02:30:00Z"))).toBe("2026-10-30");
  });
});

describe("parseNf (§10)", () => {
  it("two numbers: 1st is W7, 2nd is creator", () => {
    expect(parseNf("141 e 355")).toMatchObject({ status: "emitida", w7Nf: "141", creatorNf: "355", nonStandard: false });
    expect(parseNf("7 + 78")).toMatchObject({ w7Nf: "7", creatorNf: "78", nonStandard: false });
    expect(parseNf("NF 2 e 219")).toMatchObject({ w7Nf: "2", creatorNf: "219", nonStandard: false });
  });

  it("one number: issued, issuer not identified", () => {
    expect(parseNf("86")).toMatchObject({ status: "emitida", w7Nf: null, unidentifiedNf: "86", nonStandard: false });
  });

  it("no number: not issued", () => {
    for (const raw of ["", "S/NF", "S/ NF", "SN", "SEM NF", "VOUCHER", "PERMUTA", "NÃO FATURAR"]) {
      expect(parseNf(raw)).toMatchObject({ status: "nao_emitida", nonStandard: false });
    }
  });

  it("flags text outside the pattern", () => {
    expect(parseNf("ok ").nonStandard).toBe(true);
    expect(parseNf("cesar").nonStandard).toBe(true);
    expect(parseNf("NF 009 E ?")).toMatchObject({ status: "emitida", nonStandard: true });
    expect(parseNf("76 E ")).toMatchObject({ status: "emitida", nonStandard: true });
    expect(parseNf("3 E 214 + 223 (CORRIGIDA)").nonStandard).toBe(true);
  });
});

describe("normalizeBrand (§11)", () => {
  it("applies only the approved normalizations", () => {
    expect(normalizeBrand("ED. VIDA").name).toBe("EDITORA VIDA");
    expect(normalizeBrand("HELEN MSA").name).toBe("MENTORIA MSA");
    expect(normalizeBrand("GOCASE EXTRA BLACK").name).toBe("GOCASE");
    expect(normalizeBrand("ED VIDA - PRIORIZE DEUS").name).toBe("ED VIDA - PRIORIZE DEUS");
    expect(normalizeBrand("MARATONE A BÍBLIA (PH)").name).toBe("MARATONE A BÍBLIA (PH)");
    expect(normalizeBrand("BENDITA  CÂNFORA").name).toBe("BENDITA CÂNFORA");
  });
});

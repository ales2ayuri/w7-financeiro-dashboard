import { MonthRef, monthIndex, monthOfDate, parseBrDate, parseMonthName, parseYear, IsoDate } from "./dates";
import { centsOf, MoneyCell, parseMoney } from "./money";
import { NfInfo, parseNf } from "./nf";
import {
  normalizeBrand,
  normalizeCreator,
  NormalizedName,
  UNDOCUMENTED_BRAND_KEY,
  UNIDENTIFIED_CREATOR_KEYS,
} from "./normalize";
import { cleanText, textKey } from "./text";

/** Fixed column layout of the FINANCEIRO tab (0-based index). */
export const COL = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12, N: 13, O: 14, P: 15 } as const;

const EXPECTED_HEADER: [number, string][] = [
  [COL.A, "NF"],
  [COL.B, "MARCA"],
  [COL.C, "INFLUENCIADOR"],
  [COL.D, "MES"],
  [COL.E, "ANO"],
  [COL.I, "DATA DO JOB"],
  [COL.J, "DATA RECEBER O JOB"],
  [COL.K, "VALOR TOTAL"],
  [COL.L, "VALOR INFLUENCIADOR"],
  [COL.M, "VALOR ASSESSORIA"],
  [COL.P, "PAGAMENTO"],
];

/**
 * Returns the columns whose header no longer matches the expected layout. A non-empty
 * result must stop the import: reading shifted columns would produce wrong numbers.
 */
export function validateHeader(header: string[]): string[] {
  return EXPECTED_HEADER.filter(([index, expected]) => textKey(header[index]) !== expected).map(
    ([index, expected]) => `Coluna ${String.fromCharCode(65 + index)}: esperado "${expected}", encontrado "${cleanText(header[index])}"`,
  );
}

export interface Merge {
  startRow: number; // 0-based, inclusive
  endRow: number; // exclusive
  startCol: number;
  endCol: number;
}

/**
 * The Sheets API returns a merged value only in the top-left cell. Copies it to every
 * cell of the merge so each row carries the value the user sees (e.g. rows 119-121).
 */
export function applyMerges(grid: string[][], merges: Merge[]): string[][] {
  const out = grid.map((row) => [...row]);
  for (const m of merges) {
    const value = out[m.startRow]?.[m.startCol] ?? "";
    for (let r = m.startRow; r < m.endRow; r++) {
      out[r] ??= [];
      for (let c = m.startCol; c < m.endCol; c++) out[r][c] = value;
    }
  }
  return out;
}

/** Merges that cover value columns are not propagated silently; they go to review. */
export function mergesOverValueColumns(merges: Merge[]): Merge[] {
  return merges.filter((m) => m.startCol <= COL.M && m.endCol > COL.K);
}

export type EntryKind = "monetaria" | "permuta" | "voucher" | "prejuizo" | "nao_faturar";
export type PaymentMark = "pago" | "pago_conta_errada" | "pago_parcial" | "verificar" | "pendente" | "outro";

export type IssueCode =
  | "comissao_zerada_ou_vazia"
  | "valor_total_vazio"
  | "texto_em_valor"
  | "mes_referencia_invalido"
  | "ano_vazio"
  | "mes_job_diferente"
  | "data_job_invalida"
  | "data_pagamento_invalida"
  | "nf_fora_padrao"
  | "voucher_marcado_pago"
  | "pago_sem_data"
  | "pago_data_futura"
  | "pendente_sem_previsao"
  | "pago_conta_errada"
  | "status_pagamento_desconhecido"
  | "creator_nao_identificada"
  | "possivel_duplicidade"
  | "nf_repetida";

export interface SheetEntry {
  /** Row number as shown in Google Sheets (1-based, header is row 1). */
  row: number;
  raw: string[];
  nf: NfInfo;
  brand: NormalizedName;
  creator: NormalizedName;
  /** Undocumented 2023 rows (DIVERSAS): in financial totals, out of per-brand metrics. */
  undocumented: boolean;
  description: string;
  /** Delivery month: columns D/E, else the job deadline month, else the payment date month. */
  month: MonthRef | null;
  monthSource: "colunas_DE" | "data_job" | "data_pagamento" | null;
  /** Column I: content publication deadline. */
  jobDeadline: IsoDate | null;
  /** Column J: payment forecast, used as the reference date for PAGO rows. */
  paymentDate: IsoDate | null;
  grossCents: number | null; // K
  creatorCents: number | null; // L
  w7Cents: number | null; // M
  kind: EntryKind;
  payment: PaymentMark;
  paymentRaw: string;
  /** Loss informed in column O for PREJUÍZO rows. */
  lossCents: number | null;
  issues: IssueCode[];
}

function paymentMarkOf(key: string): PaymentMark {
  if (key === "") return "pendente";
  if (key.startsWith("PAGO PARCIAL")) return "pago_parcial";
  if (key.startsWith("PAGO EM CONTA ERRADA")) return "pago_conta_errada";
  if (key.startsWith("PAGO")) return "pago";
  if (key === "VERIFICAR") return "verificar";
  return "outro";
}

function kindOf(paymentKey: string, nfKey: string, cells: MoneyCell[]): EntryKind {
  if (paymentKey.startsWith("PREJUIZO")) return "prejuizo";
  if (paymentKey === "NAO FATURAR") return "nao_faturar";
  const permutaInValues = cells.some((c) => c.kind === "text" && c.text.includes("PERMUTA"));
  if (paymentKey.includes("PERMUTA") || nfKey === "PERMUTA" || permutaInValues) return "permuta";
  if (paymentKey === "VOUCHER" || nfKey === "VOUCHER") return "voucher";
  return "monetaria";
}

/** Converts one sheet row. Returns null for rows without brand and creator. */
export function parseSheetRow(cells: string[], row: number): SheetEntry | null {
  const get = (i: number) => cells[i] ?? "";
  if (!cleanText(get(COL.B)) && !cleanText(get(COL.C))) return null;

  const issues: IssueCode[] = [];
  const nf = parseNf(get(COL.A));
  const brand = normalizeBrand(get(COL.B));
  const creator = normalizeCreator(get(COL.C));
  const k = parseMoney(get(COL.K));
  const l = parseMoney(get(COL.L));
  const m = parseMoney(get(COL.M));
  const o = parseMoney(get(COL.O));
  const paymentRaw = cleanText(get(COL.P));
  const paymentKey = textKey(paymentRaw);
  const kind = kindOf(paymentKey, textKey(get(COL.A)), [k, l, m]);
  const payment = paymentMarkOf(paymentKey);

  const jobDeadline = parseBrDate(get(COL.I));
  if (!jobDeadline && cleanText(get(COL.I))) issues.push("data_job_invalida");
  const paymentDate = parseBrDate(get(COL.J));
  if (!paymentDate && cleanText(get(COL.J))) issues.push("data_pagamento_invalida");

  const monthNumber = parseMonthName(get(COL.D));
  const year = parseYear(get(COL.E));
  if (monthNumber === null) issues.push("mes_referencia_invalido");
  if (year === null) issues.push("ano_vazio");
  let month: MonthRef | null = null;
  let monthSource: SheetEntry["monthSource"] = null;
  if (monthNumber !== null && year !== null) {
    month = { year, month: monthNumber };
    monthSource = "colunas_DE";
    if (jobDeadline && monthIndex(monthOfDate(jobDeadline)) !== monthIndex(month)) issues.push("mes_job_diferente");
  } else if (jobDeadline) {
    month = monthOfDate(jobDeadline);
    monthSource = "data_job";
  } else if (paymentDate) {
    // Last resort (e.g. undocumented 2023 rows "JAN A SET"): the payment date month.
    month = monthOfDate(paymentDate);
    monthSource = "data_pagamento";
  }

  if (nf.nonStandard) issues.push("nf_fora_padrao");
  if (UNIDENTIFIED_CREATOR_KEYS.has(creator.key)) issues.push("creator_nao_identificada");

  if (kind === "monetaria") {
    if ([k, l, m].some((c) => c.kind === "text")) issues.push("texto_em_valor");
    if (centsOf(k) === null) issues.push("valor_total_vazio");
    if (!centsOf(m)) issues.push("comissao_zerada_ou_vazia");
    if (payment === "outro") issues.push("status_pagamento_desconhecido");
    if (payment === "pago_conta_errada") issues.push("pago_conta_errada");
    if ((payment === "pago" || payment === "pago_conta_errada") && !paymentDate) issues.push("pago_sem_data");
    if (payment === "pendente" && !paymentDate) issues.push("pendente_sem_previsao");
  }
  if (kind === "voucher" && payment === "pago") issues.push("voucher_marcado_pago");

  return {
    row,
    raw: cells.map((c) => c ?? ""),
    nf,
    brand,
    creator,
    undocumented: brand.key === UNDOCUMENTED_BRAND_KEY,
    description: cleanText(get(COL.G)),
    month,
    monthSource,
    jobDeadline,
    paymentDate,
    grossCents: centsOf(k),
    creatorCents: centsOf(l),
    w7Cents: centsOf(m),
    kind,
    payment,
    paymentRaw,
    lossCents: kind === "prejuizo" ? centsOf(o) : null,
    issues,
  };
}

/** Cross-row checks. Similar rows are flagged for review, never merged or dropped. */
export function flagCrossRowIssues(entries: SheetEntry[]): void {
  const groups = new Map<string, SheetEntry[]>();
  for (const e of entries) {
    if (!e.month) continue;
    const key = [e.brand.key, e.creator.key, e.month.year, e.month.month, textKey(e.description), e.grossCents].join("|");
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  for (const group of groups.values()) {
    if (group.length > 1) group.forEach((e) => e.issues.push("possivel_duplicidade"));
  }

  // Same full set of invoice numbers in different months is suspicious (likely copied).
  // A single shared number is not: numbering is not consistent across the years.
  const byNumbers = new Map<string, SheetEntry[]>();
  for (const e of entries) {
    if (e.nf.numbers.length < 2 || !e.month) continue;
    const key = [...e.nf.numbers].map(Number).sort((a, b) => a - b).join("+");
    byNumbers.set(key, [...(byNumbers.get(key) ?? []), e]);
  }
  for (const group of byNumbers.values()) {
    const months = new Set(group.map((e) => monthIndex(e.month!)));
    if (months.size > 1) group.forEach((e) => e.issues.push("nf_repetida"));
  }
}

export interface ParsedSheet {
  headerProblems: string[];
  valueMerges: Merge[];
  entries: SheetEntry[];
}

/** Full sheet parse: header check, merge propagation, per-row and cross-row rules. */
export function parseSheet(grid: string[][], merges: Merge[]): ParsedSheet {
  const headerProblems = validateHeader(grid[0] ?? []);
  const valueMerges = mergesOverValueColumns(merges);
  if (headerProblems.length > 0) return { headerProblems, valueMerges, entries: [] };

  const safeMerges = merges.filter((m) => !valueMerges.includes(m));
  const filled = applyMerges(grid, safeMerges);
  const entries: SheetEntry[] = [];
  for (let i = 1; i < filled.length; i++) {
    const entry = parseSheetRow(filled[i] ?? [], i + 1);
    if (entry) entries.push(entry);
  }
  flagCrossRowIssues(entries);
  return { headerProblems, valueMerges, entries };
}

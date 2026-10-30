import { AsanaEntry } from "./asana";
import { IsoDate, MonthRef, monthIndex } from "./dates";
import { SheetEntry } from "./sheet";
import { financialStatus } from "./status";
import { textKey } from "./text";

/** Asana comparison starts in July 2025 (§5). */
export const RECONCILIATION_START: MonthRef = { year: 2025, month: 7 };

/** Brand + creator + month + value all exact (90), or an invoice number in common. */
export const HIGH_CONFIDENCE = 85;
export const MIN_SUGGESTION = 60;

export interface MatchScore {
  total: number;
  nf: number;
  brand: number;
  creator: number;
  month: number;
  value: number;
}

const words = (key: string) => key.replace(/[^A-Z0-9]+/g, " ").trim();

function brandScore(sheet: SheetEntry, asana: AsanaEntry): number {
  const name = ` ${asana.brandHint} `;
  const keys = [words(sheet.brand.key), words(textKey(sheet.brand.raw))].filter(Boolean);
  if (keys.some((k) => name.includes(` ${k} `))) return 30;
  const firstWord = keys[0]?.split(" ")[0] ?? "";
  if (firstWord.length >= 4 && name.includes(` ${firstWord} `)) return 15;
  return 0;
}

function creatorScore(sheet: SheetEntry, asana: AsanaEntry): number {
  const a = asana.creator?.key;
  const s = sheet.creator.key;
  if (!a || !s) return 0;
  if (a === s) return 20;
  // "GABY" x "GABY GARCIA": same first name; suggestion only, the user confirms.
  if (a.split(" ")[0] === s.split(" ")[0]) return 10;
  return 0;
}

function monthScore(sheetMonth: MonthRef | null, asana: AsanaEntry): number {
  const a = asana.month ?? asana.monthHint;
  if (!a || !sheetMonth) return 0;
  const diff = Math.abs(monthIndex(a) - monthIndex(sheetMonth));
  return diff === 0 ? 20 : diff === 1 ? 5 : 0;
}

function valueScore(grossCents: number | null, asana: AsanaEntry): number {
  if (asana.contractCents === null || grossCents === null || grossCents === 0) return 0;
  if (asana.contractCents === grossCents) return 20;
  return Math.abs(asana.contractCents - grossCents) / grossCents <= 0.05 ? 5 : 0;
}

function nfScore(sheet: SheetEntry[], asana: AsanaEntry): number {
  return asana.nfNumbers.some((n) => sheet.some((s) => s.nf.numbers.includes(n))) ? 30 : 0;
}

/** Scores one Asana task against one sheet row, or against a group of rows summed. */
export function scoreMatch(sheet: SheetEntry | SheetEntry[], asana: AsanaEntry): MatchScore {
  const rows = Array.isArray(sheet) ? sheet : [sheet];
  const first = rows[0];
  const zero = { total: 0, nf: 0, brand: 0, creator: 0, month: 0, value: 0 };
  if (!first) return zero;
  const brand = Math.min(...rows.map((r) => brandScore(r, asana)));
  if (brand === 0) return zero;
  const gross = rows.every((r) => r.grossCents !== null) ? rows.reduce((t, r) => t + (r.grossCents ?? 0), 0) : null;
  const parts = {
    nf: nfScore(rows, asana),
    brand,
    creator: Math.min(...rows.map((r) => creatorScore(r, asana))),
    month: Math.min(...rows.map((r) => monthScore(r.month, asana))),
    value: valueScore(gross, asana),
  };
  const total = Math.min(100, parts.nf + parts.brand + parts.creator + parts.month + parts.value);
  return { total, ...parts };
}

export type DivergenceCode =
  | "valor_contrato"
  | "comissao"
  | "mes"
  | "creator"
  | "status"
  | "agrupado"
  | "asana_sem_valor"
  | "asana_sem_creator"
  | "asana_sem_data"
  | "asana_sem_status";

export const DIVERGENCE_LABEL: Record<DivergenceCode, string> = {
  valor_contrato: "Valor do contrato diferente (K × VALOR CONTRATO)",
  comissao: "Comissão diferente (M × VALOR COMISSÃO)",
  mes: "Mês diferente (D/E × DATA DO CONTEÚDO)",
  creator: "Creator diferente",
  status: "Status financeiro diferente",
  agrupado: "Uma tarefa do Asana corresponde a várias linhas da planilha",
  asana_sem_valor: "Asana sem VALOR CONTRATO",
  asana_sem_creator: "Asana sem INFLUENCIADORA",
  asana_sem_data: "Asana sem DATA DO CONTEÚDO",
  asana_sem_status: "Asana sem STATUS",
};

type StatusClass = "recebido" | "faturado" | "em_aberto" | "parcial" | "permuta" | "afiliado" | "outro";

function sheetStatusClass(entry: SheetEntry, today: IsoDate): StatusClass | null {
  switch (financialStatus(entry, today)) {
    case "recebido":
      return "recebido";
    case "a_receber":
    case "vence_hoje":
    case "vencido":
      return entry.nf.status === "emitida" ? "faturado" : "em_aberto";
    case "parcial":
      return "parcial";
    case "nao_monetario":
      return "permuta";
    default:
      return null; // in review, loss or excluded: not compared
  }
}

function asanaStatusClass(status: string | null): StatusClass | null {
  switch ((status ?? "").toUpperCase()) {
    case "":
      return null;
    case "RECEBIDO":
      return "recebido";
    case "FATURADO":
      return "faturado";
    case "EMITIR NF":
    case "EM ATENDIMENTO":
    case "EXPANSÃO":
      return "em_aberto";
    case "PERMUTA":
      return "permuta";
    case "AFILIADO":
      return "afiliado";
    default:
      return "outro";
  }
}

export function divergencesOf(sheet: SheetEntry[], asana: AsanaEntry, today: IsoDate): DivergenceCode[] {
  const out: DivergenceCode[] = [];
  if (sheet.length > 1) out.push("agrupado");

  const gross = sheet.reduce((t, s) => t + (s.grossCents ?? 0), 0);
  if (asana.contractCents === null) out.push("asana_sem_valor");
  else if (asana.contractCents !== gross) out.push("valor_contrato");

  // Commission is compared only when the Asana side is really filled (§12).
  const w7 = sheet.reduce((t, s) => t + (s.w7Cents ?? 0), 0);
  if (asana.commissionPct !== null && asana.commissionCents !== null && asana.commissionCents !== w7) {
    out.push("comissao");
  }

  if (!asana.month) out.push("asana_sem_data");
  else if (sheet.some((s) => s.month && monthIndex(s.month) !== monthIndex(asana.month!))) out.push("mes");

  if (!asana.creator) out.push("asana_sem_creator");
  else if (sheet.some((s) => s.creator.key !== asana.creator!.key)) out.push("creator");

  const a = asanaStatusClass(asana.status);
  if (a === null) out.push("asana_sem_status");
  else if (sheet.some((s) => {
    const c = sheetStatusClass(s, today);
    return c !== null && c !== a;
  })) out.push("status");
  return out;
}

export interface ReconciliationLink {
  sheetRows: number[];
  asanaGid: string;
  score: MatchScore;
  confidence: "alta" | "media";
  divergences: DivergenceCode[];
}

export interface ReconciliationResult {
  links: ReconciliationLink[];
  onlySheet: number[];
  onlyAsana: string[];
  /** Asana tasks left out of counts (automatic subtasks, template). */
  excludedAsana: string[];
}

function inPeriod(month: MonthRef | null): boolean {
  return month !== null && monthIndex(month) >= monthIndex(RECONCILIATION_START);
}

/**
 * Suggests links between sheet rows and Asana tasks, in three passes: high-confidence
 * one-to-one links; one task covering two rows of the same brand, creator and month whose
 * values add up exactly to the task value; remaining medium-confidence one-to-one links.
 * Nothing is decided here: the user confirms, undoes or replaces each link (§5).
 */
export function reconcile(sheet: SheetEntry[], asana: AsanaEntry[], today: IsoDate): ReconciliationResult {
  const sheetRows = sheet.filter((s) => inPeriod(s.month));
  const excludedAsana = asana.filter((a) => a.excluded).map((a) => a.gid);
  const tasks = asana.filter((a) => {
    if (a.excluded) return false;
    const month = a.month ?? a.monthHint;
    if (month) return inPeriod(month);
    return (a.createdAt ?? "") >= "2025-07-01";
  });

  const usedRows = new Set<number>();
  const usedTasks = new Set<string>();
  const links: ReconciliationLink[] = [];
  const link = (rows: SheetEntry[], a: AsanaEntry, score: MatchScore) => {
    rows.forEach((r) => usedRows.add(r.row));
    usedTasks.add(a.gid);
    links.push({
      sheetRows: rows.map((r) => r.row),
      asanaGid: a.gid,
      score,
      confidence: score.total >= HIGH_CONFIDENCE ? "alta" : "media",
      divergences: divergencesOf(rows, a, today),
    });
  };

  const single: { s: SheetEntry; a: AsanaEntry; score: MatchScore }[] = [];
  for (const s of sheetRows) {
    for (const a of tasks) {
      const score = scoreMatch(s, a);
      if (score.total >= MIN_SUGGESTION) single.push({ s, a, score });
    }
  }
  single.sort((x, y) => y.score.total - x.score.total || x.s.row - y.s.row);
  const linkSingles = (minScore: number) => {
    for (const { s, a, score } of single) {
      if (score.total >= minScore && !usedRows.has(s.row) && !usedTasks.has(a.gid)) link([s], a, score);
    }
  };
  linkSingles(HIGH_CONFIDENCE);

  // One task covering two rows (e.g. "OUT + EXTRA"): only exact value sums are suggested.
  for (const a of tasks) {
    if (usedTasks.has(a.gid) || a.contractCents === null) continue;
    const free = sheetRows.filter((s) => !usedRows.has(s.row) && scoreMatch(s, a).brand > 0);
    let best: { rows: SheetEntry[]; score: MatchScore } | null = null;
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const rows = [free[i], free[j]];
        if (rows[0].creator.key !== rows[1].creator.key) continue;
        if (!rows[0].month || !rows[1].month || monthIndex(rows[0].month) !== monthIndex(rows[1].month)) continue;
        const score = scoreMatch(rows, a);
        if (score.value === 20 && score.total >= MIN_SUGGESTION && (!best || score.total > best.score.total)) {
          best = { rows, score };
        }
      }
    }
    if (best) link(best.rows, a, best.score);
  }
  linkSingles(MIN_SUGGESTION);

  return {
    links,
    onlySheet: sheetRows.filter((s) => !usedRows.has(s.row)).map((s) => s.row),
    onlyAsana: tasks.filter((a) => !usedTasks.has(a.gid)).map((a) => a.gid),
    excludedAsana,
  };
}

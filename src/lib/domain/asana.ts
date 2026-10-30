import { IsoDate, MonthRef, monthOfDate } from "./dates";
import { normalizeCreator, NormalizedName } from "./normalize";
import { cleanText, textKey } from "./text";

/**
 * Custom field GIDs of the FINANCEIRO project. Fields are always read by GID: the
 * workspace has three different fields named "STATUS".
 */
export const ASANA_FIELD = {
  valorContrato: "1211247788752338",
  status: "1211247788752340",
  influenciadora: "1211246990683307",
  dataConteudo: "1211839605650907",
  notaFiscal: "1213859818647250",
  pctComissao: "1219307521770159",
  valorEstimado: "1211245411269089",
  valorComissao: "1219336879108191",
} as const;

/** VALOR COMISSÃO was created on this date; 0,00 on older tasks means "not filled". */
export const COMMISSION_FIELD_CREATED_AT = "2026-10-08";

const TEMPLATE_TASK_KEY = "[LER] INSTRUCOES PARA USAR O MODELO";
const AUTO_SUBTASK_SUFFIX = /:\s*(EMISSAO NF|PAGAMENTO)\s*$/;

/** Subset of the Asana task payload requested by the importer. */
export interface AsanaTaskPayload {
  gid: string;
  name: string;
  parent?: { gid: string } | null;
  completed?: boolean;
  completed_at?: string | null;
  created_at?: string | null;
  modified_at?: string | null;
  memberships?: { project?: { gid: string } | null; section?: { gid?: string; name: string } | null }[];
  custom_fields?: {
    gid: string;
    number_value?: number | null;
    text_value?: string | null;
    enum_value?: { name: string } | null;
    date_value?: { date: string } | null;
    display_value?: string | null;
  }[];
}

export type AsanaExclusion = "subtarefa_automatica" | "modelo" | null;

export interface AsanaEntry {
  gid: string;
  name: string;
  parentGid: string | null;
  /** Automatic EMISSÃO NF / PAGAMENTO subtasks and the template task: kept as evidence, out of counts. */
  excluded: AsanaExclusion;
  completed: boolean;
  completedAt: string | null;
  createdAt: string | null;
  sections: string[];
  status: string | null;
  creator: NormalizedName | null;
  /** Whole task name as a comparison key (letters/digits only); brand position varies. */
  brandHint: string;
  contractCents: number | null;
  commissionPct: number | null;
  commissionCents: number | null;
  /** True when VALOR COMISSÃO is 0,00 on a task created before the field existed. */
  commissionUnfilled: boolean;
  contentDate: IsoDate | null;
  /** Month from DATA DO CONTEÚDO. */
  month: MonthRef | null;
  /** Month guessed from the task name ("SETEMBRO", "OUT 26"); used only to suggest matches. */
  monthHint: MonthRef | null;
  nfNumbers: string[];
}

const MONTH_TOKENS: [RegExp, number][] = [
  [/\bJAN(EIRO)?\b/, 1], [/\bFEV(EREIRO)?\b/, 2], [/\bMAR(CO)?\b/, 3], [/\bABR(IL)?\b/, 4],
  [/\bMAI(O)?\b/, 5], [/\bJUN(HO)?\b/, 6], [/\bJUL(HO)?\b/, 7], [/\bAGO(STO)?\b/, 8],
  [/\bSET(EMBRO)?\b/, 9], [/\bOUT(UBRO)?\b/, 10], [/\bNOV(EMBRO)?\b/, 11], [/\bDEZ(EMBRO)?\b/, 12],
];

const SHORT_YEAR = /\b(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[A-Z]*\s+(\d{2})\b/;

function monthFromName(key: string, createdAt: string | null): MonthRef | null {
  const found = MONTH_TOKENS.find(([re]) => re.test(key));
  if (!found) return null;
  const month = found[1];
  const yearMatch = /\b(20\d{2})\b/.exec(key) ?? SHORT_YEAR.exec(key);
  if (yearMatch) {
    const y = Number(yearMatch[1]);
    return { year: y < 100 ? 2000 + y : y, month };
  }
  if (!createdAt) return null;
  // No year in the name: assume the month closest to the task creation.
  const created = monthOfDate(createdAt.slice(0, 10));
  const candidates = [created.year - 1, created.year, created.year + 1].map((year) => ({ year, month }));
  const distance = (r: MonthRef) => Math.abs(r.year * 12 + r.month - (created.year * 12 + created.month));
  return candidates.sort((a, b) => distance(a) - distance(b))[0];
}

export function parseAsanaTask(task: AsanaTaskPayload, projectGid: string): AsanaEntry {
  const field = (gid: string) => task.custom_fields?.find((f) => f.gid === gid);
  const number = (gid: string) => {
    const v = field(gid)?.number_value;
    return typeof v === "number" ? v : null;
  };
  const toCents = (v: number | null) => (v === null ? null : Math.round(v * 100));

  const name = cleanText(task.name);
  const key = textKey(name);
  const parentGid = task.parent?.gid ?? null;
  const excluded: AsanaExclusion =
    key === TEMPLATE_TASK_KEY ? "modelo" : parentGid || AUTO_SUBTASK_SUFFIX.test(key) ? "subtarefa_automatica" : null;

  const creatorName = field(ASANA_FIELD.influenciadora)?.enum_value?.name ?? null;
  const contentDate = field(ASANA_FIELD.dataConteudo)?.date_value?.date?.slice(0, 10) ?? null;
  const commissionCents = toCents(number(ASANA_FIELD.valorComissao));
  const createdAt = task.created_at ?? null;
  const commissionUnfilled =
    commissionCents === 0 && (!createdAt || createdAt.slice(0, 10) < COMMISSION_FIELD_CREATED_AT);

  return {
    gid: task.gid,
    name,
    parentGid,
    excluded,
    completed: Boolean(task.completed),
    completedAt: task.completed_at ?? null,
    createdAt,
    sections: (task.memberships ?? [])
      .filter((m) => m.project?.gid === projectGid && m.section)
      .map((m) => m.section!.name),
    status: field(ASANA_FIELD.status)?.enum_value?.name ?? null,
    creator: creatorName ? normalizeCreator(creatorName) : null,
    brandHint: key.replace(/[^A-Z0-9]+/g, " ").trim(),
    contractCents: toCents(number(ASANA_FIELD.valorContrato)),
    commissionPct: number(ASANA_FIELD.pctComissao),
    commissionCents: commissionUnfilled ? null : commissionCents,
    commissionUnfilled,
    contentDate,
    month: contentDate ? monthOfDate(contentDate) : null,
    monthHint: monthFromName(key, createdAt),
    nfNumbers: cleanText(field(ASANA_FIELD.notaFiscal)?.text_value).match(/\d+/g) ?? [],
  };
}

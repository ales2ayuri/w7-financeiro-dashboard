import { ReconciliationLink, ReconciliationResult } from "./reconcile";

export type DecisionAction = "revisado" | "confirmar" | "desfazer" | "vincular" | "ignorar";

export interface Decision {
  subjectType: "alerta" | "conciliacao";
  subjectKey: string;
  action: DecisionAction;
  justification: string;
  dataOrigin: string;
  subjectHash: string | null;
  payload: Record<string, unknown>;
  decidedBy: string;
  decidedAt: string;
}

export const linkKey = (rows: number[], asanaGid: string) =>
  `rows:${[...rows].sort((a, b) => a - b).join("+")}|asana:${asanaGid}`;
export const alertKey = (row: number, code: string) => `row:${row}:${code}`;
export const onlySheetKey = (row: number) => `row:${row}`;
export const onlyAsanaKey = (gid: string) => `asana:${gid}`;

/** Latest decision per subject; earlier ones remain in the history. */
export function latestDecisions(decisions: Decision[]): Map<string, Decision> {
  const latest = new Map<string, Decision>();
  for (const d of [...decisions].sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))) {
    latest.set(`${d.subjectType}|${d.subjectKey}`, d);
  }
  return latest;
}

/** A decision stays valid only while the record it was based on is unchanged. */
export function isCurrent(decision: Decision | undefined, currentHash: string | null): decision is Decision {
  return decision !== undefined && (decision.subjectHash === null || decision.subjectHash === currentHash);
}

export type LinkState = "sugerido" | "confirmado" | "manual";

export interface ResolvedLink extends ReconciliationLink {
  state: LinkState;
  decision: Decision | null;
}

export interface ResolvedReconciliation extends Omit<ReconciliationResult, "links"> {
  links: ResolvedLink[];
  ignoredSheet: number[];
  ignoredAsana: string[];
}

/**
 * Applies manual decisions on top of the automatic suggestions:
 * "desfazer" drops a suggested link, "vincular" adds a manual one, "confirmar" marks a
 * suggestion as confirmed and "ignorar" moves an unmatched record out of the open list.
 * Sources are never changed; this only shapes what the reconciliation screen shows.
 */
export function applyDecisions(result: ReconciliationResult, decisions: Decision[]): ResolvedReconciliation {
  const latest = latestDecisions(decisions.filter((d) => d.subjectType === "conciliacao"));
  const get = (key: string) => latest.get(`conciliacao|${key}`);

  const usedRows = new Set<number>();
  const usedTasks = new Set<string>();
  const links: ResolvedLink[] = [];

  for (const d of latest.values()) {
    if (d.action !== "vincular") continue;
    const rows = (d.payload.sheetRows as number[] | undefined) ?? [];
    const gid = d.payload.asanaGid as string | undefined;
    if (!gid || rows.length === 0 || rows.some((r) => usedRows.has(r)) || usedTasks.has(gid)) continue;
    rows.forEach((r) => usedRows.add(r));
    usedTasks.add(gid);
    const suggested = result.links.find((l) => l.asanaGid === gid && linkKey(l.sheetRows, gid) === d.subjectKey);
    links.push({
      sheetRows: rows,
      asanaGid: gid,
      score: suggested?.score ?? { total: 0, nf: 0, brand: 0, creator: 0, month: 0, value: 0 },
      confidence: suggested?.confidence ?? "media",
      divergences: suggested?.divergences ?? [],
      state: "manual",
      decision: d,
    });
  }

  for (const link of result.links) {
    const decision = get(linkKey(link.sheetRows, link.asanaGid));
    if (decision?.action === "desfazer") continue;
    if (link.sheetRows.some((r) => usedRows.has(r)) || usedTasks.has(link.asanaGid)) continue;
    link.sheetRows.forEach((r) => usedRows.add(r));
    usedTasks.add(link.asanaGid);
    links.push({ ...link, state: decision?.action === "confirmar" ? "confirmado" : "sugerido", decision: decision ?? null });
  }

  const allRows = [...result.onlySheet, ...result.links.flatMap((l) => l.sheetRows)];
  const allTasks = [...result.onlyAsana, ...result.links.map((l) => l.asanaGid)];
  const freeRows = [...new Set(allRows)].filter((r) => !usedRows.has(r)).sort((a, b) => a - b);
  const freeTasks = [...new Set(allTasks)].filter((g) => !usedTasks.has(g));
  const ignored = (key: string) => get(key)?.action === "ignorar";

  return {
    links,
    onlySheet: freeRows.filter((r) => !ignored(onlySheetKey(r))),
    onlyAsana: freeTasks.filter((g) => !ignored(onlyAsanaKey(g))),
    ignoredSheet: freeRows.filter((r) => ignored(onlySheetKey(r))),
    ignoredAsana: freeTasks.filter((g) => ignored(onlyAsanaKey(g))),
    excludedAsana: result.excludedAsana,
  };
}

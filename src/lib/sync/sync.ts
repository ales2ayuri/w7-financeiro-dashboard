import "server-only";
import { createHash } from "node:crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { applyMerges, mergesOverValueColumns, validateHeader } from "@/lib/domain/sheet";
import { readFinanceSheet } from "@/lib/sources/googleSheets";
import { AsanaStory, readProjectTasks, readTaskStories } from "@/lib/sources/asana";

type Source = "sheet" | "asana";

interface Incoming {
  externalId: string;
  payload: unknown;
}

export interface SyncSummary {
  source: Source;
  runId: string;
  read: number;
  created: number;
  changed: number;
  removed: number;
  /** External ids that are new or changed in this run. */
  touched: string[];
}

/** Time reserved for reading Asana change history in one run (free hosting allows ~60s). */
const STORIES_TIME_BUDGET_MS = 30_000;

const hashOf = (payload: unknown) => createHash("sha256").update(JSON.stringify(payload)).digest("hex");

function chunks<T>(items: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function check<T>(promise: PromiseLike<{ error: { message: string } | null; data?: unknown }>): Promise<T | undefined> {
  const { error, data } = await promise;
  if (error) throw new Error(error.message);
  return (data ?? undefined) as T | undefined;
}

/**
 * Stores what was read without ever overwriting history: a new immutable version is
 * captured whenever a record's content changes, and records that disappear from the
 * source are only marked as removed.
 */
async function storeRecords(db: SupabaseClient, source: Source, runId: string, incoming: Incoming[]): Promise<Omit<SyncSummary, "source" | "runId">> {
  const existing = new Map<string, { hash: string; removed: boolean; firstSeen: string }>();
  for (let from = 0; ; from += 1000) {
    const page = await check<{ external_id: string; current_hash: string; removed_at: string | null; first_seen_run: string }[]>(
      db
        .from("source_records")
        .select("external_id,current_hash,removed_at,first_seen_run")
        .eq("source", source)
        .range(from, from + 999),
    );
    (page ?? []).forEach((r) =>
      existing.set(r.external_id, { hash: r.current_hash, removed: r.removed_at !== null, firstSeen: r.first_seen_run }),
    );
    if (!page || page.length < 1000) break;
  }

  const now = new Date().toISOString();
  const seen = new Set<string>();
  const upserts: Record<string, unknown>[] = [];
  const versions: Record<string, unknown>[] = [];
  const touched: string[] = [];
  let created = 0;
  let changed = 0;

  for (const item of incoming) {
    seen.add(item.externalId);
    const hash = hashOf(item.payload);
    const prev = existing.get(item.externalId);
    const isNew = !prev;
    const isChanged = prev !== undefined && (prev.hash !== hash || prev.removed);
    upserts.push({
      source,
      external_id: item.externalId,
      current_hash: hash,
      current_payload: item.payload,
      first_seen_run: prev?.firstSeen ?? runId,
      last_seen_run: runId,
      removed_at: null,
    });
    if (isNew || isChanged) {
      versions.push({ source, external_id: item.externalId, sync_run_id: runId, hash, payload: item.payload, captured_at: now });
      touched.push(item.externalId);
      if (isNew) created++;
      else changed++;
    }
  }

  // Records first, then versions (foreign key). first_seen_run is carried over unchanged.
  for (const part of chunks(upserts)) {
    await check(db.from("source_records").upsert(part, { onConflict: "source,external_id" }));
  }
  for (const part of chunks(versions)) await check(db.from("source_record_versions").insert(part));

  const removedIds = [...existing.entries()].filter(([id, r]) => !seen.has(id) && !r.removed).map(([id]) => id);
  for (const part of chunks(removedIds)) {
    await check(db.from("source_records").update({ removed_at: now }).eq("source", source).in("external_id", part));
  }

  return { read: incoming.length, created, changed, removed: removedIds.length, touched };
}

async function startRun(db: SupabaseClient, source: Source, triggeredBy: string): Promise<string> {
  const data = await check<{ id: string }>(db.from("sync_runs").insert({ source, triggered_by: triggeredBy }).select("id").single());
  return data!.id;
}

async function finishRun(db: SupabaseClient, runId: string, fields: Record<string, unknown>) {
  await check(db.from("sync_runs").update({ finished_at: new Date().toISOString(), ...fields }).eq("id", runId));
}

async function runSource(
  db: SupabaseClient,
  source: Source,
  triggeredBy: string,
  body: (runId: string) => Promise<{ incoming: Incoming[]; meta?: Record<string, unknown> }>,
  after?: (runId: string, summary: SyncSummary) => Promise<Record<string, unknown> | void>,
): Promise<SyncSummary> {
  const runId = await startRun(db, source, triggeredBy);
  try {
    const { incoming, meta } = await body(runId);
    const stored = await storeRecords(db, source, runId, incoming);
    const summary = { source, runId, ...stored };
    const afterMeta = after ? await after(runId, summary) : undefined;
    await finishRun(db, runId, {
      status: "ok",
      records_read: stored.read,
      records_new: stored.created,
      records_changed: stored.changed,
      records_removed: stored.removed,
      ...(meta || afterMeta ? { meta: { ...(meta ?? {}), ...(afterMeta ?? {}) } } : {}),
    });
    return summary;
  } catch (err) {
    await finishRun(db, runId, { status: "error", error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

/** Google Sheets: reference financial source. Rows are stored as the user sees them (merges applied). */
export function syncSheet(db: SupabaseClient, triggeredBy: string): Promise<SyncSummary> {
  return runSource(db, "sheet", triggeredBy, async () => {
    const { grid, merges } = await readFinanceSheet();
    const header = grid[0] ?? [];
    const problems = validateHeader(header);
    if (problems.length > 0) {
      throw new Error(`Estrutura da planilha mudou; importação interrompida. ${problems.join("; ")}`);
    }
    const valueMerges = mergesOverValueColumns(merges);
    const filled = applyMerges(grid, merges.filter((m) => !valueMerges.includes(m)));
    const incoming: Incoming[] = [];
    for (let i = 1; i < filled.length; i++) {
      const cells = (filled[i] ?? []).slice(0, 17).map((c) => c ?? "");
      if (cells.some((c) => c.trim() !== "")) incoming.push({ externalId: `row:${i + 1}`, payload: { cells } });
    }
    return { incoming, meta: { header: header.slice(0, 17), merges, valueMerges } };
  });
}

function storyRow(taskGid: string, runId: string, s: AsanaStory) {
  const section = s.resource_subtype === "section_changed";
  const value = (v: { name: string } | null | undefined, n?: number | null, t?: string | null) =>
    v?.name ?? (n !== undefined && n !== null ? String(n) : t ?? null);
  return {
    story_gid: s.gid,
    task_gid: taskGid,
    created_at: s.created_at,
    subtype: s.resource_subtype,
    field_name: section ? "SEÇÃO" : s.custom_field?.name ?? null,
    old_value: section ? s.old_section?.name ?? null : value(s.old_enum_value, s.old_number_value, s.old_text_value),
    new_value: section ? s.new_section?.name ?? null : value(s.new_enum_value, s.new_number_value, s.new_text_value),
    payload: s,
    sync_run_id: runId,
  };
}

/** Asana: tracked in parallel; change history read for new or changed tasks. */
export function syncAsana(db: SupabaseClient, triggeredBy: string): Promise<SyncSummary> {
  return runSource(
    db,
    "asana",
    triggeredBy,
    async () => {
      const tasks = await readProjectTasks();
      return { incoming: tasks.map((t) => ({ externalId: t.gid, payload: t })) };
    },
    async (runId, summary) => {
      // Change history is read only for new or changed tasks, within a time budget that
      // fits the free hosting limit. Whatever is left is carried over to the next run.
      const { data: last } = await db
        .from("sync_runs")
        .select("meta")
        .eq("source", "asana")
        .eq("status", "ok")
        .order("started_at", { ascending: false })
        .limit(1);
      const carried = ((last?.[0]?.meta as { pendingStories?: string[] } | undefined)?.pendingStories ?? []);
      const queue = [...new Set([...carried, ...summary.touched])];
      const deadline = Date.now() + STORIES_TIME_BUDGET_MS;
      const worker = async () => {
        while (queue.length > 0 && Date.now() < deadline) {
          const gid = queue.shift()!;
          try {
            const stories = await readTaskStories(gid);
            const rows = stories.map((s) => storyRow(gid, runId, s));
            for (const part of chunks(rows)) {
              await check(db.from("asana_events").upsert(part, { onConflict: "story_gid", ignoreDuplicates: true }));
            }
          } catch (err) {
            queue.push(gid);
            throw err;
          }
        }
      };
      try {
        await Promise.all(Array.from({ length: 4 }, worker));
      } finally {
        // Recorded even on failure so the next run resumes where this one stopped.
        await db.from("sync_runs").update({ meta: { pendingStories: queue } }).eq("id", runId);
      }
      return { pendingStories: queue };
    },
  );
}

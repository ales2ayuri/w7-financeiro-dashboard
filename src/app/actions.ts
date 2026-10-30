"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DecisionAction } from "@/lib/domain/decisions";
import { adminClient } from "@/lib/supabase/admin";
import { syncAsana, syncSheet } from "@/lib/sync/sync";

export interface ActionState {
  ok: boolean;
  message: string | null;
}

/** Manual "Sincronizar agora": reads both sources (read-only) and stores new versions. */
export async function syncNow(): Promise<ActionState> {
  const email = await requireUser();
  const db = adminClient();
  const messages: string[] = [];
  let ok = true;
  for (const [label, run] of [["Planilha", syncSheet], ["Asana", syncAsana]] as const) {
    try {
      const s = await run(db, `manual:${email}`);
      messages.push(`${label}: ${s.read} lidos, ${s.created} novos, ${s.changed} alterados, ${s.removed} removidos`);
    } catch (err) {
      ok = false;
      messages.push(`${label}: erro — ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  revalidatePath("/", "layout");
  return { ok, message: messages.join(" · ") };
}

const ACTIONS = new Set<DecisionAction>(["revisado", "confirmar", "desfazer", "vincular", "ignorar"]);

/** Records a manual decision. Justification is mandatory; nothing in the sources changes. */
export async function recordDecision(_: ActionState, form: FormData): Promise<ActionState> {
  const email = await requireUser();
  const subjectType = String(form.get("subjectType") ?? "");
  const subjectKey = String(form.get("subjectKey") ?? "");
  const action = String(form.get("action") ?? "") as DecisionAction;
  const justification = String(form.get("justification") ?? "").trim();
  const dataOrigin = String(form.get("dataOrigin") ?? "");
  const subjectHash = String(form.get("subjectHash") ?? "") || null;
  const payload = JSON.parse(String(form.get("payload") ?? "{}"));

  if (!["alerta", "conciliacao"].includes(subjectType) || !subjectKey || !ACTIONS.has(action)) {
    return { ok: false, message: "Decisão inválida." };
  }
  if (!justification) return { ok: false, message: "A justificativa é obrigatória." };

  const { error } = await adminClient().from("decisions").insert({
    subject_type: subjectType,
    subject_key: subjectKey,
    action,
    justification,
    data_origin: dataOrigin,
    subject_hash: subjectHash,
    payload,
    decided_by: email,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Decisão registrada." };
}

/** Manual link between sheet rows and an Asana task, typed in by the user. */
export async function linkManually(_: ActionState, form: FormData): Promise<ActionState> {
  const rows = String(form.get("rows") ?? "")
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number);
  const asanaGid = String(form.get("asanaGid") ?? "").trim();
  if (rows.length === 0 || !/^\d+$/.test(asanaGid)) return { ok: false, message: "Informe as linhas e o GID da tarefa." };
  const key = `rows:${[...rows].sort((a, b) => a - b).join("+")}|asana:${asanaGid}`;
  const data = new FormData();
  data.set("subjectType", "conciliacao");
  data.set("subjectKey", key);
  data.set("action", "vincular");
  data.set("justification", String(form.get("justification") ?? ""));
  data.set("dataOrigin", "vínculo manual planilha × Asana");
  data.set("payload", JSON.stringify({ sheetRows: rows, asanaGid }));
  return recordDecision({ ok: true, message: null }, data);
}

/** Creates or changes a goal. Every change is logged in goal_history by the database. */
export async function saveGoal(_: ActionState, form: FormData): Promise<ActionState> {
  const email = await requireUser();
  const kind = String(form.get("kind") ?? "");
  const year = Number(form.get("year"));
  const monthValue = Number(form.get("month") ?? 0);
  const raw = String(form.get("target") ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const target = Math.round(Number(raw) * 100);
  if (!["comercial", "financeira"].includes(kind) || !Number.isInteger(year) || !(monthValue >= 0 && monthValue <= 12)) {
    return { ok: false, message: "Meta inválida." };
  }
  if (!raw || !Number.isFinite(target) || target < 0) return { ok: false, message: "Informe um valor válido." };
  const { error } = await adminClient()
    .from("goals")
    .upsert(
      { kind, period: monthValue === 0 ? "ano" : "mes", year, month: monthValue, target_cents: target, updated_by: email, updated_at: new Date().toISOString() },
      { onConflict: "kind,period,year,month" },
    );
  if (error) return { ok: false, message: error.message };
  revalidatePath("/metas");
  return { ok: true, message: "Meta salva." };
}

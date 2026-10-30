"use client";

import { useActionState, useState } from "react";
import { ActionState, linkManually, recordDecision, syncNow } from "@/app/actions";

const initial: ActionState = { ok: true, message: null };

export function SyncButton() {
  const [state, action, pending] = useActionState(async () => syncNow(), initial);
  return (
    <form action={action} className="flex flex-col items-start gap-2 md:items-end">
      <button
        disabled={pending}
        className="rounded-xl bg-w7-forest px-5 py-2.5 text-sm font-medium text-white transition hover:bg-w7-green disabled:opacity-60"
      >
        {pending ? "Sincronizando…" : "Sincronizar agora"}
      </button>
      {state.message && <p className={`max-w-md text-xs ${state.ok ? "text-w7-green" : "text-w7-pink"}`}>{state.message}</p>}
    </form>
  );
}

interface DecisionProps {
  subjectType: "alerta" | "conciliacao";
  subjectKey: string;
  dataOrigin: string;
  subjectHash?: string | null;
  payload?: Record<string, unknown>;
  actions: { value: string; label: string }[];
}

/** Inline decision with mandatory justification. Nothing is changed in the sources. */
export function DecisionForm({ subjectType, subjectKey, dataOrigin, subjectHash, payload, actions }: DecisionProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(recordDecision, initial);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-w7-pink underline-offset-2 hover:underline">
        Decidir
      </button>
    );
  }
  return (
    <form action={action} className="mt-2 flex flex-col gap-2 rounded-xl bg-w7-ivory p-3">
      <input type="hidden" name="subjectType" value={subjectType} />
      <input type="hidden" name="subjectKey" value={subjectKey} />
      <input type="hidden" name="dataOrigin" value={dataOrigin} />
      <input type="hidden" name="subjectHash" value={subjectHash ?? ""} />
      <input type="hidden" name="payload" value={JSON.stringify(payload ?? {})} />
      <select name="action" className="rounded-lg border border-w7-rose bg-white px-2 py-1.5 text-xs">
        {actions.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
      <textarea
        name="justification"
        required
        rows={2}
        placeholder="Justificativa (obrigatória)"
        className="rounded-lg border border-w7-rose bg-white px-2 py-1.5 text-xs"
      />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-w7-forest px-3 py-1.5 text-xs text-white disabled:opacity-60">
          {pending ? "Salvando…" : "Registrar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-w7-green">
          Cancelar
        </button>
      </div>
      {state.message && <p className={`text-xs ${state.ok ? "text-w7-green" : "text-w7-pink"}`}>{state.message}</p>}
    </form>
  );
}

export function ManualLinkForm() {
  const [state, action, pending] = useActionState(linkManually, initial);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
      <label className="text-xs text-w7-green">
        Linha(s) da planilha
        <input name="rows" placeholder="ex.: 239, 240" className="mt-1 w-full rounded-lg border border-w7-rose bg-white px-3 py-2 text-sm" />
      </label>
      <label className="text-xs text-w7-green">
        GID da tarefa no Asana
        <input name="asanaGid" inputMode="numeric" className="mt-1 w-full rounded-lg border border-w7-rose bg-white px-3 py-2 text-sm" />
      </label>
      <label className="text-xs text-w7-green">
        Justificativa
        <input name="justification" required className="mt-1 w-full rounded-lg border border-w7-rose bg-white px-3 py-2 text-sm" />
      </label>
      <button disabled={pending} className="rounded-lg bg-w7-forest px-4 py-2 text-sm text-white disabled:opacity-60">
        Vincular
      </button>
      {state.message && <p className={`text-xs md:col-span-4 ${state.ok ? "text-w7-green" : "text-w7-pink"}`}>{state.message}</p>}
    </form>
  );
}

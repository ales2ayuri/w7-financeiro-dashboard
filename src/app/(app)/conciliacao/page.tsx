import Link from "next/link";
import { DecisionForm, ManualLinkForm } from "@/components/forms";
import { Badge, Card, Empty, PageHeader, Table } from "@/components/ui";
import { loadWorkspace } from "@/lib/data/views";
import { AsanaEntry } from "@/lib/domain/asana";
import { linkKey, onlyAsanaKey, onlySheetKey } from "@/lib/domain/decisions";
import { DIVERGENCE_LABEL } from "@/lib/domain/reconcile";
import { SheetEntry } from "@/lib/domain/sheet";
import { dateTime, money, month } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VIEWS = [
  { id: "divergencias", label: "Com divergências" },
  { id: "sugeridos", label: "Sugeridos" },
  { id: "decididos", label: "Confirmados e manuais" },
  { id: "so-planilha", label: "Só na planilha" },
  { id: "so-asana", label: "Só no Asana" },
  { id: "ignorados", label: "Ignorados" },
] as const;

function SheetCell({ e }: { e: SheetEntry }) {
  return (
    <div className="text-sm">
      <span className="num text-xs text-w7-green">linha {e.row}</span> · {e.brand.name} / {e.creator.name}
      <span className="block text-xs text-w7-green">
        {month(e.month)} · K {money(e.grossCents)} · M {money(e.w7Cents)} · {e.paymentRaw || "sem status"}
      </span>
    </div>
  );
}

function AsanaCell({ a }: { a: AsanaEntry }) {
  return (
    <div className="text-sm">
      {a.name}
      <span className="block text-xs text-w7-green">
        {month(a.month)}
        {!a.month && a.monthHint ? ` (nome: ${month(a.monthHint)})` : ""} · {money(a.contractCents)} · {a.status ?? "sem status"}
        {a.creator ? ` · ${a.creator.name}` : ""}
      </span>
      <span className="num block text-[11px] text-w7-green/70">GID {a.gid}</span>
    </div>
  );
}

export default async function ReconciliationPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = "divergencias" } = await searchParams;
  const ws = await loadWorkspace(adminClient());
  const r = ws.reconciliation;
  const rows = new Map(ws.sheet.entries.map((e) => [e.row, e]));
  const tasks = new Map(ws.asana.map((a) => [a.gid, a]));

  const links = r.links.filter((l) =>
    ver === "divergencias" ? l.divergences.length > 0 && l.state === "sugerido" : ver === "sugeridos" ? l.state === "sugerido" : l.state !== "sugerido",
  );
  const counts: Record<string, number> = {
    divergencias: r.links.filter((l) => l.divergences.length > 0 && l.state === "sugerido").length,
    sugeridos: r.links.filter((l) => l.state === "sugerido").length,
    decididos: r.links.filter((l) => l.state !== "sugerido").length,
    "so-planilha": r.onlySheet.length,
    "so-asana": r.onlyAsana.length,
    ignorados: r.ignoredSheet.length + r.ignoredAsana.length,
  };

  return (
    <>
      <PageHeader eyebrow="Planilha × Asana · a partir de jul/2025" title="Conciliação" />

      <div className="mb-6 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link key={v.id} href={`/conciliacao?ver=${v.id}`} className={`rounded-full px-3 py-1 text-xs ${ver === v.id ? "bg-w7-forest text-white" : "bg-white text-w7-forest"}`}>
            {v.label} · {counts[v.id]}
          </Link>
        ))}
      </div>

      {["divergencias", "sugeridos", "decididos"].includes(ver) && (
        <Card>
          {links.length === 0 ? (
            <Empty>Nada neste filtro.</Empty>
          ) : (
            <Table head={["Planilha (referência)", "Asana", "Confiança", "Divergências", ""]}>
              {links.map((l) => {
                const key = linkKey(l.sheetRows, l.asanaGid);
                const task = tasks.get(l.asanaGid);
                return (
                  <tr key={key} className="align-top">
                    <td className="py-3 pr-4">
                      {l.sheetRows.map((n) => rows.get(n) && <SheetCell key={n} e={rows.get(n)!} />)}
                    </td>
                    <td className="py-3 pr-4">{task ? <AsanaCell a={task} /> : l.asanaGid}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={l.confidence === "alta" ? "good" : "warn"}>
                        {l.state === "manual" ? "manual" : `${l.confidence} · ${l.score.total}`}
                      </Badge>
                      {l.state === "confirmado" && <p className="mt-1 text-xs text-w7-green">confirmado</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {l.divergences.length === 0 ? <span className="text-xs text-w7-green">nenhuma</span> : l.divergences.map((d) => <Badge key={d} tone="alert">{DIVERGENCE_LABEL[d]}</Badge>)}
                      </div>
                      {l.decision && (
                        <p className="mt-1 text-xs text-w7-green">
                          {l.decision.decidedBy}, {dateTime(l.decision.decidedAt)}: {l.decision.justification}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <DecisionForm
                        subjectType="conciliacao"
                        subjectKey={key}
                        dataOrigin={`planilha linhas ${l.sheetRows.join(", ")} × Asana ${l.asanaGid}`}
                        payload={{ sheetRows: l.sheetRows, asanaGid: l.asanaGid, divergences: l.divergences }}
                        actions={[
                          { value: "confirmar", label: "Confirmar vínculo" },
                          { value: "desfazer", label: "Desfazer vínculo" },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {ver === "so-planilha" && (
        <Card>
          {r.onlySheet.length === 0 ? (
            <Empty>Nenhum registro só na planilha.</Empty>
          ) : (
            <Table head={["Planilha", ""]}>
              {r.onlySheet.map((n) => (
                <tr key={n} className="align-top">
                  <td className="py-3 pr-4">{rows.get(n) && <SheetCell e={rows.get(n)!} />}</td>
                  <td className="py-3">
                    <DecisionForm subjectType="conciliacao" subjectKey={onlySheetKey(n)} dataOrigin={`planilha linha ${n}`} actions={[{ value: "ignorar", label: "Não existe no Asana (ignorar)" }]} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {ver === "so-asana" && (
        <Card>
          {r.onlyAsana.length === 0 ? (
            <Empty>Nenhum registro só no Asana.</Empty>
          ) : (
            <Table head={["Asana", ""]}>
              {r.onlyAsana.map((g) => (
                <tr key={g} className="align-top">
                  <td className="py-3 pr-4">{tasks.get(g) && <AsanaCell a={tasks.get(g)!} />}</td>
                  <td className="py-3">
                    <DecisionForm subjectType="conciliacao" subjectKey={onlyAsanaKey(g)} dataOrigin={`Asana ${g}`} actions={[{ value: "ignorar", label: "Não existe na planilha (ignorar)" }]} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {ver === "ignorados" && (
        <Card>
          {counts.ignorados === 0 ? (
            <Empty>Nenhum registro ignorado.</Empty>
          ) : (
            <div className="space-y-3">
              {r.ignoredSheet.map((n) => rows.get(n) && <SheetCell key={n} e={rows.get(n)!} />)}
              {r.ignoredAsana.map((g) => tasks.get(g) && <AsanaCell key={g} a={tasks.get(g)!} />)}
            </div>
          )}
        </Card>
      )}

      <Card title="Vincular manualmente" className="mt-6">
        <ManualLinkForm />
      </Card>
    </>
  );
}

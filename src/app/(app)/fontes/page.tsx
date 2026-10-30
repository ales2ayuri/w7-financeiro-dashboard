import { SyncButton } from "@/components/forms";
import { Badge, Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { loadRuns } from "@/lib/data/load";
import { loadWorkspace } from "@/lib/data/views";
import { dateTime } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
// The "Sincronizar agora" button runs on this page; the free hosting plan allows ~60s.
export const maxDuration = 60;

export default async function SourcesPage() {
  const db = adminClient();
  const [runs, ws] = await Promise.all([loadRuns(db, 50), loadWorkspace(db)]);
  const r = ws.reconciliation;
  return (
    <>
      <PageHeader eyebrow="Fontes de dados" title="Sincronizações">
        <SyncButton />
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lançamentos na planilha" value={ws.sheet.entries.length} />
        <Stat label="Tarefas no Asana" value={ws.asana.filter((a) => !a.excluded).length} hint={`${r.excludedAsana.length} subtarefas/modelo fora da contagem`} />
        <Stat label="Alertas em aberto" value={ws.alerts.filter((a) => !a.reviewed).length} />
        <Stat label="Vínculos planilha × Asana" value={r.links.length} hint={`${r.onlySheet.length} só planilha · ${r.onlyAsana.length} só Asana`} />
      </div>
      <Card>
        <p className="mb-4 text-sm text-w7-green">
          Leitura somente: nada é alterado na planilha ou no Asana. Cada mudança encontrada é guardada como uma nova versão,
          sem apagar as anteriores. A sincronização automática roda todo dia às 06h17 (Brasília).
        </p>
        {runs.length === 0 ? (
          <Empty>Nenhuma sincronização ainda.</Empty>
        ) : (
          <Table head={["Início", "Fonte", "Origem", "Situação", "Lidos", "Novos", "Alterados", "Removidos"]}>
            {runs.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="py-2 pr-4">{dateTime(r.started_at)}</td>
                <td className="py-2 pr-4">{r.source === "sheet" ? "Planilha" : "Asana"}</td>
                <td className="py-2 pr-4 text-w7-green">{r.triggered_by}</td>
                <td className="py-2 pr-4">
                  <Badge tone={r.status === "ok" ? "good" : r.status === "error" ? "alert" : "warn"}>{r.status}</Badge>
                  {r.error && <p className="mt-1 max-w-xs text-xs text-w7-pink">{r.error}</p>}
                </td>
                <td className="num py-2 pr-4">{r.records_read ?? "—"}</td>
                <td className="num py-2 pr-4">{r.records_new ?? "—"}</td>
                <td className="num py-2 pr-4">{r.records_changed ?? "—"}</td>
                <td className="num py-2 pr-4">{r.records_removed ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

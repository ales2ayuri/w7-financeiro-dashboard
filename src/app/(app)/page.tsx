import Link from "next/link";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { loadRuns } from "@/lib/data/load";
import { loadWorkspace } from "@/lib/data/views";
import { dateTime, month } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const db = adminClient();
  const [ws, runs] = await Promise.all([loadWorkspace(db), loadRuns(db, 10)]);
  const entries = ws.sheet.entries;
  const lastSheet = runs.find((r) => r.source === "sheet");
  const lastAsana = runs.find((r) => r.source === "asana");

  if (entries.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Visão geral" title="Bem-vinda ao painel da W7" />
        <Empty>
          Ainda não há dados importados. Configure as credenciais e use <Link href="/fontes" className="text-w7-pink underline">Fontes de dados → Sincronizar agora</Link>.
        </Empty>
      </>
    );
  }

  const months = entries.map((e) => e.month).filter((m) => m !== null);
  const first = months.reduce((a, b) => (a!.year * 12 + a!.month <= b!.year * 12 + b!.month ? a : b), months[0]);
  const last = months.reduce((a, b) => (a!.year * 12 + a!.month >= b!.year * 12 + b!.month ? a : b), months[0]);
  const openAlerts = ws.alerts.filter((a) => !a.reviewed).length;
  const r = ws.reconciliation;
  const confirmed = r.links.filter((l) => l.state !== "sugerido").length;

  return (
    <>
      <PageHeader eyebrow="Visão geral" title="Qualidade e cobertura dos dados" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Entregas na planilha" value={entries.length} hint={`${month(first)} a ${month(last)}`} />
        <Stat label="Tarefas no Asana" value={ws.asana.filter((a) => !a.excluded).length} hint={`${r.excludedAsana.length} subtarefas/modelo fora da contagem`} />
        <Stat label="Alertas em aberto" value={openAlerts} hint={<Link href="/alertas" className="underline">ver alertas</Link>} />
        <Stat
          label="Vínculos planilha × Asana"
          value={r.links.length}
          hint={`${confirmed} decididos · ${r.onlySheet.length} só planilha · ${r.onlyAsana.length} só Asana`}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card title="Última leitura da planilha">
          <p className="text-sm text-w7-green">{lastSheet ? `${dateTime(lastSheet.started_at)} · ${lastSheet.status === "ok" ? "concluída" : lastSheet.status}` : "—"}</p>
          {lastSheet?.error && <p className="mt-2 text-sm text-w7-pink">{lastSheet.error}</p>}
        </Card>
        <Card title="Última leitura do Asana">
          <p className="text-sm text-w7-green">{lastAsana ? `${dateTime(lastAsana.started_at)} · ${lastAsana.status === "ok" ? "concluída" : lastAsana.status}` : "—"}</p>
          {lastAsana?.error && <p className="mt-2 text-sm text-w7-pink">{lastAsana.error}</p>}
        </Card>
      </div>

      <p className="mt-8 text-sm text-w7-green/80">
        Os indicadores financeiros e comerciais entram na etapa 9 do plano, depois da conciliação e da proposta de estrutura do Asana.
      </p>
    </>
  );
}

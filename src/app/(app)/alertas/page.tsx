import Link from "next/link";
import { DecisionForm } from "@/components/forms";
import { Badge, Card, Empty, PageHeader, Table } from "@/components/ui";
import { loadWorkspace } from "@/lib/data/views";
import { IssueCode } from "@/lib/domain/sheet";
import { ISSUE_LABEL } from "@/lib/domain/status";
import { dateTime, money, month } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ tipo?: string; ver?: string }> }) {
  const { tipo, ver } = await searchParams;
  const ws = await loadWorkspace(adminClient());
  const showReviewed = ver === "todos";
  const counts = new Map<IssueCode, number>();
  for (const a of ws.alerts) if (!a.reviewed) counts.set(a.code, (counts.get(a.code) ?? 0) + 1);
  const items = ws.alerts.filter((a) => (!tipo || a.code === tipo) && (showReviewed || !a.reviewed));
  const query = (t?: string) => `/alertas?${new URLSearchParams({ ...(t ? { tipo: t } : {}), ...(showReviewed ? { ver: "todos" } : {}) })}`;

  return (
    <>
      <PageHeader eyebrow="Planilha FINANCEIRO" title="Alertas de inconsistência">
        <Link href={showReviewed ? `/alertas${tipo ? `?tipo=${tipo}` : ""}` : `/alertas?ver=todos${tipo ? `&tipo=${tipo}` : ""}`} className="text-sm text-w7-pink underline">
          {showReviewed ? "Ocultar revisados" : "Mostrar também os revisados"}
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={query()} className={`rounded-full px-3 py-1 text-xs ${!tipo ? "bg-w7-forest text-white" : "bg-white text-w7-forest"}`}>
          Todos
        </Link>
        {[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => (
          <Link key={code} href={query(code)} className={`rounded-full px-3 py-1 text-xs ${tipo === code ? "bg-w7-forest text-white" : "bg-white text-w7-forest"}`}>
            {ISSUE_LABEL[code]} · {n}
          </Link>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <Empty>Nenhum alerta {showReviewed ? "" : "em aberto "}neste filtro.</Empty>
        ) : (
          <Table head={["Linha", "Marca / creator", "Mês", "K", "M", "P", "Alerta", ""]}>
            {items.map((a) => (
              <tr key={a.key} className="align-top">
                <td className="num py-2 pr-4">{a.entry.row}</td>
                <td className="py-2 pr-4">
                  {a.entry.brand.name}
                  <span className="block text-xs text-w7-green">{a.entry.creator.name}</span>
                </td>
                <td className="py-2 pr-4">{month(a.entry.month)}</td>
                <td className="num py-2 pr-4">{money(a.entry.grossCents)}</td>
                <td className="num py-2 pr-4">{money(a.entry.w7Cents)}</td>
                <td className="py-2 pr-4 text-xs">{a.entry.paymentRaw || "—"}</td>
                <td className="py-2 pr-4">
                  <Badge tone="alert">{ISSUE_LABEL[a.code]}</Badge>
                  {a.code === "nf_fora_padrao" && <p className="mt-1 text-xs text-w7-green">NF: “{a.entry.nf.raw}”</p>}
                  {a.reviewed && (
                    <p className="mt-1 text-xs text-w7-green">
                      Revisado por {a.reviewed.decidedBy} em {dateTime(a.reviewed.decidedAt)}: {a.reviewed.justification}
                    </p>
                  )}
                </td>
                <td className="py-2">
                  {!a.reviewed && (
                    <DecisionForm
                      subjectType="alerta"
                      subjectKey={a.key}
                      subjectHash={a.hash}
                      dataOrigin={`planilha linha ${a.entry.row}`}
                      actions={[{ value: "revisado", label: "Marcar como revisado" }]}
                    />
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

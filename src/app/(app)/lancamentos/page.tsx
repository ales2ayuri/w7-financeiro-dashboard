import { FilterBar } from "@/components/FilterBar";
import { Badge, Card, Empty, PageHeader, Table } from "@/components/ui";
import { loadSheet } from "@/lib/data/load";
import { filterOptions } from "@/lib/data/options";
import { todayInSaoPaulo } from "@/lib/domain/dates";
import { inFilter } from "@/lib/domain/metrics";
import { financialStatus, FinancialStatus, STATUS_LABEL } from "@/lib/domain/status";
import { FilterParams, resolveFilter } from "@/lib/filters";
import { date, money, month } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TONE: Partial<Record<FinancialStatus, "good" | "warn" | "alert">> = {
  recebido: "good",
  vencido: "alert",
  vence_hoje: "warn",
  parcial: "warn",
  verificacao: "warn",
  perda: "alert",
};

/** The rows behind every indicator, for checking and traceability (§13). */
export default async function EntriesPage({ searchParams }: { searchParams: Promise<FilterParams & { situacao?: string; tipo?: string }> }) {
  const params = await searchParams;
  const today = todayInSaoPaulo();
  const sheet = await loadSheet(adminClient());
  const f = resolveFilter(params, today);
  const opts = filterOptions(sheet.entries);
  const rows = sheet.entries
    .filter((e) => inFilter(e, f))
    .filter((e) => !params.situacao || financialStatus(e, today) === params.situacao)
    .filter((e) => !params.tipo || (e.kind === "monetaria" && (params.tipo === "nf_emitida" ? e.nf.status === "emitida" : e.nf.status !== "emitida")))
    .sort((a, b) => a.row - b.row);
  const total = (pick: (e: (typeof rows)[number]) => number | null) => rows.reduce((t, e) => t + (e.kind === "monetaria" ? pick(e) ?? 0 : 0), 0);
  const subtitle = [params.situacao && STATUS_LABEL[params.situacao as FinancialStatus], params.tipo === "nf_emitida" && "NF emitida", params.tipo === "nf_pendente" && "NF pendente"].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader eyebrow="Lançamentos da planilha" title={`${f.label}${subtitle ? ` · ${subtitle}` : ""}`} />
      <FilterBar action="/lancamentos" values={f.params} {...opts} extraHidden={{ ...(params.situacao ? { situacao: params.situacao } : {}), ...(params.tipo ? { tipo: params.tipo } : {}) }} />
      <Card>
        <p className="mb-4 text-sm text-w7-green">
          {rows.length} lançamentos · K {money(total((e) => e.grossCents))} · L {money(total((e) => e.creatorCents))} · M {money(total((e) => e.w7Cents))} (somente monetários)
        </p>
        {rows.length === 0 ? (
          <Empty>Nenhum lançamento com esses filtros.</Empty>
        ) : (
          <Table head={["Linha", "Marca / creator", "Mês", "Prazo (I)", "Pagamento (J)", "K", "L", "M", "NF", "P", "Situação"]}>
            {rows.map((e) => {
              const st = financialStatus(e, today);
              return (
                <tr key={e.row} className="align-top">
                  <td className="num py-2 pr-3">{e.row}</td>
                  <td className="py-2 pr-3">
                    {e.undocumented ? "2023 — não documentado" : e.brand.name}
                    <span className="block text-xs text-w7-green">{e.creator.name}</span>
                  </td>
                  <td className="py-2 pr-3">{month(e.month)}</td>
                  <td className="py-2 pr-3">{date(e.jobDeadline)}</td>
                  <td className="py-2 pr-3">{date(e.paymentDate)}</td>
                  <td className="num py-2 pr-3">{money(e.grossCents)}</td>
                  <td className="num py-2 pr-3">{money(e.creatorCents)}</td>
                  <td className="num py-2 pr-3">{money(e.w7Cents)}</td>
                  <td className="py-2 pr-3 text-xs">{e.nf.raw || "—"}</td>
                  <td className="py-2 pr-3 text-xs">{e.paymentRaw || "—"}</td>
                  <td className="py-2">
                    <Badge tone={TONE[st] ?? "neutral"}>{STATUS_LABEL[st]}</Badge>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}

import Link from "next/link";
import { MonthlyColumns, RevenueStacked } from "@/components/charts";
import { FilterBar } from "@/components/FilterBar";
import { Card, Empty, PageHeader, Table } from "@/components/ui";
import { loadSheet } from "@/lib/data/load";
import { filterOptions } from "@/lib/data/options";
import { todayInSaoPaulo } from "@/lib/domain/dates";
import { inFilter, monthlySeries, samePeriodLastYear, summarize } from "@/lib/domain/metrics";
import { FilterParams, resolveFilter, withParams } from "@/lib/filters";
import { count, dateTime, money, month } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function Kpi({ label, value, hint, href, tone }: { label: string; value: string; hint?: string; href?: string; tone?: "alert" }) {
  const body = (
    <div className={`h-full rounded-2xl border bg-white p-5 transition ${href ? "hover:border-w7-green" : ""} ${tone === "alert" ? "border-w7-pink/50" : "border-w7-rose/40"}`}>
      <p className="text-xs uppercase tracking-[0.12em] text-w7-green/80">{label}</p>
      <p className="num mt-2 font-display text-2xl text-w7-forest md:text-[1.7rem]">{value}</p>
      {hint && <p className="mt-1 text-xs text-w7-green/80">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function delta(current: number, previous: number): string | undefined {
  if (!previous) return undefined;
  const d = (current - previous) / previous;
  return `${d >= 0 ? "+" : ""}${(d * 100).toFixed(0)}% vs. mesmo período do ano anterior`;
}

export default async function FinancialPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const params = await searchParams;
  const today = todayInSaoPaulo();
  const sheet = await loadSheet(adminClient());
  if (sheet.entries.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Financeiro" title="Painel financeiro" />
        <Empty>
          Ainda não há dados importados. Use <Link href="/fontes" className="text-w7-pink underline">Fontes de dados → Sincronizar agora</Link>.
        </Empty>
      </>
    );
  }

  const f = resolveFilter(params, today);
  const opts = filterOptions(sheet.entries);
  const rows = sheet.entries.filter((e) => inFilter(e, f));
  const s = summarize(rows, today);
  const last = summarize(sheet.entries.filter((e) => inFilter(e, samePeriodLastYear(f))), today);
  const series = monthlySeries(sheet.entries, f, today);
  let cumGross = 0;
  let cumW7 = 0;
  const table = series.map((p) => ({ ...p, cumGross: (cumGross += p.grossCents), cumW7: (cumW7 += p.w7Cents) }));
  const chart = series.map((p) => ({ label: month(p.month), volume: p.grossCents / 100, recebido: p.w7ReceivedCents / 100, aberto: p.w7OpenCents / 100 }));
  const link = (situacao?: string, tipo?: string) => withParams("/lancamentos", f.params, { situacao, tipo });
  const open = s.byStatus.a_receber.w7Cents + s.byStatus.vence_hoje.w7Cents + s.byStatus.vencido.w7Cents;
  const basisNote = f.basis === "recebimento" ? "por data de pagamento (coluna J)" : "por mês da entrega";

  return (
    <>
      <PageHeader eyebrow="Financeiro" title={`Resultados · ${f.label}`}>
        <p className="text-xs text-w7-green">
          Planilha lida em {dateTime(sheet.lastRun?.started_at)} · {basisNote}
        </p>
      </PageHeader>
      <FilterBar action="/" values={f.params} {...opts} />

      <h2 className="mb-3 text-xl">Volume e faturamento</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Volume bruto contratado (K)" value={money(s.grossCents)} hint={delta(s.grossCents, last.grossCents)} href={link()} />
        <Kpi label="Faturamento W7 (M)" value={money(s.w7Cents)} hint={delta(s.w7Cents, last.w7Cents)} href={link()} />
        <Kpi label="Entregas" value={String(s.deliveries)} hint={`${count(s.nonMonetary, "não monetária", "não monetárias")} à parte`} href={link()} />
        <Kpi label="Ticket médio por entrega" value={money(s.avgGrossPerDelivery)} hint={`Comissão média ${money(s.avgW7PerDelivery)}`} />
      </div>

      <h2 className="mb-3 mt-8 text-xl">Recebimentos (sobre o faturamento W7)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi label="Recebido" value={money(s.byStatus.recebido.w7Cents)} hint={`${count(s.byStatus.recebido.count, "entrega")} · data de referência: previsão (J)`} href={link("recebido")} />
        <Kpi label="A receber (no prazo)" value={money(s.byStatus.a_receber.w7Cents)} hint={`${count(s.byStatus.a_receber.count, "entrega")}`} href={link("a_receber")} />
        <Kpi label="Vence hoje" value={money(s.byStatus.vence_hoje.w7Cents)} hint={`${count(s.byStatus.vence_hoje.count, "entrega")}`} href={link("vence_hoje")} />
        <Kpi label="Vencido" value={money(s.byStatus.vencido.w7Cents)} hint={`${count(s.byStatus.vencido.count, "entrega")}`} href={link("vencido")} tone={s.byStatus.vencido.count ? "alert" : undefined} />
        <Kpi label="Pagamento parcial" value={money(s.byStatus.parcial.w7Cents)} hint={`${count(s.byStatus.parcial.count, "entrega")} para conferência`} href={link("parcial")} />
        <Kpi label="Em verificação" value={money(s.byStatus.verificacao.w7Cents)} hint={`${count(s.byStatus.verificacao.count, "entrega")}`} href={link("verificacao")} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="NF emitida" value={String(s.invoiced.count)} hint={money(s.invoiced.w7Cents)} href={link(undefined, "nf_emitida")} />
        <Kpi label="NF pendente" value={String(s.notInvoiced.count)} hint={money(s.notInvoiced.w7Cents)} href={link(undefined, "nf_pendente")} />
        <Kpi label="Permutas e vouchers" value={String(s.nonMonetary)} hint="Atividade não monetária" href={link("nao_monetario")} />
        <Kpi label="Perdas (prejuízo)" value={String(s.losses.count)} hint={s.losses.count ? `Perda informada ${money(s.losses.lossCents)}` : "Nenhuma no período"} href={link("perda")} />
      </div>
      {open > 0 && <p className="mt-3 text-xs text-w7-green">Total em aberto (a receber + vence hoje + vencido): {money(open)}.</p>}
      {s.receivedWithoutDate > 0 && <p className="mt-1 text-xs text-w7-pink">{count(s.receivedWithoutDate, "entrega marcada", "entregas marcadas")} como PAGO sem data na coluna J.</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Faturamento W7 por mês">
          <RevenueStacked data={chart} />
        </Card>
        <Card title="Volume bruto contratado (K) por mês">
          <MonthlyColumns data={chart} dataKey="volume" name="Volume bruto" />
        </Card>
      </div>

      <Card title="Evolução mensal" className="mt-6">
        <Table head={["Mês", "Entregas", "Volume (K)", "Acumulado K", "Faturamento W7 (M)", "Acumulado M", "Recebido", "Em aberto"]}>
          {table.map((p) => (
            <tr key={p.key}>
              <td className="py-2 pr-4">{month(p.month)}</td>
              <td className="num py-2 pr-4">{p.deliveries}</td>
              <td className="num py-2 pr-4">{money(p.grossCents)}</td>
              <td className="num py-2 pr-4 text-w7-green">{money(p.cumGross)}</td>
              <td className="num py-2 pr-4">{money(p.w7Cents)}</td>
              <td className="num py-2 pr-4 text-w7-green">{money(p.cumW7)}</td>
              <td className="num py-2 pr-4">{money(p.w7ReceivedCents)}</td>
              <td className="num py-2 pr-4">{money(p.w7OpenCents)}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}

import Link from "next/link";
import { RankingBars } from "@/components/charts";
import { FilterBar } from "@/components/FilterBar";
import { Badge, Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { loadSheet } from "@/lib/data/load";
import { filterOptions } from "@/lib/data/options";
import { todayInSaoPaulo } from "@/lib/domain/dates";
import {
  brandCreatorMatrix, brandLifecycle, brandStats, concentration, creatorStats, decomposeGrowth, Filter, growthFactors,
  inFilter, previousPeriod, samePeriodLastYear,
} from "@/lib/domain/metrics";
import { SheetEntry } from "@/lib/domain/sheet";
import { FilterParams, resolveFilter, withParams } from "@/lib/filters";
import { money } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(0)}%`);
const LIFE_LABEL = { nova: "Nova", recorrente: "Recorrente", ativa: "Ativa", inativa: "Inativa", perdida: "Perdida" } as const;

function GrowthCard({ title, entries, current, previous }: { title: string; entries: SheetEntry[]; current: Filter; previous: Filter }) {
  const g = decomposeGrowth(growthFactors(entries.filter((e) => inFilter(e, current))), growthFactors(entries.filter((e) => inFilter(e, previous))));
  const change = g.previous.grossCents ? (g.current.grossCents - g.previous.grossCents) / g.previous.grossCents : null;
  const factors = g.shares
    ? [
        { label: "Marcas atendidas", from: String(g.previous.brands), to: String(g.current.brands) },
        { label: "Entregas por marca", from: g.previous.deliveriesPerBrand!.toFixed(1), to: g.current.deliveriesPerBrand!.toFixed(1) },
        { label: "Ticket médio por entrega", from: money(Math.round(g.previous.avgTicketCents!)), to: money(Math.round(g.current.avgTicketCents!)) },
      ]
    : [];
  const rising = (from: number, to: number) => to > from;
  const raw = g.shares
    ? [
        { label: "marcas atendidas", up: rising(g.previous.brands, g.current.brands), same: g.previous.brands === g.current.brands },
        { label: "entregas por marca", up: rising(g.previous.deliveriesPerBrand!, g.current.deliveriesPerBrand!), same: g.previous.deliveriesPerBrand === g.current.deliveriesPerBrand },
        { label: "ticket médio", up: rising(g.previous.avgTicketCents!, g.current.avgTicketCents!), same: g.previous.avgTicketCents === g.current.avgTicketCents },
      ]
    : [];
  const grew = change !== null && change >= 0;
  const drivers = raw.filter((x) => !x.same && x.up === grew).map((x) => `${x.up ? "mais" : "menos"} ${x.label}`.replace("mais ticket médio", "ticket médio maior").replace("menos ticket médio", "ticket médio menor"));
  const offsets = raw.filter((x) => !x.same && x.up !== grew).map((x) => `${x.up ? "o aumento de" : "a redução de"} ${x.label}`);
  const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`);
  return (
    <Card title={title}>
      {!g.shares || change === null ? (
        <Empty>Sem dados suficientes nos dois períodos para comparar.</Empty>
      ) : (
        <>
          <p className="text-sm text-w7-forest">
            Volume bruto {change >= 0 ? "cresceu" : "caiu"} <strong>{pct(Math.abs(change))}</strong> ({money(g.previous.grossCents)} → {money(g.current.grossCents)}).
            {drivers.length > 0 && <> {grew ? "O crescimento veio de" : "A queda veio de"} <strong>{list(drivers)}</strong>.</>}
            {offsets.length > 0 && <> Em sentido contrário, {list(offsets)} {grew ? "freou" : "compensou"} parte da variação.</>}
          </p>
          <Table head={["Fator", "Antes", "Agora"]}>
            {factors.map((x) => (
              <tr key={x.label}>
                <td className="py-2 pr-4">{x.label}</td>
                <td className="num py-2 pr-4">{x.from}</td>
                <td className="num py-2 pr-4">{x.to}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-w7-green">
            Volume = marcas × entregas por marca × ticket médio. A tabela mostra o que mudou, não o motivo: um ticket maior pode vir de escopos maiores, não necessariamente de melhor negociação.
          </p>
        </>
      )}
    </Card>
  );
}

export default async function CommercialPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const params = await searchParams;
  const today = todayInSaoPaulo();
  const sheet = await loadSheet(adminClient());
  if (sheet.entries.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Comercial" title="Inteligência comercial" />
        <Empty>Ainda não há dados importados.</Empty>
      </>
    );
  }
  const f = resolveFilter({ ...params, base: "vigencia" }, today);
  const opts = filterOptions(sheet.entries);
  const rows = sheet.entries.filter((e) => inFilter(e, f));
  const brands = brandStats(rows);
  const creators = creatorStats(rows);
  const conc = concentration(brands);
  const life = brandLifecycle(sheet.entries, f, { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const matrix = brandCreatorMatrix(rows);
  const topBrands = brands.slice(0, 12);
  const matrixCreators = creators.filter((c) => topBrands.some((b) => matrix.get(b.key)?.has(c.key)));
  const maxCell = Math.max(1, ...topBrands.flatMap((b) => [...(matrix.get(b.key)?.values() ?? [])].map((c) => c.w7Cents)));
  const lostOrInactive = [...life.byBrand].filter(([, s]) => s === "perdida" || s === "inativa");
  const brandName = new Map(sheet.entries.map((e) => [e.brand.key, e.brand.name]));

  return (
    <>
      <PageHeader eyebrow="Comercial" title={`Marcas e creators · ${f.label}`} />
      <FilterBar action="/comercial" values={f.params} {...opts} showBasis={false} />

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Marcas ativas" value={life.active} hint="com entrega no período" />
        <Stat label="Novas marcas" value={life.new} hint="primeira entrega no período" />
        <Stat label="Recorrentes" value={life.recurring} hint="ativas e já atendidas antes" />
        <Stat label="Inativas" value={life.inactive} hint="4 a 6 meses sem entrega" />
        <Stat label="Perdidas" value={life.lost} hint="mais de 6 meses sem entrega" />
      </div>

      <h2 className="mb-3 mt-8 text-xl">Concentração da receita (faturamento W7)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Maior marca" value={pct(conc.top1)} hint={brands[0]?.name} />
        <Stat label="3 maiores marcas" value={pct(conc.top3)} />
        <Stat label="5 maiores marcas" value={pct(conc.top5)} />
      </div>
      {conc.top3 !== null && conc.top3 >= 0.5 && (
        <p className="mt-3 text-sm text-w7-pink">Atenção: as 3 maiores marcas concentram {pct(conc.top3)} do faturamento W7 no período. Alta dependência comercial.</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GrowthCard title="Crescimento vs. período anterior" entries={sheet.entries} current={f} previous={previousPeriod(f)} />
        <GrowthCard title="Crescimento vs. mesmo período do ano anterior" entries={sheet.entries} current={f} previous={samePeriodLastYear(f)} />
      </div>

      <Card title="Faturamento W7 por marca (12 maiores)" className="mt-6">
        {topBrands.length === 0 ? <Empty>Sem entregas no período.</Empty> : <RankingBars name="Faturamento W7" data={topBrands.map((b) => ({ label: b.name, value: b.w7Cents / 100 }))} />}
      </Card>

      <Card title="Marcas" className="mt-6">
        <Table head={["Marca", "Situação", "Entregas", "Volume (K)", "Faturamento W7 (M)", "Ticket médio", "Creators"]}>
          {brands.map((b) => (
            <tr key={b.key} className="align-top">
              <td className="py-2 pr-4">
                <Link href={withParams("/lancamentos", f.params, { marca: b.key })} className="hover:underline">
                  {b.name}
                </Link>
              </td>
              <td className="py-2 pr-4">{life.byBrand.get(b.key) && <Badge tone={life.byBrand.get(b.key) === "nova" ? "good" : "neutral"}>{LIFE_LABEL[life.byBrand.get(b.key)!]}</Badge>}</td>
              <td className="num py-2 pr-4">
                {b.deliveries}
                {b.deliveries > b.monetaryDeliveries && <span className="block text-xs text-w7-green">{b.deliveries - b.monetaryDeliveries} permuta/voucher</span>}
              </td>
              <td className="num py-2 pr-4">{money(b.grossCents)}</td>
              <td className="num py-2 pr-4">{money(b.w7Cents)}</td>
              <td className="num py-2 pr-4">{money(b.avgGrossCents)}</td>
              <td className="py-2 pr-4 text-xs">{b.creators.join(", ")}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Desempenho por creator" className="mt-6">
        <Table head={["Creator", "Entregas", "Marcas", "Volume (K)", "Valor creator (L)", "Faturamento W7 (M)"]}>
          {creators.map((c) => (
            <tr key={c.key}>
              <td className="py-2 pr-4">
                <Link href={withParams("/lancamentos", f.params, { creator: c.key })} className="hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="num py-2 pr-4">{c.deliveries}</td>
              <td className="num py-2 pr-4">{c.brands}</td>
              <td className="num py-2 pr-4">{money(c.grossCents)}</td>
              <td className="num py-2 pr-4">{money(c.creatorCents)}</td>
              <td className="num py-2 pr-4">{money(c.w7Cents)}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Matriz marca × creator (entregas · faturamento W7)" className="mt-6">
        {topBrands.length === 0 ? (
          <Empty>Sem entregas no período.</Empty>
        ) : (
          <Table head={["Marca", ...matrixCreators.map((c) => c.name)]}>
            {topBrands.map((b) => (
              <tr key={b.key}>
                <td className="py-2 pr-4">{b.name}</td>
                {matrixCreators.map((c) => {
                  const cell = matrix.get(b.key)?.get(c.key);
                  return (
                    <td key={c.key} className="py-1 pr-2">
                      {cell ? (
                        <div className="rounded-lg px-2 py-1 text-xs text-w7-forest" style={{ background: `rgba(30,138,102,${0.08 + 0.5 * (cell.w7Cents / maxCell)})` }}>
                          <span className="num block">{cell.deliveries}×</span>
                          <span className="num">{money(cell.w7Cents)}</span>
                        </div>
                      ) : (
                        <span className="text-w7-rose">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {lostOrInactive.length > 0 && (
        <Card title="Marcas inativas e perdidas (referência: fim do período)" className="mt-6">
          <div className="flex flex-wrap gap-2">
            {lostOrInactive.map(([key, s]) => (
              <Badge key={key} tone={s === "perdida" ? "alert" : "warn"}>
                {brandName.get(key)} · {LIFE_LABEL[s]}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

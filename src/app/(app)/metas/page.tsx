import { GoalForm } from "@/components/forms";
import { Card, Empty, PageHeader, Table } from "@/components/ui";
import { loadSheet } from "@/lib/data/load";
import { todayInSaoPaulo } from "@/lib/domain/dates";
import { goalProgress, inFilter, summarize } from "@/lib/domain/metrics";
import { SheetEntry } from "@/lib/domain/sheet";
import { dateTime, money } from "@/lib/format";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

interface GoalRow {
  kind: "comercial" | "financeira";
  period: "mes" | "ano";
  year: number;
  month: number;
  target_cents: number;
}

function realized(entries: SheetEntry[], kind: GoalRow["kind"], year: number, from: number, to: number, today: string) {
  const s = summarize(entries.filter((e) => inFilter(e, { from: { year, month: from }, to: { year, month: to }, basis: "vigencia" })), today);
  return kind === "comercial" ? s.grossCents : s.w7Cents;
}

function Progress({ percent }: { percent: number | null }) {
  const p = Math.max(0, Math.min(1, percent ?? 0));
  return (
    <div className="h-2 w-full rounded-full bg-w7-rose/30" role="img" aria-label={`${Math.round((percent ?? 0) * 100)}% atingido`}>
      <div className="h-2 rounded-full bg-w7-green" style={{ width: `${p * 100}%` }} />
    </div>
  );
}

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  const { ano } = await searchParams;
  const today = todayInSaoPaulo();
  const year = /^\d{4}$/.test(ano ?? "") ? Number(ano) : Number(today.slice(0, 4));
  const db = adminClient();
  const [sheet, goalsRes, historyRes] = await Promise.all([
    loadSheet(db),
    db.from("goals").select("*").eq("year", year),
    db.from("goal_history").select("*").eq("year", year).order("changed_at", { ascending: false }).limit(20),
  ]);
  const goals = (goalsRes.data ?? []) as GoalRow[];
  const target = (kind: GoalRow["kind"], period: GoalRow["period"], month = 0) =>
    goals.find((g) => g.kind === kind && g.period === period && g.month === month)?.target_cents ?? null;
  const currentYear = Number(today.slice(0, 4));
  const monthsElapsed = year < currentYear ? 12 : year === currentYear ? Number(today.slice(5, 7)) : 0;
  const years = [...new Set([...sheet.entries.map((e) => e.month?.year).filter((y): y is number => !!y), currentYear, currentYear + 1])].sort();

  return (
    <>
      <PageHeader eyebrow="Metas" title={`Metas de ${year}`}>
        <form method="get" className="flex items-end gap-2">
          <select name="ano" defaultValue={year} className="rounded-lg border border-w7-rose bg-white px-3 py-2 text-sm">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button className="rounded-lg bg-w7-forest px-3 py-2 text-sm text-white">Ver</button>
        </form>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {(["comercial", "financeira"] as const).map((kind) => {
          const t = target(kind, "ano");
          const r = realized(sheet.entries, kind, year, 1, 12, today);
          const g = t !== null ? goalProgress(t, r, monthsElapsed) : null;
          return (
            <Card key={kind} title={kind === "comercial" ? "Meta comercial anual · volume bruto (K)" : "Meta financeira anual · faturamento W7 (M)"}>
              {g ? (
                <>
                  <p className="num font-display text-3xl">{g.percent === null ? "—" : `${(g.percent * 100).toFixed(0)}%`}</p>
                  <div className="my-3">
                    <Progress percent={g.percent} />
                  </div>
                  <p className="text-sm text-w7-green">
                    Realizado {money(g.realizedCents)} de {money(g.targetCents)} · faltam {money(g.remainingCents)}
                  </p>
                  {g.projectionCents !== null && year === currentYear && (
                    <p className="mt-1 text-sm text-w7-green">Projeção de fechamento no ritmo atual: {money(g.projectionCents)}</p>
                  )}
                </>
              ) : (
                <Empty>Meta não definida. Realizado até agora: {money(r)}.</Empty>
              )}
            </Card>
          );
        })}
      </div>

      <Card title="Metas mensais" className="mt-6">
        <Table head={["Mês", "Meta comercial (K)", "Realizado K", "%", "Meta financeira (M)", "Realizado M", "%"]}>
          {MONTHS.map((label, i) => {
            const m = i + 1;
            const rk = realized(sheet.entries, "comercial", year, m, m, today);
            const rm = realized(sheet.entries, "financeira", year, m, m, today);
            const tk = target("comercial", "mes", m);
            const tm = target("financeira", "mes", m);
            const p = (r: number, t: number | null) => (t ? `${((r / t) * 100).toFixed(0)}%` : "—");
            return (
              <tr key={label}>
                <td className="py-2 pr-4">{label}</td>
                <td className="num py-2 pr-4">{money(tk)}</td>
                <td className="num py-2 pr-4">{money(rk)}</td>
                <td className="num py-2 pr-4">{p(rk, tk)}</td>
                <td className="num py-2 pr-4">{money(tm)}</td>
                <td className="num py-2 pr-4">{money(rm)}</td>
                <td className="num py-2 pr-4">{p(rm, tm)}</td>
              </tr>
            );
          })}
        </Table>
        <p className="mt-3 text-xs text-w7-green">Realizado pelo mês da entrega. Comercial usa o volume bruto (K); financeira usa o faturamento W7 (M). As duas nunca se misturam.</p>
      </Card>

      <Card title="Definir ou alterar meta" className="mt-6">
        <GoalForm year={year} />
      </Card>

      <Card title="Histórico de alterações" className="mt-6">
        {(historyRes.data ?? []).length === 0 ? (
          <Empty>Nenhuma meta registrada para {year}.</Empty>
        ) : (
          <Table head={["Quando", "Quem", "Meta", "Período", "Valor"]}>
            {(historyRes.data ?? []).map((h: { id: number; changed_at: string; changed_by: string; kind: string; period: string; month: number; target_cents: number }) => (
              <tr key={h.id}>
                <td className="py-2 pr-4">{dateTime(h.changed_at)}</td>
                <td className="py-2 pr-4">{h.changed_by}</td>
                <td className="py-2 pr-4">{h.kind}</td>
                <td className="py-2 pr-4">{h.period === "ano" ? "anual" : MONTHS[h.month - 1]}</td>
                <td className="num py-2 pr-4">{money(h.target_cents)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Data colors validated for color-vision deficiency (dataviz validator, light surface).
// Brand colors stay in the interface; these two carry the data.
export const SERIES = { received: "#1E8A66", open: "#D9862B", single: "#1E8A66" } as const;
const GRID = "#e1e0d9";
const AXIS = "#6b7a76";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const compact = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi` : v >= 1000 ? `${Math.round(v / 1000)} mil` : String(v);

export interface ChartPoint {
  label: string;
  [key: string]: number | string;
}

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((t, p) => t + p.value, 0);
  return (
    <div className="rounded-xl border border-w7-rose/50 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-w7-forest">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-w7-forest">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <span className="num">{brl.format(p.value)}</span>
        </p>
      ))}
      {payload.length > 1 && <p className="mt-1 text-w7-green">Total: <span className="num">{brl.format(total)}</span></p>}
    </div>
  );
}

/** Single-series monthly columns (e.g. volume K). The title names the series; no legend. */
export function MonthlyColumns({ data, dataKey, name }: { data: ChartPoint[]; dataKey: string; name: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
        <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tickFormatter={compact} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(38,64,59,0.05)" }} />
        <Bar dataKey={dataKey} name={name} fill={SERIES.single} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** W7 revenue per month split into received and open, stacked with a 2px surface gap. */
export function RevenueStacked({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
        <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis tickFormatter={compact} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(38,64,59,0.05)" }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: "#26403B" }} />
        <Bar dataKey="recebido" name="Recebido" stackId="m" fill={SERIES.received} maxBarSize={24} stroke="#ffffff" strokeWidth={2} isAnimationActive={false} />
        <Bar dataKey="aberto" name="Em aberto" stackId="m" fill={SERIES.open} maxBarSize={24} radius={[4, 4, 0, 0]} stroke="#ffffff" strokeWidth={2} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranking bars (single series): value at the tip, ≤ 24px thick. */
export function RankingBars({ data, name }: { data: { label: string; value: number }[]; name: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 30 + 20)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 72, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID} strokeWidth={1} />
        <XAxis type="number" tickFormatter={compact} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={130} tick={{ fill: "#26403B", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(38,64,59,0.05)" }} />
        <Bar
          dataKey="value"
          name={name}
          fill={SERIES.single}
          maxBarSize={18}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
          label={{ position: "right", fill: "#26403B", fontSize: 11, formatter: (v: number) => brl.format(v) }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

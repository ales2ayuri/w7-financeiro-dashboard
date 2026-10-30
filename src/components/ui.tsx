import { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-w7-rose/50 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-w7-pink">{eyebrow}</p>
        <h1 className="mt-2 text-3xl text-w7-forest md:text-4xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-w7-rose/40 bg-white p-5 shadow-[0_1px_0_rgba(38,64,59,0.04)] ${className}`}>
      {title && <h2 className="mb-4 text-lg text-w7-forest">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-w7-rose/40 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-w7-green/80">{label}</p>
      <p className="num mt-2 font-display text-3xl text-w7-forest">{value}</p>
      {hint && <p className="mt-1 text-sm text-w7-green/80">{hint}</p>}
    </div>
  );
}

const TONES = {
  neutral: "bg-w7-forest/5 text-w7-forest",
  good: "bg-w7-green/10 text-w7-green",
  warn: "bg-w7-rose/30 text-w7-forest",
  alert: "bg-w7-pink/10 text-w7-pink",
} as const;

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-w7-ivory p-6 text-center text-sm text-w7-green">{children}</p>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-w7-rose/50 text-xs uppercase tracking-wider text-w7-green/80">
            {head.map((h, i) => (
              <th key={`${i}-${h}`} className="py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-w7-rose/25">{children}</tbody>
      </table>
    </div>
  );
}

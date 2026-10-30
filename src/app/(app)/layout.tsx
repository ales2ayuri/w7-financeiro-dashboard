import Link from "next/link";
import { requireUser } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Financeiro" },
  { href: "/comercial", label: "Comercial" },
  { href: "/metas", label: "Metas" },
  { href: "/lancamentos", label: "Lançamentos" },
  { href: "/conciliacao", label: "Conciliação" },
  { href: "/alertas", label: "Alertas" },
  { href: "/fontes", label: "Fontes de dados" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const email = await requireUser();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-w7-forest text-w7-ivory lg:fixed lg:inset-y-0 lg:w-64">
        <div className="flex items-center justify-between px-6 py-5 lg:block lg:py-8">
          <div>
            <p className="font-display text-2xl tracking-wide">W7 Creator</p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-w7-rose">Inteligência</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm text-w7-ivory/85 transition hover:bg-w7-green hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="hidden px-8 pt-8 text-xs text-w7-rose/80 lg:absolute lg:bottom-6 lg:block">{email}</p>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 lg:ml-64 lg:py-12">{children}</main>
    </div>
  );
}

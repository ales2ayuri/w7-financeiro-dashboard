"use client";

import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  action: string;
  values: Record<string, string>;
  brands: Option[];
  creators: Option[];
  years: number[];
  showBasis?: boolean;
  extraHidden?: Record<string, string>;
}

const field = "rounded-lg border border-w7-rose bg-white px-3 py-2 text-sm text-w7-forest";

/** One row of filters above the charts (§13: month, quarter, year or custom period). */
export function FilterBar({ action, values, brands, creators, years, showBasis = true, extraHidden = {} }: Props) {
  const [type, setType] = useState(values.periodo || "ano");
  const year = String(years[years.length - 1] ?? new Date().getFullYear());
  return (
    <form action={action} method="get" className="mb-8 flex flex-wrap items-end gap-3 rounded-2xl border border-w7-rose/40 bg-white p-4">
      {Object.entries(extraHidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className="text-xs text-w7-green">
        Período
        <select name="periodo" value={type} onChange={(e) => setType(e.target.value)} className={`mt-1 block ${field}`}>
          <option value="mes">Mês</option>
          <option value="trimestre">Trimestre</option>
          <option value="ano">Ano</option>
          <option value="personalizado">Personalizado</option>
        </select>
      </label>
      {type === "mes" && (
        <label className="text-xs text-w7-green">
          Mês
          <input type="month" name="mes" defaultValue={values.mes} className={`mt-1 block ${field}`} />
        </label>
      )}
      {type === "trimestre" && (
        <label className="text-xs text-w7-green">
          Trimestre
          <select name="trimestre" defaultValue={values.trimestre} className={`mt-1 block ${field}`}>
            {years.flatMap((y) => [1, 2, 3, 4].map((q) => <option key={`${y}-${q}`} value={`${y}-Q${q}`}>{`${q}º tri ${y}`}</option>))}
          </select>
        </label>
      )}
      {type === "ano" && (
        <label className="text-xs text-w7-green">
          Ano
          <select name="ano" defaultValue={values.ano || year} className={`mt-1 block ${field}`}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}
      {type === "personalizado" && (
        <>
          <label className="text-xs text-w7-green">
            De
            <input type="month" name="de" defaultValue={values.de} className={`mt-1 block ${field}`} />
          </label>
          <label className="text-xs text-w7-green">
            Até
            <input type="month" name="ate" defaultValue={values.ate} className={`mt-1 block ${field}`} />
          </label>
        </>
      )}
      {showBasis && (
        <label className="text-xs text-w7-green">
          Base de data
          <select name="base" defaultValue={values.base || "vigencia"} className={`mt-1 block ${field}`}>
            <option value="vigencia">Mês da entrega</option>
            <option value="recebimento">Data de pagamento (J)</option>
          </select>
        </label>
      )}
      <label className="text-xs text-w7-green">
        Marca
        <select name="marca" defaultValue={values.marca || ""} className={`mt-1 block max-w-[12rem] ${field}`}>
          <option value="">Todas</option>
          {brands.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-w7-green">
        Creator
        <select name="creator" defaultValue={values.creator || ""} className={`mt-1 block ${field}`}>
          <option value="">Todas</option>
          {creators.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <button className="rounded-lg bg-w7-forest px-4 py-2 text-sm font-medium text-white hover:bg-w7-green">Aplicar</button>
    </form>
  );
}

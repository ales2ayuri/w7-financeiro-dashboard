import { cleanText, textKey } from "./text";

export interface Normalization {
  from: string;
  to: string;
  reason: string;
}

/**
 * Brand normalizations approved in the specification (§11). Applied only inside the
 * dashboard; the sheet and Asana are never changed. Keys are compared via textKey.
 */
export const BRAND_NORMALIZATIONS: Normalization[] = [
  { from: "ED VIDA", to: "EDITORA VIDA", reason: "Variação de grafia aprovada (§11)" },
  { from: "ED. VIDA", to: "EDITORA VIDA", reason: "Variação de grafia aprovada (§11)" },
  { from: "HELEN", to: "MENTORIA MSA", reason: "Normalização aprovada (§11)" },
  { from: "HELEN MSA", to: "MENTORIA MSA", reason: "Normalização aprovada (§11)" },
  { from: "GOCASE ADENDO", to: "GOCASE", reason: "Mesma marca; cada lançamento permanece independente (§11)" },
  { from: "GOCASE EXTRA BLACK", to: "GOCASE", reason: "Mesma marca; cada lançamento permanece independente (§11)" },
];

/** Brand used only for 2023 rows whose campaigns were not documented (§11). */
export const UNDOCUMENTED_BRAND_KEY = "DIVERSAS";
export const UNDOCUMENTED_LABEL = "2023 — campanhas não documentadas";

/** Creator names that cannot be attributed without a manual decision (§11). */
export const UNIDENTIFIED_CREATOR_KEYS = new Set(["VITORIA"]);

const brandMap = new Map(BRAND_NORMALIZATIONS.map((n) => [textKey(n.from), n]));

export interface NormalizedName {
  raw: string;
  name: string;
  key: string;
  normalization: Normalization | null;
}

export function normalizeBrand(raw: string | null | undefined): NormalizedName {
  const cleaned = cleanText(raw);
  const rule = brandMap.get(textKey(cleaned)) ?? null;
  const name = rule ? rule.to : cleaned.toUpperCase();
  return { raw: cleaned, name, key: textKey(name), normalization: rule };
}

export function normalizeCreator(raw: string | null | undefined): NormalizedName {
  const cleaned = cleanText(raw);
  const name = cleaned.toUpperCase();
  return { raw: cleaned, name, key: textKey(name), normalization: null };
}

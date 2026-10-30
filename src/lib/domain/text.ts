/** Collapses whitespace and trims. Keeps accents and case as typed. */
export function cleanText(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim();
}

/** Comparison key: upper case, no accents, single spaces. Never shown to the user. */
export function textKey(raw: string | null | undefined): string {
  return cleanText(raw)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

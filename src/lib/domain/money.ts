import { cleanText, textKey } from "./text";

export type MoneyCell =
  | { kind: "empty" }
  | { kind: "value"; cents: number }
  | { kind: "text"; text: string };

const CURRENCY = /^(-)?\s*R\$\s*(-)?\s*(.*)$/i;
const AMOUNT = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/**
 * Parses a Brazilian currency cell as shown in the sheet:
 * " R$ 4.000,00 ", "R$0,00", " R$ -   " (zero), "-R$ 5.400,00", "PERMUTA".
 * Values are kept in integer cents to avoid rounding errors.
 */
export function parseMoney(raw: string | null | undefined): MoneyCell {
  const text = cleanText(raw);
  if (!text) return { kind: "empty" };

  const currency = CURRENCY.exec(text);
  if (currency) {
    const [, leadingMinus, , body] = currency;
    if (body === "") return { kind: "value", cents: 0 };
    const amount = AMOUNT.exec(body);
    if (amount) {
      const cents = Number(amount[1].replace(/\./g, "")) * 100 + Number((amount[2] ?? "").padEnd(2, "0"));
      return { kind: "value", cents: leadingMinus ? -cents : cents };
    }
  }
  return { kind: "text", text: textKey(text) };
}

export function centsOf(cell: MoneyCell): number | null {
  return cell.kind === "value" ? cell.cents : null;
}

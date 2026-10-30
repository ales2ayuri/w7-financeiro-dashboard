import "server-only";
import { JWT } from "google-auth-library";
import { env } from "@/lib/env";
import { Merge } from "@/lib/domain/sheet";

interface SheetsResponse {
  sheets?: {
    merges?: { startRowIndex?: number; endRowIndex?: number; startColumnIndex?: number; endColumnIndex?: number }[];
    data?: { startRow?: number; rowData?: { values?: { formattedValue?: string }[] }[] }[];
  }[];
}

export interface SheetRead {
  grid: string[][];
  merges: Merge[];
}

/**
 * Reads the FINANCEIRO tab with read-only scope: displayed values (as the user sees them)
 * plus merged ranges, which the values endpoint alone does not report.
 */
export async function readFinanceSheet(): Promise<SheetRead> {
  const auth = new JWT({
    email: env.googleServiceAccountEmail(),
    key: env.googlePrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const range = `${env.googleSheetTab()}!A1:Q5000`;
  const fields = "sheets(merges,data(startRow,rowData(values(formattedValue))))";
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.googleSheetId())}` +
    `?ranges=${encodeURIComponent(range)}&includeGridData=true&fields=${encodeURIComponent(fields)}`;

  const { data } = await auth.request<SheetsResponse>({ url });
  const sheet = data.sheets?.[0];
  const block = sheet?.data?.[0];
  const offset = block?.startRow ?? 0;
  const grid: string[][] = [];
  (block?.rowData ?? []).forEach((r, i) => {
    grid[offset + i] = (r.values ?? []).map((v) => v.formattedValue ?? "");
  });
  for (let i = 0; i < grid.length; i++) grid[i] ??= [];

  const merges: Merge[] = (sheet?.merges ?? []).map((m) => ({
    startRow: m.startRowIndex ?? 0,
    endRow: m.endRowIndex ?? 0,
    startCol: m.startColumnIndex ?? 0,
    endCol: m.endColumnIndex ?? 0,
  }));
  return { grid, merges };
}

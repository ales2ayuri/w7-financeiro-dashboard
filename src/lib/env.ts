import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const env = {
  googleServiceAccountEmail: () => required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  // Keys pasted into Vercel usually carry literal "\n" sequences.
  googlePrivateKey: () => required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  googleSheetId: () => required("GOOGLE_SHEET_ID"),
  googleSheetTab: () => process.env.GOOGLE_SHEET_TAB || "FINANCEIRO",
  asanaToken: () => required("ASANA_ACCESS_TOKEN"),
  asanaProjectGid: () => process.env.ASANA_PROJECT_GID || "1211247788752322",
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  cronSecret: () => process.env.CRON_SECRET || "",
  allowedEmails: () =>
    (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
};

export function isAllowedEmail(email: string | null | undefined): boolean {
  return Boolean(email) && env.allowedEmails().includes(email!.toLowerCase());
}

import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { syncAsana, syncSheet } from "@/lib/sync/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Scheduled synchronization (Vercel Cron). Protected by CRON_SECRET. */
export async function GET(request: NextRequest) {
  const secret = env.cronSecret();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const db = adminClient();
  const result: Record<string, unknown> = {};
  for (const [name, run] of [["sheet", syncSheet], ["asana", syncAsana]] as const) {
    try {
      const { touched, ...summary } = await run(db, "cron");
      result[name] = { ...summary, touched: touched.length };
    } catch (err) {
      result[name] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return NextResponse.json(result);
}

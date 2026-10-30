import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Server-only client with the service role. Never sent to the browser. */
export function adminClient(): SupabaseClient {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import "server-only";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/server";

/** Signed-in, authorized user's e-mail; redirects to the login page otherwise. */
export async function requireUser(): Promise<string> {
  const supabase = await sessionClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  if (!email || !isAllowedEmail(email)) redirect("/login");
  return email.toLowerCase();
}

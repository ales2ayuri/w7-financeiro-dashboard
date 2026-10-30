"use server";

import { headers } from "next/headers";
import { isAllowedEmail } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/server";

export interface LoginState {
  message: string | null;
  ok: boolean;
}

/** Sends a sign-in link only to authorized e-mails; the answer does not reveal which. */
export async function sendLoginLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const sent: LoginState = { ok: true, message: "Se este e-mail tiver acesso, você receberá um link para entrar." };
  if (!email) return { ok: false, message: "Informe seu e-mail." };
  if (!isAllowedEmail(email)) return sent;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  return error ? { ok: false, message: "Não foi possível enviar o link agora. Tente novamente." } : sent;
}

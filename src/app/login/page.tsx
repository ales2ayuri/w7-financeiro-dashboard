"use client";

import { useActionState } from "react";
import { sendLoginLink, LoginState } from "./actions";

const initial: LoginState = { ok: false, message: null };

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendLoginLink, initial);
  return (
    <main className="flex min-h-screen items-center justify-center bg-w7-forest px-4">
      <div className="w-full max-w-sm rounded-3xl bg-w7-ivory p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-w7-pink">W7 Creator</p>
        <h1 className="mt-3 text-3xl text-w7-forest">Inteligência financeira</h1>
        <p className="mt-2 text-sm text-w7-green">Acesso restrito. Enviaremos um link de entrada para o seu e-mail.</p>
        <form action={action} className="mt-8 space-y-4">
          <label className="block text-sm text-w7-forest">
            E-mail
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-w7-rose bg-white px-4 py-3 outline-none focus:border-w7-green"
            />
          </label>
          <button
            disabled={pending}
            className="w-full rounded-xl bg-w7-forest px-4 py-3 text-sm font-medium text-white transition hover:bg-w7-green disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Receber link de acesso"}
          </button>
          {state.message && <p className={`text-sm ${state.ok ? "text-w7-green" : "text-w7-pink"}`}>{state.message}</p>}
        </form>
      </div>
    </main>
  );
}

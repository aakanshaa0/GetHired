"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Briefcase className="h-4.5 w-4.5" />
          </span>
          GetHired
        </Link>

        <div className="card p-8">
          {status === "sent" ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-4 text-sm text-slate-600">
                Check <strong className="text-slate-900">{email}</strong> for a sign-in link.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500">We&apos;ll email you a magic link — no password needed.</p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full pl-9"
                  />
                </div>
                <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
                  {status === "sending" ? "Sending..." : "Send magic link"}
                </button>
                {error && <p className="text-sm text-rose-600">{error}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

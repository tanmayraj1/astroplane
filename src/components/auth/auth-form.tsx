"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { SparkleIcon } from "@/components/icons";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const supabase = createClient();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/today";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError("That code didn't match — check the email and try again.");
    } else {
      router.push(next);
      router.refresh();
    }
  }

  async function withGoogle() {
    setBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="rise d1 w-full max-w-[380px] rounded-[24px] border border-line bg-surface p-7 shadow-[var(--shadow-card)]">
      <div className="eyebrow">{mode === "sign-in" ? "Welcome back" : "Begin"}</div>
      <h1 className="mt-2 font-display text-[26px] font-bold leading-tight text-ink">
        {mode === "sign-in" ? "Your sky is waiting." : "Where the sky begins."}
      </h1>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-body">
        {stage === "email"
          ? "We'll email you a six-digit code — no password to remember."
          : `Enter the code we sent to ${email}.`}
      </p>

      {stage === "email" ? (
        <form onSubmit={sendCode} className="mt-5 flex flex-col gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[14px] border border-line bg-surface-alt px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-gold"
            />
          </label>
          <Button type="submit" disabled={busy || !email} className="mt-1 w-full">
            {busy ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-5 flex flex-col gap-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="tnum w-full rounded-[14px] border border-line bg-surface-alt px-4 py-3 text-center text-[22px] font-bold tracking-[8px] text-ink outline-none placeholder:text-faint focus:border-gold"
          />
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy ? "Checking…" : "Enter Astroplane"}
          </Button>
          <button
            type="button"
            onClick={() => setStage("email")}
            className="text-[11.5px] font-semibold text-muted hover:text-ink"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && (
        <p className="mt-3 rounded-[10px] bg-[rgba(192,90,59,.1)] px-3 py-2 text-[11.5px] font-semibold text-clay">
          {error}
        </p>
      )}

      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[2px] text-faint">
        <span className="h-px flex-1 bg-line-soft" />
        or
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <button
        onClick={withGoogle}
        disabled={busy}
        className="pressable flex w-full items-center justify-center gap-2.5 rounded-full border border-line-btn bg-surface px-6 py-3 text-[13.5px] font-bold text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
          />
        </svg>
        Continue with Google
      </button>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[10.5px] font-semibold text-faint">
        <SparkleIcon size={10} className="text-gold" />
        {mode === "sign-in" ? "New here? The habit is free." : "Free forever tier — no card needed."}
      </p>
    </div>
  );
}

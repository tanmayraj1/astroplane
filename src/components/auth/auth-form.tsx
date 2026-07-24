"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setBusy(false);
        setError(
          error.message.includes("already registered")
            ? "That email already has an account — sign in instead."
            : error.message
        );
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setBusy(false);
        setError(
          error.message === "Invalid login credentials"
            ? "Email or password didn't match — try again."
            : error.message
        );
        return;
      }
    }
    // Hard navigation so the auth cookie is guaranteed on the first server
    // render — avoids the router-cache flash between sign-in and the app.
    window.location.assign(next);
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
        {mode === "sign-in"
          ? "Sign in with your email and password."
          : "Create your account — free forever tier, no card needed."}
      </p>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-[14px] border border-line bg-surface-alt px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[9.5px] font-bold uppercase tracking-[2px] text-gold">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "sign-up" ? "At least 6 characters" : "Your password"}
              className="w-full rounded-[14px] border border-line bg-surface-alt px-4 py-3 pr-16 text-[14px] text-ink outline-none placeholder:text-faint focus:border-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10.5px] font-bold uppercase tracking-[1px] text-muted hover:text-ink"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <Button
          type="submit"
          disabled={busy || !email || password.length < 6}
          className="mt-1 w-full"
        >
          {busy
            ? mode === "sign-up"
              ? "Creating…"
              : "Signing in…"
            : mode === "sign-up"
              ? "Cast my chart"
              : "Enter Astroplane"}
        </Button>
      </form>

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
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link href="/sign-up" className="font-bold">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have one?{" "}
            <Link href="/sign-in" className="font-bold">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

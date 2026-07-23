"use client";

import { useState, useTransition } from "react";
import { setNotificationPref, signOut } from "@/server/actions/profile";
import { cn } from "@/lib/utils";

/** iOS-style toggle per design: track 44×26, knob 22, left 2px→20px */
export function Toggle({
  prefKey,
  initial,
}: {
  prefKey: "daily_card_push" | "voc_alerts" | "guide_replies" | "email_digest";
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [, startTransition] = useTransition();

  function flip() {
    const next = !on;
    setOn(next);
    startTransition(() => setNotificationPref(prefKey, next));
  }

  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={flip}
      className={cn(
        "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200",
        on ? "bg-ink" : "bg-line-dot",
      )}
    >
      <span
        className="absolute top-[2px] h-[22px] w-[22px] rounded-full bg-surface shadow-sm transition-[left] duration-200"
        style={{ left: on ? 20 : 2 }}
      />
    </button>
  );
}

export function SignOutButton() {
  const [busy, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => signOut())}
      disabled={busy}
      className="text-[13px] font-bold text-clay hover:opacity-80"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Checkable nudges — per-day state kept locally (they reset with tomorrow's card). */
export function NudgeList({ nudges, date }: { nudges: string[]; date: string }) {
  const storageKey = `nudges:${date}`;
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [storageKey]);

  function toggle(i: number) {
    setDone((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {nudges.map((n, i) => {
        const checked = hydrated && !!done[i];
        return (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={cn(
              "pressable-soft flex items-start gap-3 rounded-[18px] border p-4 text-left transition-colors duration-200",
              checked ? "border-transparent bg-ink" : "border-line bg-surface",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] transition-colors duration-200",
                checked ? "border-gold-bright bg-transparent" : "border-line-check",
              )}
            >
              <CheckIcon
                size={12}
                className={cn(
                  "text-gold-bright transition-opacity duration-200",
                  checked ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold leading-relaxed transition-colors duration-200",
                checked ? "text-[rgba(232,220,196,.65)] line-through" : "text-ink-2",
              )}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}

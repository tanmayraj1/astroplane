"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { logMood } from "@/server/actions/mood";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@/components/icons";

const MOODS = [
  { v: 1, roman: "I", label: "Drained" },
  { v: 2, roman: "II", label: "Low" },
  { v: 3, roman: "III", label: "Even" },
  { v: 4, roman: "IV", label: "Bright" },
  { v: 5, roman: "V", label: "Lit" },
];

export function MoodCheckin({ initialMood }: { initialMood: number | null }) {
  const [selected, setSelected] = useState<number | null>(initialMood);
  const [pending, startTransition] = useTransition();
  const [logged, setLogged] = useState(initialMood !== null);

  function pick(v: number) {
    setSelected(v);
    startTransition(async () => {
      await logMood({ mood: v });
      setLogged(true);
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        {MOODS.map((m) => (
          <button
            key={m.v}
            onClick={() => pick(m.v)}
            disabled={pending}
            className="group flex flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "flex h-[40px] w-[40px] items-center justify-center rounded-full border font-display text-[13px] font-bold transition-all duration-200",
                "group-active:scale-90",
                selected === m.v
                  ? "border-transparent bg-ink text-cream"
                  : "border-line-dot bg-surface-alt text-body",
              )}
            >
              {m.roman}
            </span>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-[1px]",
                selected === m.v ? "text-ink" : "text-faint",
              )}
            >
              {m.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <p className="font-accent text-[14px] italic text-muted">
          {logged
            ? "Logged — this feeds your patterns, never anyone else's."
            : "How is your energy right now?"}
        </p>
        <Link
          href="/patterns"
          className="flex shrink-0 items-center gap-1 text-[11.5px] font-bold text-gold-dark"
        >
          Patterns <ArrowRightIcon size={12} />
        </Link>
      </div>
    </div>
  );
}

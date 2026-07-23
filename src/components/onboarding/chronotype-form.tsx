"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChronotype } from "@/server/actions/onboarding";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { key: "lark", title: "Before 6 am", sub: "Lark — the world is yours at dawn" },
  { key: "early", title: "6 – 7:30 am", sub: "Early bird with a snooze button" },
  { key: "mid", title: "7:30 – 9 am", sub: "Steady middle rhythm" },
  { key: "owl", title: "After 9 am", sub: "Night owl — evenings are your peak" },
] as const;

export function ChronotypeForm() {
  const router = useRouter();
  const [sel, setSel] = useState<(typeof OPTIONS)[number]["key"]>("early");
  const [busy, setBusy] = useState(false);

  async function submit(skip = false) {
    setBusy(true);
    await saveChronotype(skip ? null : sel);
    router.push("/onboarding/focus");
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {OPTIONS.map((o, i) => (
        <button
          key={o.key}
          onClick={() => setSel(o.key)}
          className={cn(
            `rise d${i + 3}`,
            "pressable-soft flex items-center gap-3.5 rounded-[18px] border p-4 text-left transition-colors duration-200",
            sel === o.key
              ? "border-gold bg-selected"
              : "border-line bg-surface",
          )}
        >
          <span
            className={cn(
              "flex h-[20px] w-[20px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-200",
              sel === o.key ? "border-gold" : "border-line-check",
            )}
          >
            {sel === o.key && <span className="h-[10px] w-[10px] rounded-full bg-gold" />}
          </span>
          <span>
            <span className="block text-[14.5px] font-bold text-ink">{o.title}</span>
            <span className="mt-0.5 block font-accent text-[13.5px] italic text-muted">
              {o.sub}
            </span>
          </span>
        </button>
      ))}

      <Button onClick={() => submit(false)} disabled={busy} className="rise d7 mt-3 w-full">
        Continue
      </Button>
      <button
        onClick={() => submit(true)}
        disabled={busy}
        className="rise d8 text-[12px] font-semibold text-muted hover:text-ink"
      >
        Skip for now — ask me later.
      </button>
    </div>
  );
}

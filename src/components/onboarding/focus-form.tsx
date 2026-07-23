"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFocusAreas } from "@/server/actions/onboarding";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const AREAS = [
  { key: "plan", label: "Plan my day" },
  { key: "timing", label: "Timing big moves" },
  { key: "tarot", label: "Tarot & reflection" },
  { key: "relationships", label: "Relationships" },
  { key: "career", label: "Career" },
  { key: "rest", label: "Rest & health" },
];

export function FocusForm() {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set(["plan", "timing"]));
  const [busy, setBusy] = useState(false);

  function toggle(key: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    await saveFocusAreas([...sel]);
    router.push("/onboarding/reveal");
  }

  return (
    <div className="mt-6">
      <div className="rise d3 flex flex-wrap gap-2.5">
        {AREAS.map((a) => (
          <button
            key={a.key}
            onClick={() => toggle(a.key)}
            className={cn(
              "pressable rounded-full border px-4.5 py-2.5 text-[13px] font-bold transition-colors duration-200",
              sel.has(a.key)
                ? "border-transparent bg-ink text-cream"
                : "border-line-btn bg-surface text-body",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <Button
        onClick={submit}
        disabled={busy || sel.size === 0}
        className="rise d5 mt-8 w-full"
      >
        {busy ? "Building…" : "Build my Today"}
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toggleTask } from "@/server/actions/tasks";
import { CheckIcon, SparkleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface TaskRow {
  id: string;
  title: string;
  date: string;
  start_at: string | null;
  window_hint: "power" | "neutral" | "friction" | "auto" | null;
  status: "todo" | "done" | "skipped";
  timeLabel: string | null;
}

export function TaskCard({ task, compact = false }: { task: TaskRow; compact?: boolean }) {
  const [done, setDone] = useState(task.status === "done");
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    startTransition(() => toggleTask(task.id, next));
  }

  const hint = task.window_hint;
  return (
    <button
      onClick={toggle}
      className={cn(
        "pressable-soft flex w-full items-start gap-3 rounded-[14px] border p-3.5 text-left transition-colors duration-200",
        done
          ? "border-line-soft bg-selected"
          : hint === "auto"
            ? "border-transparent bg-ink"
            : hint === "power"
              ? "border-[rgba(176,137,71,.3)] bg-[rgba(176,137,71,.13)]"
              : hint === "friction"
                ? "border-[rgba(192,90,59,.3)] bg-[rgba(192,90,59,.11)]"
                : "border-line bg-surface",
        compact && "p-2.5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] transition-colors duration-200",
          done
            ? "border-transparent bg-ink"
            : hint === "auto" && !done
              ? "border-gold-bright"
              : "border-line-check",
        )}
      >
        <CheckIcon
          size={11}
          className={cn(
            "transition-opacity duration-200",
            done ? "text-cream opacity-100" : "opacity-0",
            hint === "auto" && !done && "text-gold-bright",
          )}
        />
      </span>
      <span className="min-w-0">
        {task.timeLabel && (
          <span
            className={cn(
              "tnum block text-[10px] font-bold",
              hint === "auto" && !done ? "text-gold-bright" : "text-faint",
            )}
          >
            {task.timeLabel}
          </span>
        )}
        <span
          className={cn(
            "block text-[12.5px] font-bold leading-snug",
            done
              ? "text-muted line-through"
              : hint === "auto"
                ? "text-cream"
                : hint === "power"
                  ? "text-gold-dark"
                  : hint === "friction"
                    ? "text-clay"
                    : "text-ink-2",
          )}
        >
          {task.title}
          {hint === "auto" && !done && (
            <SparkleIcon size={10} className="ml-1.5 inline text-gold-bright" />
          )}
        </span>
        {hint === "auto" && !done && (
          <span className="mt-0.5 block text-[10px] font-semibold text-[rgba(232,220,196,.62)]">
            ✦ Auto-timed into your power window
          </span>
        )}
      </span>
    </button>
  );
}

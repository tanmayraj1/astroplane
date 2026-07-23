"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/server/actions/tasks";
import { Button } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function NewTaskButton({
  defaultDate,
  variant,
}: {
  defaultDate: string;
  variant: "fab" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [important, setImportant] = useState(false);
  const [busy, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createTask({
        title,
        date,
        time: time || null,
        important,
      });
      setTitle("");
      setTime("");
      setImportant(false);
      setOpen(false);
    });
  }

  return (
    <>
      {variant === "fab" ? (
        <button
          aria-label="New task"
          onClick={() => setOpen(true)}
          className="pressable fixed bottom-[104px] right-5 z-30 flex h-[54px] w-[54px] items-center justify-center rounded-full text-cta-text shadow-[var(--shadow-fab)] lg:hidden"
          style={{ background: "var(--grad-ember)" }}
        >
          <PlusIcon size={22} />
        </button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)} className="hidden lg:inline-flex">
          <PlusIcon size={14} /> New task
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(35,32,58,.45)] p-4 backdrop-blur-[4px] sm:items-center"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="rise w-full max-w-[420px] rounded-[24px] border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
          >
            <div className="eyebrow">New task</div>
            <input
              autoFocus
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pitch to Meridian"
              className="mt-3 w-full rounded-[14px] border border-line bg-surface-alt px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-gold"
            />
            <div className="mt-3 flex gap-3">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-[1.2] rounded-[14px] border border-line bg-surface-alt px-4 py-3 text-[13px] text-ink outline-none focus:border-gold"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  "flex-1 rounded-[14px] border border-line bg-surface-alt px-4 py-3 text-[13px] text-ink outline-none focus:border-gold",
                  important && "opacity-40",
                )}
                disabled={important}
              />
            </div>
            <label className="mt-3.5 flex cursor-pointer items-start gap-2.5 text-[12px] font-semibold text-body">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#B08947]"
              />
              <span>
                This one matters — auto-time it into my power window
                <span className="mt-0.5 block text-[10.5px] font-medium text-faint">
                  We&apos;ll place it in the day&apos;s best sky, if there is one.
                </span>
              </span>
            </label>
            <div className="mt-5 flex gap-3">
              <Button type="submit" disabled={busy || !title} className="flex-1">
                {busy ? "Adding…" : "Add task"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

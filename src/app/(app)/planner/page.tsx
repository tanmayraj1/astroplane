import Link from "next/link";
import { DateTime } from "luxon";
import { requireOnboarded } from "@/server/services/context";
import { getDailySky, todayFor } from "@/server/services/daily";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "@/components/ui";
import { TaskCard, type TaskRow } from "@/components/planner/task-item";
import { NewTaskButton } from "@/components/planner/new-task";
import { cn, compactTime } from "@/lib/utils";
import type { TimeWindow } from "@/lib/astro";

export const metadata = { title: "Planner" };

interface DayData {
  date: string;
  dt: DateTime;
  tasks: TaskRow[];
  windows: TimeWindow[];
}

function fmtBand(w: TimeWindow, tz: string) {
  const f = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" }).setZone(tz).toFormat("h:mm").toLowerCase();
  return `${f(w.startUtc)} – ${f(w.endUtc)}`;
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const ctx = await requireOnboarded();
  const tz = ctx.profile.timezone;
  const today = todayFor(ctx);
  const { day } = await searchParams;

  const todayDt = DateTime.fromISO(today, { zone: tz });
  const weekStart = todayDt.startOf("week"); // Monday
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));
  const selectedDate =
    day && days.some((d) => d.toISODate() === day) ? day : today;

  const supabase = await createClient();
  const { data: taskRows } = await supabase
    .from("tasks")
    .select("id, title, date, start_at, window_hint, status")
    .eq("user_id", ctx.userId)
    .gte("date", weekStart.toISODate()!)
    .lte("date", weekStart.plus({ days: 6 }).toISODate()!)
    .order("start_at", { ascending: true, nullsFirst: false });

  const dayData: DayData[] = await Promise.all(
    days.map(async (dt) => {
      const date = dt.toISODate()!;
      const sky = await getDailySky(date, ctx);
      const tasks: TaskRow[] = (taskRows ?? [])
        .filter((t) => t.date === date)
        .map((t) => ({
          ...t,
          timeLabel: t.start_at ? compactTime(t.start_at, tz) : null,
        }));
      return { date, dt, tasks, windows: sky.windows };
    }),
  );

  const selected = dayData.find((d) => d.date === selectedDate)!;
  const selectedSky = await getDailySky(selectedDate, ctx);

  // Mobile timeline: merge tasks + window bands, sorted by time
  type TimelineItem =
    | { kind: "band"; window: TimeWindow; at: number }
    | { kind: "task"; task: TaskRow; at: number };
  const timeline: TimelineItem[] = [
    ...selected.windows.map((w) => ({
      kind: "band" as const,
      window: w,
      at: Date.parse(w.startUtc),
    })),
    ...selected.tasks.map((t) => ({
      kind: "task" as const,
      task: t,
      at: t.start_at ? Date.parse(t.start_at) : Number.MAX_SAFE_INTEGER - 1,
    })),
  ].sort((a, b) => a.at - b.at);

  return (
    <div className="px-5 pt-[52px] sm:px-8 lg:px-9 lg:pt-8">
      <header className="rise flex items-end justify-between gap-4">
        <div>
          <Eyebrow>
            {selectedDate === today ? "Your plan" : "Week of"}{" "}
            {weekStart.toFormat("LLLL d").toUpperCase()}
          </Eyebrow>
          <h1 className="mt-1.5 font-display text-[28px] font-bold text-ink lg:text-[34px]">
            <span className="hidden lg:inline">A week, timed to the sky</span>
            <span className="lg:hidden">
              {DateTime.fromISO(selectedDate, { zone: tz }).toFormat("cccc")}, timed
              to the sky
            </span>
          </h1>
          <p className="mt-1 text-[12.5px] text-muted lg:hidden">
            {DateTime.fromISO(selectedDate, { zone: tz }).toFormat("LLLL d")} ·{" "}
            {selectedSky.moon.phaseName} in {selectedSky.moon.sign}
          </p>
        </div>
        <NewTaskButton defaultDate={selectedDate} variant="button" />
      </header>

      {/* ── Mobile day selector ── */}
      <div className="rise d1 mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {days.map((dt) => {
          const date = dt.toISODate()!;
          const active = date === selectedDate;
          return (
            <Link
              key={date}
              href={`/planner?day=${date}`}
              className={cn(
                "pressable flex min-w-[52px] flex-col items-center rounded-[16px] border px-3 py-2.5",
                active
                  ? "border-transparent bg-ink text-cream"
                  : "border-line bg-surface text-body",
              )}
            >
              <span className="text-[9px] font-bold uppercase tracking-[1px] opacity-70">
                {dt.toFormat("ccc")}
              </span>
              <span className="tnum font-display text-[16px] font-bold">
                {dt.day}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Mobile timeline ── */}
      <div className="mt-4 flex flex-col gap-2.5 pb-16 lg:hidden">
        {timeline.length === 0 && (
          <div className="rise d2 rounded-[18px] border border-line bg-surface p-6 text-center">
            <p className="text-[13px] font-semibold text-muted">
              Nothing planned — a clean page.
            </p>
            <p className="mt-1 text-[11.5px] text-faint">
              Add a task and we&apos;ll time it to the sky.
            </p>
          </div>
        )}
        {timeline.map((item, i) =>
          item.kind === "band" ? (
            <div
              key={`band-${i}`}
              className={cn(
                `rise d${Math.min(i + 2, 12)}`,
                "rounded-[12px] px-4 py-2 text-[10px] font-bold uppercase tracking-[1.5px]",
                item.window.kind === "power"
                  ? "bg-[rgba(176,137,71,.13)] text-gold-dark"
                  : "bg-[rgba(192,90,59,.11)] text-clay",
              )}
            >
              {item.window.kind === "power" ? "Power window" : "Friction"} ·{" "}
              {fmtBand(item.window, tz)}
              {item.window.kind === "friction" && " — hold decisions"}
            </div>
          ) : (
            <div key={item.task.id} className={`rise d${Math.min(i + 2, 12)}`}>
              <TaskCard task={item.task} />
            </div>
          ),
        )}
      </div>

      {/* ── Desktop week grid ── */}
      <div className="mt-6 hidden gap-3 pb-12 lg:grid lg:grid-cols-7">
        {dayData.map((d, i) => {
          const isToday = d.date === today;
          return (
            <div
              key={d.date}
              className={cn(
                `rise d${i + 1}`,
                "flex min-h-[420px] flex-col rounded-[20px] border p-3",
                isToday
                  ? "border-gold-muted bg-surface"
                  : "border-line-soft bg-[rgba(252,248,240,.5)]",
              )}
            >
              <div
                className={cn(
                  "mb-3 text-center",
                  isToday ? "text-ink" : "text-muted",
                )}
              >
                <div className="text-[9px] font-bold uppercase tracking-[1.5px]">
                  {d.dt.toFormat("ccc")}
                </div>
                <div className="tnum font-display text-[18px] font-bold">
                  {d.dt.day}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {d.windows.map((w, wi) => (
                  <div
                    key={wi}
                    className={cn(
                      "rounded-[10px] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.8px]",
                      w.kind === "power"
                        ? "bg-[rgba(176,137,71,.13)] text-gold-dark"
                        : "bg-[rgba(192,90,59,.11)] text-clay",
                    )}
                  >
                    {w.kind === "power" ? "Power" : "Friction"} · {fmtBand(w, tz)}
                  </div>
                ))}
                {d.tasks.map((t) => (
                  <TaskCard key={t.id} task={t} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend (desktop) */}
      <div className="mb-10 hidden items-center gap-5 text-[10.5px] font-bold text-muted lg:flex">
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-[3px] bg-[rgba(176,137,71,.35)]" />
          Power window
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-[3px] bg-[rgba(192,90,59,.3)]" />
          Friction — hold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-[3px] bg-ink" />
          Auto-timed task ✦
        </span>
      </div>

      <NewTaskButton defaultDate={selectedDate} variant="fab" />
    </div>
  );
}

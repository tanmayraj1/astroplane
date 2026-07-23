"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/server/services/context";
import { getDailySky } from "@/server/services/daily";
import { awardKarma } from "@/server/services/karma";
import { DateTime } from "luxon";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  important: z.boolean().optional(),
});

/**
 * Create a task. If marked important with no time, auto-time it into
 * today's power window ("Auto-timed into your power window ✦").
 */
export async function createTask(input: z.infer<typeof createSchema>) {
  const parsed = createSchema.parse(input);
  const ctx = await getAppContext();
  const supabase = await createClient();

  let startAt: string | null = null;
  let windowHint: "power" | "neutral" | "friction" | "auto" = "neutral";

  if (parsed.time) {
    const local = DateTime.fromISO(`${parsed.date}T${parsed.time}`, {
      zone: ctx.profile.timezone,
    });
    startAt = local.toUTC().toISO();
    // annotate against the day's windows
    const sky = await getDailySky(parsed.date, ctx);
    const t = local.toUTC().toMillis();
    for (const w of sky.windows) {
      if (t >= Date.parse(w.startUtc) && t < Date.parse(w.endUtc)) {
        windowHint = w.kind;
      }
    }
  } else if (parsed.important) {
    const sky = await getDailySky(parsed.date, ctx);
    const power = sky.windows.find((w) => w.kind === "power");
    if (power) {
      startAt = power.startUtc;
      windowHint = "auto";
    }
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: ctx.userId,
    title: parsed.title,
    date: parsed.date,
    start_at: startAt,
    window_hint: windowHint,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/planner");
  revalidatePath("/today");
}

export async function toggleTask(taskId: string, done: boolean) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  if (done) {
    await awardKarma(ctx.userId, "task_done", taskId, ctx.profile.timezone);
  }
  revalidatePath("/planner");
  revalidatePath("/today");
}

export async function deleteTask(taskId: string) {
  const ctx = await getAppContext();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", ctx.userId);
  revalidatePath("/planner");
}

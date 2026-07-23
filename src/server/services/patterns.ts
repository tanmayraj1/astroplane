import "server-only";
import { DateTime } from "luxon";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppContext } from "./context";

export interface PatternInsight {
  stat: string; // e.g. "+18%"
  text: string;
  barA: number; // 0–1 relative bar heights for the twin mini chart
  barB: number;
  n: number;
}

export interface PatternsData {
  streak: number;
  heat: boolean[]; // last 7 days check-in presence, oldest first
  insights: PatternInsight[];
  totalCheckins: number;
}

/**
 * Transparent, explainable statistics from the user's own logs.
 * Insights surface only at minimum sample size — correlation, never fate.
 */
export async function computePatterns(ctx: AppContext): Promise<PatternsData> {
  const admin = createAdminClient();
  const tz = ctx.profile.timezone;
  const today = DateTime.now().setZone(tz);

  const [moodsRes, cardsRes, tasksRes] = await Promise.all([
    admin
      .from("mood_checkins")
      .select("date, mood, energy")
      .eq("user_id", ctx.userId)
      .order("date", { ascending: false })
      .limit(90),
    admin
      .from("daily_cards")
      .select("date, content")
      .eq("user_id", ctx.userId)
      .order("date", { ascending: false })
      .limit(90),
    admin
      .from("tasks")
      .select("date, status, window_hint")
      .eq("user_id", ctx.userId)
      .limit(300),
  ]);

  const moods = moodsRes.data ?? [];
  const cards = cardsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  // last-7-day heatmap
  const moodDates = new Set(moods.map((m) => m.date));
  const heat = Array.from({ length: 7 }, (_, i) =>
    moodDates.has(today.minus({ days: 6 - i }).toISODate()!),
  );

  const insights: PatternInsight[] = [];

  // ── Insight 1: task completion, sky-timed vs not ──
  const timed = tasks.filter((t) => t.window_hint === "power" || t.window_hint === "auto");
  const other = tasks.filter((t) => t.window_hint === "neutral" || t.window_hint === "friction");
  if (timed.length >= 5 && other.length >= 5) {
    const rate = (arr: typeof tasks) =>
      arr.filter((t) => t.status === "done").length / arr.length;
    const rTimed = rate(timed);
    const rOther = rate(other);
    if (rOther > 0) {
      const delta = Math.round(((rTimed - rOther) / rOther) * 100);
      if (Math.abs(delta) >= 5) {
        insights.push({
          stat: `${delta > 0 ? "+" : ""}${delta}%`,
          text: `task completion when you time tasks into power windows (${timed.length} timed vs ${other.length} untimed tasks)`,
          barA: Math.min(rOther, 1),
          barB: Math.min(rTimed, 1),
          n: timed.length + other.length,
        });
      }
    }
  }

  // ── Insight 2: mood by moon sign (from your own logged days) ──
  const moonByDate = new Map<string, string>();
  for (const c of cards) {
    const sign = (c.content as { moonSign?: string })?.moonSign;
    if (sign) moonByDate.set(c.date, sign);
  }
  const bySign = new Map<string, number[]>();
  for (const m of moods) {
    const sign = moonByDate.get(m.date);
    if (!sign) continue;
    if (!bySign.has(sign)) bySign.set(sign, []);
    bySign.get(sign)!.push(m.mood);
  }
  const signAverages = [...bySign.entries()]
    .filter(([, arr]) => arr.length >= 3)
    .map(([sign, arr]) => ({
      sign,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
      n: arr.length,
    }))
    .sort((a, b) => b.avg - a.avg);
  if (signAverages.length >= 2) {
    const hi = signAverages[0];
    const lo = signAverages[signAverages.length - 1];
    if (hi.avg - lo.avg >= 0.5) {
      insights.push({
        stat: `Moon in ${hi.sign}`,
        text: `your energy runs highest with the Moon in ${hi.sign} (avg ${hi.avg.toFixed(1)}/5 over ${hi.n} days) and dips with Moon in ${lo.sign} (${lo.avg.toFixed(1)}/5)`,
        barA: lo.avg / 5,
        barB: hi.avg / 5,
        n: hi.n + lo.n,
      });
    }
  }

  return {
    streak: ctx.streak.current,
    heat,
    insights,
    totalCheckins: moods.length,
  };
}

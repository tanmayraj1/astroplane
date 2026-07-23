import "server-only";
import { z } from "zod";
import { DateTime } from "luxon";
import { aiConfigured, openai, DEFAULT_MODEL, TOKEN_CAPS } from "./openai";
import { chartSummaryForAI } from "@/lib/astro";
import type { DailySky, NatalChart } from "@/lib/astro";

export const dailyCardSchema = z.object({
  headline: z.string().max(90),
  body: z.string().max(600),
  color_blurb: z.string().max(140),
  power_blurb: z.string().max(160).nullable(),
  friction_blurb: z.string().max(160).nullable(),
  nudges: z.array(z.string().max(180)).min(1).max(3),
});
export type DailyCardText = z.infer<typeof dailyCardSchema>;

export interface DailyCardContent extends DailyCardText {
  date: string;
  moonPhase: string;
  moonSign: string;
  wake: { start: string; end: string } | null;
  windDown: string | null;
  color: { name: string; css: string; planet: string };
  windows: DailySky["windows"];
  generatedBy: "ai" | "rules";
}

function fmtWindow(w: DailySky["windows"][number], tz: string): string {
  const f = (iso: string) =>
    DateTime.fromISO(iso, { zone: "utc" }).setZone(tz).toFormat("h:mma").toLowerCase();
  return `${f(w.startUtc)}–${f(w.endUtc)}`;
}

/** Deterministic fallback copy — used when OPENAI_API_KEY is absent or the call fails. */
function rulesBasedCard(sky: DailySky, chart: NatalChart | null): DailyCardText {
  const moon = sky.moon;
  const headline =
    moon.phaseName === "New Moon"
      ? `A clean page — set one intention before noon.`
      : moon.phaseName === "Full Moon"
        ? `Everything surfaces — let the ${moon.sign} full moon show you what's ripe.`
        : `${moon.phaseName} in ${moon.sign} — steady as she moves.`;
  const power = sky.windows.find((w) => w.kind === "power");
  const friction = sky.windows.find((w) => w.kind === "friction");
  const nudges: string[] = [];
  const t0 = sky.transitsToNatal[0];
  if (t0) {
    const harmonious = t0.type === "trine" || t0.type === "sextile";
    nudges.push(
      harmonious
        ? `${t0.transiting} ${t0.type}s your natal ${t0.natal} — a green light for the thing you've been drafting.`
        : `${t0.transiting} ${t0.type}s your natal ${t0.natal} — give the hard conversation until tomorrow.`,
    );
  }
  if (moon.voidOfCourse) {
    nudges.push(
      "The Moon runs void-of-course part of today — hold signatures and launches, tend what already exists.",
    );
  }
  if (nudges.length === 0) {
    nudges.push("A quiet sky today — momentum comes from routine, not force.");
  }
  return {
    headline,
    body: `The ${moon.phaseName.toLowerCase()} sits in ${moon.sign} today${
      chart ? `, moving through your sky` : ""
    }. ${sky.dayRuler}'s day carries a ${sky.colorOfDay.name.toLowerCase()} tone — plan the important asks inside your power window and keep the edges of the day soft.`,
    color_blurb: `${sky.colorOfDay.name} — ${sky.dayRuler}'s day.`,
    power_blurb: power ? "Start things. Ask. Send." : null,
    friction_blurb: friction ? "Hold signatures and launches." : null,
    nudges: nudges.slice(0, 3),
  };
}

/**
 * Generate the daily card text. AI phrases; the engine's times/colors pass through.
 * Falls back to deterministic copy on any failure — the planner never breaks.
 */
export async function generateDailyCard(opts: {
  sky: DailySky;
  chart: NatalChart | null;
  displayName: string | null;
  focusAreas: string[];
  recentMoodAvg: number | null;
}): Promise<{
  content: DailyCardContent;
  model: string | null;
  usage: { prompt: number; completion: number } | null;
}> {
  const { sky, chart } = opts;

  const finish = (
    text: DailyCardText,
    generatedBy: "ai" | "rules",
    model: string | null,
    usage: { prompt: number; completion: number } | null,
  ) => ({
    content: {
      ...text,
      date: sky.date,
      moonPhase: sky.moon.phaseName,
      moonSign: sky.moon.sign,
      wake: sky.wake,
      windDown: sky.windDown,
      color: sky.colorOfDay,
      windows: sky.windows,
      generatedBy,
    },
    model,
    usage,
  });

  if (!aiConfigured()) {
    return finish(rulesBasedCard(sky, chart), "rules", null, null);
  }

  try {
    const powerW = sky.windows.find((w) => w.kind === "power");
    const frictionW = sky.windows.find((w) => w.kind === "friction");
    const skyBrief = {
      date: sky.date,
      moon: `${sky.moon.phaseName} in ${sky.moon.sign}`,
      voidOfCourse: sky.moon.voidOfCourse
        ? `${fmtWindow({ kind: "friction", startUtc: sky.moon.voidOfCourse.startUtc, endUtc: sky.moon.voidOfCourse.endUtc, score: 0, reasons: [] }, sky.tz)} (then Moon enters ${sky.moon.voidOfCourse.ingressSign})`
        : null,
      dayRuler: sky.dayRuler,
      colorOfDay: sky.colorOfDay.name,
      powerWindow: powerW
        ? { time: fmtWindow(powerW, sky.tz), reasons: powerW.reasons }
        : null,
      frictionWindow: frictionW
        ? { time: fmtWindow(frictionW, sky.tz), reasons: frictionW.reasons }
        : null,
      keyTransits: sky.transitsToNatal
        .slice(0, 4)
        .map(
          (t) =>
            `transiting ${t.transiting} ${t.type} natal ${t.natal} (orb ${t.orb}°${t.applying ? ", applying" : ""})`,
        ),
    };

    const completion = await openai().chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: TOKEN_CAPS.dailyCard,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are AI Planner for Astroplane, a daily planner grounded in real astrology. You write the user's daily card. Voice: warm, specific, literary-but-practical — like the Co-Star tone with more usefulness and zero doom. Never invent astronomy: every claim must trace to the provided sky data. Never give medical, legal, or financial advice. Frame everything as guidance, not fate.

Return JSON with exactly these keys:
- "headline": one evocative line for the day (max 12 words, no emoji)
- "body": 2-3 sentences tying the moon, transits and windows to how to shape the day
- "color_blurb": one short line about the color of the day and its planet
- "power_blurb": imperative micro-copy for the power window (max 10 words) or null if none
- "friction_blurb": imperative micro-copy for the friction window (max 10 words) or null if none
- "nudges": array of 2-3 specific, actionable micro-nudges, each grounded in a listed transit or window (e.g. "Mercury trines your Sun — send the email you've been drafting.")`,
        },
        {
          role: "user",
          content: JSON.stringify({
            natalChart: chart ? chartSummaryForAI(chart) : "not provided (no birth data yet)",
            sky: skyBrief,
            focusAreas: opts.focusAreas,
            recentMoodAvg: opts.recentMoodAvg,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const text = dailyCardSchema.parse(JSON.parse(raw));
    return finish(text, "ai", completion.model, {
      prompt: completion.usage?.prompt_tokens ?? 0,
      completion: completion.usage?.completion_tokens ?? 0,
    });
  } catch {
    return finish(rulesBasedCard(sky, chart), "rules", null, null);
  }
}

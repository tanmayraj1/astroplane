import { DateTime } from "luxon";
import { moonAspectsInInterval } from "./transits";
import type {
  NatalChart,
  Planet,
  PlanetaryHour,
  TimeWindow,
  VoidOfCourse,
} from "./types";

const BENEFICS: Planet[] = ["Jupiter", "Venus"];
const MALEFICS: Planet[] = ["Mars", "Saturn"];

export type Chronotype = "lark" | "early" | "mid" | "owl";

/**
 * Deterministic hour scoring. The AI phrases these; it never invents timing.
 * Reason codes are machine-readable strings the prompt layer translates.
 */
export function computeWindows(
  hours: PlanetaryHour[],
  voc: VoidOfCourse | null,
  chart: NatalChart | null,
): TimeWindow[] {
  const scored = hours.map((h) => {
    let score = 0;
    const reasons: string[] = [];

    if (BENEFICS.includes(h.ruler)) {
      score += 2;
      reasons.push(`hour_ruler_benefic:${h.ruler}`);
    } else if (MALEFICS.includes(h.ruler)) {
      score -= 1;
      reasons.push(`hour_ruler_malefic:${h.ruler}`);
    } else {
      score += 1;
      reasons.push(`hour_ruler_neutral:${h.ruler}`);
    }

    if (chart && h.ruler === chart.chartRuler) {
      score += 1;
      reasons.push(`hour_ruler_is_chart_ruler:${h.ruler}`);
    }

    const s = new Date(h.startUtc);
    const e = new Date(h.endUtc);

    if (voc) {
      const vs = Date.parse(voc.startUtc);
      const ve = Date.parse(voc.endUtc);
      if (s.getTime() < ve && e.getTime() > vs) {
        score -= 3;
        reasons.push("moon_void_of_course");
      }
    }

    if (chart) {
      const points = [
        chart.bodies.find((b) => b.body === "Sun")!,
        chart.bodies.find((b) => b.body === "Moon")!,
        ...(chart.ascendant ? [chart.ascendant] : []),
      ];
      for (const pt of points) {
        const asp = moonAspectsInInterval(s, e, pt.lon);
        if (asp?.harmonious) {
          score += 2;
          reasons.push(`moon_${asp.type}_natal_${pt.body}`);
        } else if (asp && !asp.harmonious) {
          score -= 2;
          reasons.push(`moon_${asp.type}_natal_${pt.body}`);
        }
      }
    }

    return { hour: h, score, reasons };
  });

  // find best contiguous positive run and worst contiguous negative run
  // within waking hours (index 0–15 ≈ sunrise → mid-evening)
  const waking = scored.filter((s) => s.hour.index <= 15);

  const windows: TimeWindow[] = [];
  const bestRun = bestContiguous(waking, (x) => x.score, true);
  if (bestRun.length > 0 && bestRun[0].score > 0) {
    windows.push(mergeRun(bestRun, "power"));
  }
  const worstRun = bestContiguous(
    waking.filter((w) => !bestRun.includes(w)),
    (x) => -x.score,
    true,
  );
  if (worstRun.length > 0 && worstRun[0].score < 0) {
    windows.push(mergeRun(worstRun, "friction"));
  }
  return windows;
}

function bestContiguous<T>(
  arr: T[],
  val: (t: T) => number,
  positiveOnly: boolean,
): T[] {
  let best: T[] = [];
  let bestSum = 0;
  let cur: T[] = [];
  let curSum = 0;
  for (const item of arr) {
    const v = val(item);
    if (v > 0) {
      cur.push(item);
      curSum += v;
      if (curSum > bestSum) {
        best = [...cur];
        bestSum = curSum;
      }
    } else if (positiveOnly) {
      cur = [];
      curSum = 0;
    }
  }
  // cap window length at 3 hours-slots for usefulness
  if (best.length > 3) {
    best = best.slice(0, 3);
  }
  return best;
}

function mergeRun(
  run: { hour: PlanetaryHour; score: number; reasons: string[] }[],
  kind: TimeWindow["kind"],
): TimeWindow {
  const reasons = [...new Set(run.flatMap((r) => r.reasons))].filter((r) =>
    kind === "power"
      ? !r.startsWith("hour_ruler_malefic") && r !== "moon_void_of_course"
      : r.startsWith("hour_ruler_malefic") ||
        r === "moon_void_of_course" ||
        r.includes("square") ||
        r.includes("opposition"),
  );
  return {
    kind,
    startUtc: run[0].hour.startUtc,
    endUtc: run[run.length - 1].hour.endUtc,
    score: run.reduce((a, b) => a + b.score, 0),
    reasons,
  };
}

/** Chronotype-based wake / wind-down suggestions (local HH:mm). */
export function sleepWindows(
  chronotype: Chronotype | null,
  tz: string,
  emotionallyIntense: boolean,
): { wake: { start: string; end: string }; windDown: string } {
  const base: Record<Chronotype, { wakeStart: number; wakeEnd: number; down: number }> = {
    lark: { wakeStart: 5.5, wakeEnd: 6.25, down: 21.5 },
    early: { wakeStart: 6.66, wakeEnd: 7.33, down: 22.5 },
    mid: { wakeStart: 7.5, wakeEnd: 8.25, down: 23 },
    owl: { wakeStart: 8.5, wakeEnd: 9.5, down: 23.75 },
  };
  const b = base[chronotype ?? "early"];
  // On emotionally intense lunar days, nudge wind-down 30 min earlier — always a suggestion
  const down = emotionallyIntense ? b.down - 0.5 : b.down;
  const fmt = (h: number) => {
    const dt = DateTime.fromObject(
      { hour: Math.floor(h), minute: Math.round((h % 1) * 60) },
      { zone: tz },
    );
    return dt.toFormat("HH:mm");
  };
  return {
    wake: { start: fmt(b.wakeStart), end: fmt(b.wakeEnd) },
    windDown: fmt(down),
  };
}

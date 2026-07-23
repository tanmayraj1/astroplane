import { DateTime } from "luxon";
import { planetaryHours, DAY_COLORS } from "./hours";
import { moonState } from "./moon";
import { currentPositions, transitsToNatal } from "./transits";
import { computeWindows, sleepWindows, type Chronotype } from "./windows";
import type { DailySky, MoonState, NatalChart, Planet, PlanetaryHour } from "./types";

export * from "./types";
export { computeNatalChart, chartSummaryForAI, type BirthInput } from "./natal";
export { DAY_COLORS } from "./hours";
export { sleepWindows, type Chronotype } from "./windows";
export { transitsToNatal, currentPositions } from "./transits";

/**
 * Location-shared portion of the sky (cacheable per date+tz+lat/lng bucket).
 * The expensive computation is the void-of-course scan inside moonState.
 */
export interface SkyBase {
  date: string;
  tz: string;
  dayRuler: Planet;
  sunriseUtc: string | null;
  sunsetUtc: string | null;
  planetaryHours: PlanetaryHour[];
  moon: MoonState;
  positions: DailySky["positions"];
}

export function computeSkyBase(opts: {
  dateLocal: string;
  tz: string;
  lat: number;
  lng: number;
}): SkyBase {
  const { dateLocal, tz, lat, lng } = opts;
  const dayStart = DateTime.fromISO(dateLocal, { zone: tz }).startOf("day");
  const dayEnd = dayStart.endOf("day");
  const noon = dayStart.plus({ hours: 12 }).toJSDate();

  const { hours, dayRuler, sun } = planetaryHours(dateLocal, tz, lat, lng);
  const moon = moonState(noon, dayStart.toJSDate(), dayEnd.toJSDate());
  const positions = currentPositions(noon).map((p) => ({
    body: p.body,
    lon: +p.lon.toFixed(3),
    sign: p.sign,
    degree: +p.degree.toFixed(2),
    retrograde: p.retrograde,
  }));

  return {
    date: dateLocal,
    tz,
    dayRuler,
    sunriseUtc: sun.sunrise?.toISOString() ?? null,
    sunsetUtc: sun.sunset?.toISOString() ?? null,
    planetaryHours: hours,
    moon,
    positions,
  };
}

/** Cheap per-user personalization layered onto a (possibly cached) SkyBase. */
export function personalizeSky(
  base: SkyBase,
  chart: NatalChart | null,
  chronotype: Chronotype | null,
): DailySky {
  const noon = DateTime.fromISO(base.date, { zone: base.tz })
    .startOf("day")
    .plus({ hours: 12 })
    .toJSDate();

  const transits = chart ? transitsToNatal(noon, chart) : [];
  const windows = computeWindows(base.planetaryHours, base.moon.voidOfCourse, chart);

  const intense =
    base.moon.phaseName === "Full Moon" ||
    transits.some(
      (t) =>
        t.transiting === "Moon" &&
        t.natal === "Moon" &&
        (t.type === "square" || t.type === "opposition"),
    );
  const sleep = sleepWindows(chronotype, base.tz, intense);
  const color = DAY_COLORS[base.dayRuler];

  return {
    ...base,
    colorOfDay: { name: color.name, css: color.css, planet: base.dayRuler },
    transitsToNatal: transits,
    windows,
    wake: sleep.wake,
    windDown: sleep.windDown,
  };
}

/** One-shot compute (no cache) — used by scripts/tests. */
export function computeDailySky(opts: {
  dateLocal: string;
  tz: string;
  lat: number;
  lng: number;
  chart: NatalChart | null;
  chronotype: Chronotype | null;
}): DailySky {
  const base = computeSkyBase(opts);
  return personalizeSky(base, opts.chart, opts.chronotype);
}

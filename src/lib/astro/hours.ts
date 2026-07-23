import { Body, Observer, SearchRiseSet, MakeTime } from "astronomy-engine";
import { DateTime } from "luxon";
import type { Planet, PlanetaryHour } from "./types";

/** Chaldean order (slowest → fastest) */
const CHALDEAN: Planet[] = [
  "Saturn",
  "Jupiter",
  "Mars",
  "Sun",
  "Venus",
  "Mercury",
  "Moon",
];

/** Day rulers by weekday, Sunday = 0 */
export const DAY_RULERS: Planet[] = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

export const DAY_COLORS: Record<
  string,
  { name: string; css: string }
> = {
  Sun: { name: "Royal Amber", css: "linear-gradient(130deg,#E2A63D,#C97B2A)" },
  Moon: { name: "Moonlit Silver", css: "linear-gradient(130deg,#E9E4D8,#B9B4A6)" },
  Mars: { name: "Ember Red", css: "linear-gradient(130deg,#D6472F,#A33322)" },
  Mercury: { name: "Sage Green", css: "linear-gradient(130deg,#8FA876,#5F8D5A)" },
  Jupiter: { name: "Temple Gold", css: "linear-gradient(130deg,#C9A15E,#B08947)" },
  Venus: { name: "Rose Clay", css: "linear-gradient(130deg,#DB8C74,#C05A3B)" },
  Saturn: { name: "Deep Indigo", css: "linear-gradient(130deg,#3A3550,#23203A)" },
};

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  nextSunrise: Date | null;
}

export function sunTimes(localDayStart: Date, lat: number, lng: number): SunTimes {
  const obs = new Observer(lat, lng, 0);
  const rise = SearchRiseSet(Body.Sun, obs, +1, MakeTime(localDayStart), 1.2);
  const set = rise
    ? SearchRiseSet(Body.Sun, obs, -1, rise, 1.2)
    : SearchRiseSet(Body.Sun, obs, -1, MakeTime(localDayStart), 1.2);
  const nextRise = set ? SearchRiseSet(Body.Sun, obs, +1, set, 1.2) : null;
  return {
    sunrise: rise ? rise.date : null,
    sunset: set ? set.date : null,
    nextSunrise: nextRise ? nextRise.date : null,
  };
}

/**
 * 24 unequal planetary hours for a local day:
 * 12 from sunrise→sunset, 12 from sunset→next sunrise.
 * First hour ruled by the day ruler, then Chaldean sequence.
 */
export function planetaryHours(
  dateLocal: string,
  tz: string,
  lat: number,
  lng: number,
): { hours: PlanetaryHour[]; dayRuler: Planet; sun: SunTimes } {
  const dayStart = DateTime.fromISO(dateLocal, { zone: tz }).startOf("day");
  const sun = sunTimes(dayStart.toJSDate(), lat, lng);
  const weekday = dayStart.weekday % 7; // luxon: Mon=1..Sun=7 → Sun=0
  const dayRuler = DAY_RULERS[weekday];

  const hours: PlanetaryHour[] = [];
  if (!sun.sunrise || !sun.sunset || !sun.nextSunrise) {
    // Polar edge case: fall back to equal hours from midnight
    const startIdx = CHALDEAN.indexOf(dayRuler);
    for (let i = 0; i < 24; i++) {
      const s = dayStart.plus({ hours: i });
      hours.push({
        index: i,
        ruler: CHALDEAN[(startIdx + i) % 7],
        startUtc: s.toUTC().toISO()!,
        endUtc: s.plus({ hours: 1 }).toUTC().toISO()!,
        isDay: i >= 6 && i < 18,
      });
    }
    return { hours, dayRuler, sun };
  }

  const dayLen = (sun.sunset.getTime() - sun.sunrise.getTime()) / 12;
  const nightLen = (sun.nextSunrise.getTime() - sun.sunset.getTime()) / 12;
  const startIdx = CHALDEAN.indexOf(dayRuler);

  for (let i = 0; i < 12; i++) {
    const s = sun.sunrise.getTime() + i * dayLen;
    hours.push({
      index: i,
      ruler: CHALDEAN[(startIdx + i) % 7],
      startUtc: new Date(s).toISOString(),
      endUtc: new Date(s + dayLen).toISOString(),
      isDay: true,
    });
  }
  for (let i = 0; i < 12; i++) {
    const s = sun.sunset.getTime() + i * nightLen;
    hours.push({
      index: 12 + i,
      ruler: CHALDEAN[(startIdx + 12 + i) % 7],
      startUtc: new Date(s).toISOString(),
      endUtc: new Date(s + nightLen).toISOString(),
      isDay: false,
    });
  }
  return { hours, dayRuler, sun };
}

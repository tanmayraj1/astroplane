import { eclipticLongitude, isRetrograde } from "./ephemeris";
import { aspectBetween } from "./aspects";
import {
  PLANETS,
  sep,
  signOf,
  type NatalChart,
  type Planet,
  type TransitAspect,
} from "./types";

const HOUR = 3600 * 1000;
const TRANSIT_ORB = 3;

export function currentPositions(date: Date) {
  return PLANETS.map((p) => {
    const lon = eclipticLongitude(p, date);
    return {
      body: p,
      lon,
      sign: signOf(lon),
      degree: lon % 30,
      retrograde: isRetrograde(p, date),
    };
  });
}

/** Transiting planets aspecting natal points (Sun, Moon, personal planets, ASC). */
export function transitsToNatal(date: Date, chart: NatalChart): TransitAspect[] {
  const natalPoints = [
    ...chart.bodies.filter((b) => b.body !== "NorthNode"),
    ...(chart.ascendant ? [chart.ascendant] : []),
  ];
  const out: TransitAspect[] = [];
  const later = new Date(date.getTime() + HOUR);

  for (const p of PLANETS) {
    const lonNow = eclipticLongitude(p, date);
    const lonLater = eclipticLongitude(p, later);
    for (const n of natalPoints) {
      // skip a transit of a planet to its own natal position unless conj (returns)
      const asp = aspectBetween(lonNow, n.lon, TRANSIT_ORB);
      if (!asp) continue;
      const orbNow = Math.abs(sep(lonNow, n.lon) - angleOf(asp.type));
      const orbLater = Math.abs(sep(lonLater, n.lon) - angleOf(asp.type));
      out.push({
        transiting: p,
        natal: n.body,
        type: asp.type,
        orb: asp.orb,
        applying: orbLater < orbNow,
      });
    }
  }
  // tightest first, cap for signal
  return out.sort((a, b) => a.orb - b.orb).slice(0, 10);
}

function angleOf(type: TransitAspect["type"]): number {
  switch (type) {
    case "conjunction":
      return 0;
    case "sextile":
      return 60;
    case "square":
      return 90;
    case "trine":
      return 120;
    case "opposition":
      return 180;
  }
}

/** Moon's applying aspects to a natal point over a given interval (for window scoring). */
export function moonAspectsInInterval(
  start: Date,
  end: Date,
  natalLon: number,
): { type: TransitAspect["type"]; harmonious: boolean } | null {
  const mid = new Date((start.getTime() + end.getTime()) / 2);
  const lon = eclipticLongitude("Moon", mid);
  const asp = aspectBetween(lon, natalLon, 4);
  if (!asp) return null;
  const harmonious = asp.type === "trine" || asp.type === "sextile";
  const hard = asp.type === "square" || asp.type === "opposition";
  if (!harmonious && !hard) return null;
  return { type: asp.type, harmonious };
}

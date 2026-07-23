import { MoonPhase, Illumination, Body, MakeTime } from "astronomy-engine";
import { eclipticLongitude } from "./ephemeris";
import {
  CLASSICAL,
  ASPECTS,
  sep,
  signOf,
  type MoonState,
  type VoidOfCourse,
  type Sign,
} from "./types";

const MIN = 60 * 1000;

function phaseName(angle: number): MoonState["phaseName"] {
  if (angle < 22.5 || angle >= 337.5) return "New Moon";
  if (angle < 67.5) return "Waxing Crescent";
  if (angle < 112.5) return "First Quarter";
  if (angle < 157.5) return "Waxing Gibbous";
  if (angle < 202.5) return "Full Moon";
  if (angle < 247.5) return "Waning Gibbous";
  if (angle < 292.5) return "Last Quarter";
  return "Waning Crescent";
}

/** Next moment the Moon changes sign after `from` (10-min scan + bisection). */
export function nextMoonIngress(from: Date): { time: Date; sign: Sign } {
  const startLon = eclipticLongitude("Moon", from);
  const startSignIdx = Math.floor(startLon / 30);
  let lo = from.getTime();
  let hi = lo;
  // Moon moves ~13°/day → sign change within ~2.7 days max
  for (let t = lo + 10 * MIN; t <= lo + 4 * 86400000; t += 10 * MIN) {
    const idx = Math.floor(eclipticLongitude("Moon", new Date(t)) / 30);
    if (idx !== startSignIdx) {
      hi = t;
      lo = t - 10 * MIN;
      break;
    }
  }
  // bisect to the minute
  while (hi - lo > MIN) {
    const mid = (lo + hi) / 2;
    const idx = Math.floor(eclipticLongitude("Moon", new Date(mid)) / 30);
    if (idx === startSignIdx) lo = mid;
    else hi = mid;
  }
  const time = new Date(hi);
  return { time, sign: signOf(eclipticLongitude("Moon", time)) };
}

/**
 * Void-of-course interval containing/preceding the next ingress after `ref`:
 * [last exact major aspect Moon→classical planet before ingress, ingress].
 * Scans 15-min steps backward from ingress, refines by bisection.
 */
export function voidOfCourseAround(ref: Date): VoidOfCourse {
  const ingress = nextMoonIngress(ref);
  const ingressT = ingress.time.getTime();

  // f(t) per (planet, aspect) = signed diff between separation and aspect angle.
  // An exact aspect is a zero crossing of d(t) = sep(moon, planet) - angle.
  const windowStart = ingressT - 3.2 * 86400000;
  let lastExact = windowStart;

  const planetsAt = (t: number) =>
    CLASSICAL.map((p) => ({ p, lon: eclipticLongitude(p, new Date(t)) }));
  const moonAt = (t: number) => eclipticLongitude("Moon", new Date(t));

  const STEP = 15 * MIN;
  let prev = { t: windowStart, moon: moonAt(windowStart), planets: planetsAt(windowStart) };

  for (let t = windowStart + STEP; t <= ingressT; t += STEP) {
    const cur = { t, moon: moonAt(t), planets: planetsAt(t) };
    for (let i = 0; i < CLASSICAL.length; i++) {
      for (const asp of ASPECTS) {
        const dPrev = sep(prev.moon, prev.planets[i].lon) - asp.angle;
        const dCur = sep(cur.moon, cur.planets[i].lon) - asp.angle;
        if (dPrev === 0 || (dPrev < 0 && dCur > 0) || (dPrev > 0 && dCur < 0)) {
          // bisect the crossing to the minute
          let lo = prev.t;
          let hi = cur.t;
          while (hi - lo > MIN) {
            const mid = (lo + hi) / 2;
            const dMid =
              sep(moonAt(mid), eclipticLongitude(CLASSICAL[i], new Date(mid))) -
              asp.angle;
            if ((dPrev < 0 && dMid < 0) || (dPrev > 0 && dMid > 0)) lo = mid;
            else hi = mid;
          }
          const exactT = (lo + hi) / 2;
          if (exactT < ingressT && exactT > lastExact) lastExact = exactT;
        }
      }
    }
    prev = cur;
  }

  return {
    startUtc: new Date(lastExact).toISOString(),
    endUtc: ingress.time.toISOString(),
    ingressSign: ingress.sign,
  };
}

/** Moon state for a reference instant; VoC reported if it overlaps [dayStart, dayEnd]. */
export function moonState(ref: Date, dayStart: Date, dayEnd: Date): MoonState {
  const angle = MoonPhase(MakeTime(ref));
  const illum = Illumination(Body.Moon, MakeTime(ref)).phase_fraction;
  const lon = eclipticLongitude("Moon", ref);

  let voc: VoidOfCourse | null = null;
  const candidate = voidOfCourseAround(dayStart);
  const s = Date.parse(candidate.startUtc);
  const e = Date.parse(candidate.endUtc);
  if (e >= dayStart.getTime() && s <= dayEnd.getTime()) {
    voc = candidate;
  } else {
    // the next VoC may still begin later this day
    const next = voidOfCourseAround(new Date(e + 30 * MIN));
    const s2 = Date.parse(next.startUtc);
    if (s2 <= dayEnd.getTime() && Date.parse(next.endUtc) >= dayStart.getTime()) {
      voc = next;
    }
  }

  return {
    phaseAngle: +angle.toFixed(2),
    phaseName: phaseName(angle),
    illumination: +illum.toFixed(3),
    sign: signOf(lon),
    voidOfCourse: voc,
  };
}

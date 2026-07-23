import { SiderealTime, MakeTime } from "astronomy-engine";
import { DateTime } from "luxon";
import {
  eclipticLongitude,
  isRetrograde,
  meanLunarNode,
  meanObliquity,
} from "./ephemeris";
import { detectAspects } from "./aspects";
import {
  ENGINE_VERSION,
  PLANETS,
  SIGNS,
  SIGN_RULERS,
  norm360,
  signOf,
  type NatalChart,
  type PlacedBody,
} from "./types";

const DEG = Math.PI / 180;

export interface BirthInput {
  date: string; // yyyy-mm-dd (local to birth place)
  time: string | null; // HH:mm, null when unknown
  lat: number;
  lng: number;
  tz: string; // IANA
}

/**
 * Ascendant from local sidereal time + obliquity + latitude.
 * RAMC = LST in degrees. Standard formula with atan2 quadrant handling.
 */
export function ascendantLongitude(date: Date, lat: number, lng: number): number {
  const gastHours = SiderealTime(MakeTime(date)); // Greenwich apparent sidereal time
  const ramc = norm360(gastHours * 15 + lng); // local sidereal time in degrees
  const eps = meanObliquity(date) * DEG;
  const ramcR = ramc * DEG;
  const latR = lat * DEG;

  const y = -Math.cos(ramcR);
  const x = Math.sin(ramcR) * Math.cos(eps) + Math.tan(latR) * Math.sin(eps);
  let asc = Math.atan2(y, x) / DEG;
  asc = norm360(asc);
  // Ascendant must lie in the half-circle east of the meridian: MC < ASC < MC+180
  const mc = midheavenLongitude(date, lng);
  if (norm360(asc - mc) > 180) asc = norm360(asc + 180);
  return asc;
}

export function midheavenLongitude(date: Date, lng: number): number {
  const gastHours = SiderealTime(MakeTime(date));
  const ramc = norm360(gastHours * 15 + lng);
  const eps = meanObliquity(date) * DEG;
  const ramcR = ramc * DEG;
  let mc = Math.atan2(Math.sin(ramcR), Math.cos(ramcR) * Math.cos(eps)) / DEG;
  mc = norm360(mc);
  return mc;
}

export function computeNatalChart(input: BirthInput): NatalChart {
  const timeKnown = input.time !== null;
  // Unknown time → cast at local noon (solar chart; ASC/houses omitted)
  const local = DateTime.fromISO(`${input.date}T${input.time ?? "12:00"}`, {
    zone: input.tz,
  });
  if (!local.isValid) {
    throw new Error(`Invalid birth datetime: ${input.date} ${input.time} ${input.tz}`);
  }
  const utc = local.toUTC().toJSDate();

  const bodies: PlacedBody[] = PLANETS.map((p) => {
    const lon = eclipticLongitude(p, utc);
    return {
      body: p,
      lon,
      sign: signOf(lon),
      degree: lon % 30,
      house: null,
      retrograde: isRetrograde(p, utc),
    };
  });

  const nodeLon = meanLunarNode(utc);
  bodies.push({
    body: "NorthNode",
    lon: nodeLon,
    sign: signOf(nodeLon),
    degree: nodeLon % 30,
    house: null,
    retrograde: true,
  });

  let ascendant: PlacedBody | null = null;
  let midheaven: PlacedBody | null = null;
  let houseAnchorSign: number; // index of sign that is house 1

  if (timeKnown) {
    const ascLon = ascendantLongitude(utc, input.lat, input.lng);
    const mcLon = midheavenLongitude(utc, input.lng);
    ascendant = {
      body: "Ascendant",
      lon: ascLon,
      sign: signOf(ascLon),
      degree: ascLon % 30,
      house: 1,
      retrograde: false,
    };
    midheaven = {
      body: "Midheaven",
      lon: mcLon,
      sign: signOf(mcLon),
      degree: mcLon % 30,
      house: null,
      retrograde: false,
    };
    houseAnchorSign = Math.floor(ascLon / 30);
  } else {
    // Solar whole-sign: Sun's sign = house 1
    houseAnchorSign = Math.floor(bodies[0].lon / 30);
  }

  for (const b of bodies) {
    const signIdx = Math.floor(b.lon / 30);
    b.house = ((signIdx - houseAnchorSign + 12) % 12) + 1;
  }
  if (midheaven) {
    const mcSign = Math.floor(midheaven.lon / 30);
    midheaven.house = ((mcSign - houseAnchorSign + 12) % 12) + 1;
  }

  const aspectBodies = ascendant ? [...bodies, ascendant] : bodies;
  const aspects = detectAspects(aspectBodies);

  const sun = bodies.find((b) => b.body === "Sun")!;
  const moon = bodies.find((b) => b.body === "Moon")!;
  const chartRuler = ascendant
    ? SIGN_RULERS[ascendant.sign]
    : SIGN_RULERS[sun.sign];

  return {
    engineVersion: ENGINE_VERSION,
    timeKnown,
    houseSystem: timeKnown ? "whole-sign" : "solar-whole-sign",
    ascendant,
    midheaven,
    bodies,
    aspects,
    bigThree: {
      sun: sun.sign,
      moon: moon.sign,
      rising: ascendant?.sign ?? null,
    },
    chartRuler,
    computedAtUtc: new Date().toISOString(),
    birth: {
      dateTimeUtc: utc.toISOString(),
      lat: input.lat,
      lng: input.lng,
      tz: input.tz,
    },
  };
}

/** Compact, token-cheap summary for AI prompts. */
export function chartSummaryForAI(chart: NatalChart): string {
  const lines = chart.bodies
    .filter((b) => b.body !== "NorthNode")
    .map(
      (b) =>
        `${b.body} ${b.sign} ${Math.floor(b.degree)}°${b.house ? ` (house ${b.house})` : ""}${b.retrograde ? " Rx" : ""}`,
    );
  if (chart.ascendant) {
    lines.push(`Rising ${chart.ascendant.sign} ${Math.floor(chart.ascendant.degree)}°`);
  }
  const majorAspects = chart.aspects
    .filter((a) => a.orb < 4)
    .slice(0, 8)
    .map((a) => `${a.a} ${a.type} ${a.b}`);
  return `${lines.join("; ")}. Key aspects: ${majorAspects.join(", ")}. Chart ruler: ${chart.chartRuler}. House system: ${chart.houseSystem}.`;
}

export { SIGNS };

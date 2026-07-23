import {
  Body,
  GeoVector,
  Ecliptic,
  EclipticGeoMoon,
  MakeTime,
} from "astronomy-engine";
import { type Planet, norm360 } from "./types";

const BODY_MAP: Record<Planet, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

/** True-ecliptic-of-date longitude for any planet (geocentric, tropical). */
export function eclipticLongitude(planet: Planet, date: Date): number {
  if (planet === "Moon") {
    return norm360(EclipticGeoMoon(MakeTime(date)).lon);
  }
  const vec = GeoVector(BODY_MAP[planet], MakeTime(date), true);
  return norm360(Ecliptic(vec).elon);
}

/** Retrograde = longitude decreasing over 24h (handles 0/360 wrap). */
export function isRetrograde(planet: Planet, date: Date): boolean {
  if (planet === "Sun" || planet === "Moon") return false;
  const now = eclipticLongitude(planet, date);
  const next = eclipticLongitude(
    planet,
    new Date(date.getTime() + 24 * 3600 * 1000),
  );
  let delta = next - now;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

/** Mean lunar north node (Meeus), true-of-date approximation. */
export function meanLunarNode(date: Date): number {
  // Julian centuries from J2000.0
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const omega =
    125.0445479 -
    1934.1362891 * T +
    0.0020754 * T * T +
    (T * T * T) / 467441 -
    (T * T * T * T) / 60616000;
  return norm360(omega);
}

/** Mean obliquity of the ecliptic (IAU 2006, arcsec series truncated). */
export function meanObliquity(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const seconds =
    84381.406 - 46.836769 * T - 0.0001831 * T * T + 0.0020034 * T * T * T;
  return seconds / 3600;
}

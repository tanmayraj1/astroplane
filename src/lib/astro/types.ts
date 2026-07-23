export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;
export type Sign = (typeof SIGNS)[number];

export const PLANETS = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
] as const;
export type Planet = (typeof PLANETS)[number];

/** Classical bodies used for void-of-course + planetary hours */
export const CLASSICAL: Planet[] = [
  "Sun",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
];

export const ASPECTS = [
  { type: "conjunction", angle: 0, symbol: "☌" },
  { type: "sextile", angle: 60, symbol: "⚹" },
  { type: "square", angle: 90, symbol: "□" },
  { type: "trine", angle: 120, symbol: "△" },
  { type: "opposition", angle: 180, symbol: "☍" },
] as const;
export type AspectType = (typeof ASPECTS)[number]["type"];

export interface PlacedBody {
  body: Planet | "NorthNode" | "Ascendant" | "Midheaven";
  lon: number; // ecliptic longitude of date, 0–360
  sign: Sign;
  degree: number; // 0–30 within sign
  house: number | null; // whole-sign house 1–12, null if no birth time
  retrograde: boolean;
}

export interface NatalAspect {
  a: PlacedBody["body"];
  b: PlacedBody["body"];
  type: AspectType;
  orb: number; // degrees from exact
}

export interface NatalChart {
  engineVersion: number;
  timeKnown: boolean;
  houseSystem: "whole-sign" | "solar-whole-sign";
  ascendant: PlacedBody | null;
  midheaven: PlacedBody | null;
  bodies: PlacedBody[];
  aspects: NatalAspect[];
  bigThree: { sun: Sign; moon: Sign; rising: Sign | null };
  chartRuler: Planet;
  computedAtUtc: string;
  birth: { dateTimeUtc: string; lat: number; lng: number; tz: string };
}

export interface TransitAspect {
  transiting: Planet;
  natal: PlacedBody["body"];
  type: AspectType;
  orb: number;
  applying: boolean;
}

export interface PlanetaryHour {
  index: number; // 0–23 across the local day
  ruler: Planet;
  startUtc: string;
  endUtc: string;
  isDay: boolean;
}

export interface VoidOfCourse {
  startUtc: string;
  endUtc: string; // = ingress
  ingressSign: Sign;
}

export interface MoonState {
  phaseAngle: number; // 0–360, 0 = new
  phaseName:
    | "New Moon"
    | "Waxing Crescent"
    | "First Quarter"
    | "Waxing Gibbous"
    | "Full Moon"
    | "Waning Gibbous"
    | "Last Quarter"
    | "Waning Crescent";
  illumination: number; // 0–1
  sign: Sign;
  voidOfCourse: VoidOfCourse | null; // VoC interval overlapping this local day, if any
}

export interface TimeWindow {
  kind: "power" | "friction";
  startUtc: string;
  endUtc: string;
  score: number;
  reasons: string[]; // machine-readable reason codes for the AI to phrase
}

export interface DailySky {
  date: string; // local yyyy-mm-dd
  tz: string;
  dayRuler: Planet;
  colorOfDay: { name: string; css: string; planet: Planet };
  sunriseUtc: string | null;
  sunsetUtc: string | null;
  planetaryHours: PlanetaryHour[];
  moon: MoonState;
  positions: { body: Planet; lon: number; sign: Sign; degree: number; retrograde: boolean }[];
  transitsToNatal: TransitAspect[]; // empty when computed without a chart
  windows: TimeWindow[];
  wake: { start: string; end: string } | null; // local HH:mm
  windDown: string | null; // local HH:mm
}

export const ENGINE_VERSION = 1;

export function signOf(lon: number): Sign {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

export function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** Smallest angular separation between two longitudes, 0–180 */
export function sep(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b)) % 360;
  return d > 180 ? 360 - d : d;
}

export const SIGN_RULERS: Record<Sign, Planet> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};
